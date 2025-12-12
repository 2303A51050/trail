// login.js
document.addEventListener("DOMContentLoaded", function () {
  // Retry helper to ensure header is loaded before attaching listeners
  function readyHeaderAndLoadPopup() {
    const loginIcon = document.querySelector(".userIcon");
    if (!loginIcon) {
      // if header not yet loaded, retry after 100ms
      setTimeout(readyHeaderAndLoadPopup, 100);
      return;
    }

    // Create a container for the popup
    const loginContainer = document.createElement("div");
    // keep it off-document until we append the popup element

    // Fetch login.html dynamically
    fetch("login.html")
      .then(res => {
        if (!res.ok) throw new Error("login.html not found");
        return res.text();
      })
      .then(html => {
        // Parse the fetched HTML and extract only the popup fragment to avoid importing the whole page (header/footer)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const popupFragment = doc.getElementById("authPopup");

        // Append only the popup to the body. If not found, fall back to inserting the full HTML
        if (popupFragment) {
          loginContainer.appendChild(popupFragment.cloneNode(true));
          // Copy popup-related <style> blocks from the fetched doc so popup keeps its styles
          const styleTags = Array.from(doc.querySelectorAll('style'));
          styleTags.forEach(style => {
            const text = style.textContent || '';
            // Heuristic: only copy styles that mention popup/login related selectors
            if (/authPopup|popup|loginForm|signupForm|close-btn|toggle-text/.test(text)) {
              const newStyle = document.createElement('style');
              newStyle.textContent = text;
              document.head.appendChild(newStyle);
            }
          });
          document.body.appendChild(loginContainer);
        } else {
          // fallback: insert full fetched content (should rarely happen)
          loginContainer.innerHTML = html;
          document.body.appendChild(loginContainer);
        }

        const popup = document.getElementById("authPopup");
        const closeBtn = document.getElementById("closePopup");
        const loginFormContainer = document.getElementById("loginFormContainer");
        const signupFormContainer = document.getElementById("signupFormContainer");
        const showSignup = document.getElementById("showSignup");
        const showLogin = document.getElementById("showLogin");

        // Helper to calculate scrollbar width at the moment the modal opens
        function getScrollbarWidth() {
          return window.innerWidth - document.documentElement.clientWidth;
        }

        // --- FUNCTIONS ---
        function openPopup() {
          if (!popup) return;
          popup.style.display = "flex";
          // Prevent scroll and compensate for removed scrollbar to avoid layout shift
          const scrollbarWidth = getScrollbarWidth();
          document.body.style.paddingRight = scrollbarWidth ? `${scrollbarWidth}px` : "";
          document.body.classList.add("modal-open");
          loginFormContainer.classList.remove("hidden");
          signupFormContainer.classList.add("hidden");
        }

        function closePopup() {
          if (!popup) return;
          popup.style.display = "none";
          document.body.classList.remove("modal-open"); // Re-enable scroll
          // remove any compensation
          document.body.style.paddingRight = "";
        }

        // --- EVENT BINDINGS ---
        // Open popup on user icon click
        loginIcon.addEventListener("click", function (e) {
          e.preventDefault();
          openPopup();
        });

        // Close popup
        closeBtn.addEventListener("click", closePopup);

        // Close when clicking outside content
        popup.addEventListener("click", function (e) {
          if (e.target === popup) closePopup();
        });

        // Switch to Sign Up form
        showSignup.addEventListener("click", function (e) {
          e.preventDefault();
          loginFormContainer.classList.add("hidden");
          signupFormContainer.classList.remove("hidden");
        });

        // Switch back to Login form
        showLogin.addEventListener("click", function (e) {
          e.preventDefault();
          signupFormContainer.classList.add("hidden");
          loginFormContainer.classList.remove("hidden");
        });

        // Initialize Supabase Auth (if config is available)
        const supabaseUrl = window.SUPABASE_URL;
        const supabaseAnonKey = window.SUPABASE_ANON_KEY;

        // Debug: check if Supabase is configured
        if (!supabaseUrl || !supabaseAnonKey) {
          console.warn('⚠️ Supabase config missing: window.SUPABASE_URL or window.SUPABASE_ANON_KEY not defined. Check if supabase-config.js was loaded before login.js');
        }

        // Function to save user details to custom users table
        async function saveUserToDatabase(email, password, name) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase not configured');
  }
  
  try {
    // Check if user already exists
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing && existing.length) {
        console.log('User already exists, returning existing record');
        return existing[0];
      }
    } else {
      console.warn('Could not verify existing user, status:', checkRes.status);
    }

    // Insert new user
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, metadata: { name } })
    });

    if (insertRes.ok) {
      const inserted = await insertRes.json();
      return Array.isArray(inserted) ? inserted[0] : inserted;
    }

    // Handle empty response body
    if (insertRes.status === 204 || insertRes.status === 400) {
      console.warn('Empty response body, status:', insertRes.status);
      return null;
    }

    // Handle duplicate / conflict gracefully
    if (insertRes.status === 409) {
      const fallback = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (fallback.ok) {
        const data = await fallback.json();
        if (data && data.length) return data[0];
      }
    }

    // Other failures -> read text and throw for visible debug
    const txt = await insertRes.text();
    throw new Error(`Failed to save user (${insertRes.status}): ${txt}`);
  } catch (err) {
    console.error('saveUserToDatabase error:', err);
    throw err;
  }
}

        // Helper to call Supabase Auth REST endpoints
        async function supabaseAuth(action, email, password) {
          if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase not configured');
          const url = `${supabaseUrl}/auth/v1/${action}`;
          console.log('Attempting auth at:', url);

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
          });

          console.log('Response status:', res.status);
          const contentType = res.headers.get('content-type');
          console.log('Response content-type:', contentType);

          let data;

          if (contentType && contentType.includes('application/json')) {
            data = await res.json();
          } else {
            const text = await res.text();
            console.error('Non-JSON response from Supabase:', text);
            console.error('Status:', res.status);
            throw new Error(`Server returned ${res.status}: ${text}`);
          }

          console.log('Auth response data:', data);

          if (!res.ok) {
            const errorMsg = data.message || data.error_description || data.error || JSON.stringify(data);
            throw new Error(errorMsg);
          }
          return data;
        }

        // Handle Login form submission
        const loginForm = document.getElementById("loginForm");
        loginForm.addEventListener("submit", async function (e) {
          e.preventDefault();
          const email = document.getElementById("loginEmail").value;
          const password = document.getElementById("loginPassword").value;

          try {
            if (supabaseUrl && supabaseAnonKey) {
              // Try Supabase Auth first
              try {
                const data = await supabaseAuth('signin', email, password);
                localStorage.setItem('supabaseSession', JSON.stringify(data));
                localStorage.setItem('loggedInUser', email);
                alert(`Welcome back, ${email}!`);
                updateUserIcon();
                closePopup();
              } catch (supabaseErr) {
                console.warn('Supabase auth failed, falling back to localStorage:', supabaseErr);
                // Fallback to localStorage if Supabase fails
                localStorage.setItem("loggedInUser", email);
                alert(`Login stored locally (Supabase unavailable). Welcome, ${email}!`);
                closePopup();
              }
            } else {
              // No Supabase config - use localStorage
              localStorage.setItem("loggedInUser", email);
              alert("Login successful (local storage)!");
              closePopup();
            }
          } catch (error) {
            alert("Login failed: " + error.message);
          }
        });

        // Handle Signup form submission
        const signupForm = document.getElementById("signupForm");
        signupForm.addEventListener("submit", async function (e) {
          e.preventDefault();
          const email = document.getElementById("signupEmail").value;
          const password = document.getElementById("signupPassword").value;
          const name = document.getElementById("signupName").value;

          try {
            if (supabaseUrl && supabaseAnonKey) {
              // Try Supabase Auth first
              try {
                const data = await supabaseAuth('signup', email, password);
                localStorage.setItem('supabaseSession', JSON.stringify(data));
                localStorage.setItem('loggedInUser', email);

                // Also save user details to custom users table
                await saveUserToDatabase(email, password, name);

                alert(`Signup successful! Welcome, ${email}`);
                updateUserIcon();
                closePopup();
              } catch (supabaseErr) {
                console.warn('Supabase signup failed:', supabaseErr);

                // Try to save to custom users table as fallback
                try {
                  await saveUserToDatabase(email, password, name);
                  localStorage.setItem('loggedInUser', email);
                  alert(`Signup successful! User saved to database. Welcome, ${email}!`);
                  closePopup();
                } catch (dbErr) {
                  console.error('Failed to save user to database:', dbErr);
                  alert('Signup failed: ' + dbErr.message);
                }
              }
            } else {
              // No Supabase config - save to custom table directly
              await saveUserToDatabase(email, password, name);
              localStorage.setItem("loggedInUser", email);
              alert("Signup successful! Welcome, " + name);
              closePopup();
            }
          } catch (error) {
            alert("Signup failed: " + error.message);
          }
        });

        // Check if user is already logged in
        function updateUserIcon() {
          const session = localStorage.getItem('supabaseSession');
          const loggedInUser = localStorage.getItem('loggedInUser');
          if (session || loggedInUser) {
            // User is logged in — optionally show logout option
            console.log('User logged in:', loggedInUser);
            // TODO: Add a logout button or indicator in the UI
          }
        }

        // On init, check session
        updateUserIcon();
      })
      .catch(err => {
        console.error("Login popup load failed:", err);
      });
  }

  // Initialize after DOM is loaded
  readyHeaderAndLoadPopup();
});
// ...existing code...

async function saveUserToDatabase(user) {
  const url = `${window.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/users`;
  const headers = {
    'apikey': window.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    // 1) check if user already exists
    const checkRes = await fetch(`${url}?email=eq.${encodeURIComponent(user.email)}`, { headers });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing && existing.length) {
        console.log('User already exists, returning existing record');
        return existing[0];
      }
    } else {
      console.warn('Could not verify existing user, status:', checkRes.status);
    }

    // 2) try insert
    const insertRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(user)
    });

    if (insertRes.ok) {
      const inserted = await insertRes.json();
      return Array.isArray(inserted) ? inserted[0] : inserted;
    }

    // 3) handle duplicate / conflict gracefully
    if (insertRes.status === 409 || insertRes.status === 400) {
      const fallback = await fetch(`${url}?email=eq.${encodeURIComponent(user.email)}`, { headers });
      if (fallback.ok) {
        const data = await fallback.json();
        if (data && data.length) return data[0];
      }
    }

    // 4) other failures -> read text and throw for visible debug
    const txt = await insertRes.text();
    throw new Error(`Failed to save user (${insertRes.status}): ${txt}`);
  } catch (err) {
    console.error('saveUserToDatabase error:', err);
    throw err;
  }
}

// ...existing code...