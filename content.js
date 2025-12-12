// console.clear();

let contentTitle;

console.log(document.cookie);

// Import cart functions
async function addItemToCart(productId, productName) {
  try {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      // Fallback to localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existing = cart.find(item => item.product_id == productId);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ product_id: productId, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      alert(`${productName} added to cart!`);
      updateBadge();
      return;
    }
    
    // Add to Supabase
    const url = `${window.SUPABASE_URL}/rest/v1/cart`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: window.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ product_id: productId, quantity: 1 })
    });
    if (!res.ok) throw new Error('Failed to add to cart');
    alert(`${productName} added to cart!`);
    updateBadge();
  } catch (err) {
    console.error('Add to cart error:', err);
    alert('Error adding to cart: ' + err.message);
  }
}

function updateBadge() {
  const badgeEl = document.getElementById('badge');
  if (!badgeEl) return;
  
  try {
    if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      // Fetch cart items from Supabase
      const url = `${window.SUPABASE_URL}/rest/v1/cart?select=quantity`;
      fetch(url, {
        headers: {
          apikey: window.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
        }
      })
        .then(r => {
          if (!r.ok) throw new Error('Failed to fetch cart');
          return r.json();
        })
        .then(data => {
          // Sum all quantities in cart
          const totalItems = Array.isArray(data) ? data.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
          badgeEl.innerHTML = totalItems;
          console.log('Cart badge updated:', totalItems);
        })
        .catch(err => {
          console.error('Error fetching cart:', err);
          // Fallback to localStorage
          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
          badgeEl.innerHTML = total;
        });
    } else {
      // Use localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      badgeEl.innerHTML = total;
    }
  } catch (err) {
    console.error('Update badge error:', err);
  }
}

function dynamicClothingSection(ob) {
  let boxDiv = document.createElement("div");
  boxDiv.id = "box";

  let boxLink = document.createElement("a");
  // FIX: Ensure product ID is correctly passed
  boxLink.href = `/contentDetails.html?id=${ob.id}`;
  console.log('Created link for product:', ob.id, 'Name:', ob.name);

  let imgTag = document.createElement("img");
  imgTag.src = ob.preview;

  let detailsDiv = document.createElement("div");
  detailsDiv.id = "details";

  let h3 = document.createElement("h3");
  let h3Text = document.createTextNode(ob.name);
  h3.appendChild(h3Text);

  let h4 = document.createElement("h4");
  let h4Text = document.createTextNode(ob.brand);
  h4.appendChild(h4Text);

  let h2 = document.createElement("h2");
  let h2Text = document.createTextNode("rs  " + ob.price);
  h2.appendChild(h2Text);

  // Add "Add to Cart" button
  let addToCartBtn = document.createElement("button");
  addToCartBtn.textContent = "Add to Cart";
  addToCartBtn.style.cssText = "margin-top: 10px; padding: 8px 12px; background: #037a7a; color: white; border: none; border-radius: 5px; cursor: pointer;";
  addToCartBtn.addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    addItemToCart(ob.id, ob.name);
  });

  boxDiv.appendChild(boxLink);
  boxLink.appendChild(imgTag);
  boxLink.appendChild(detailsDiv);
  detailsDiv.appendChild(h3);
  detailsDiv.appendChild(h4);
  detailsDiv.appendChild(h2);
  detailsDiv.appendChild(addToCartBtn);

  return boxDiv;
}

//  Initialize products when DOM is ready
function initializeProducts() {
  // Re-grab containers to ensure they exist
  const containerClothing = document.getElementById("containerClothing");
  
  if (!containerClothing) {
    console.warn('containerClothing not found on this page');
    return;
  }

  // ONLY USE SUPABASE - Remove MockAPI fallback
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    const msg = document.createElement('div');
    msg.style.padding = '20px';
    msg.style.color = '#d32f2f';
    msg.style.textAlign = 'center';
    msg.textContent = 'Error: Supabase not configured. Check supabase-config.js';
    containerClothing.appendChild(msg);
    console.error('Supabase configuration missing!');
    return;
  }

  const url = `${window.SUPABASE_URL}/rest/v1/products?select=*`;
  console.log('Fetching products from Supabase:', url);

  fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
    }
  })
    .then(r => {
      console.log('Supabase response status:', r.status);
      if (!r.ok) throw new Error('Supabase products fetch failed ' + r.status);
      return r.json();
    })
    .then(data => {
      console.log('All products from Supabase:', data);
      
      if (!Array.isArray(data) || data.length === 0) {
        const msg = document.createElement('div');
        msg.style.padding = '20px';
        msg.style.textAlign = 'center';
        msg.textContent = 'No products available';
        containerClothing.appendChild(msg);
        return;
      }

      // Filter and render clothing products only
      let addedClothing = 0;
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        // Only render clothing items (isAccessory = false or undefined)
        if (!item.isAccessory) { 
          containerClothing.appendChild(dynamicClothingSection(item)); 
          addedClothing++; 
        }
      }
      console.log('Rendered:', addedClothing, 'clothing items');
      updateBadge();
    })
    .catch(err => {
      console.error('Products fetch error:', err);
      const msg = document.createElement('div');
      msg.style.padding = '20px';
      msg.style.color = '#d32f2f';
      msg.style.textAlign = 'center';
      msg.textContent = 'Error loading products: ' + err.message;
      containerClothing.appendChild(msg);
    });
}

// Initialize products when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProducts);
} else {
  // DOM already loaded (e.g., script loaded after HTML)
  initializeProducts();
}

// No global scrollbar compensation here — handled in login module when modal opens