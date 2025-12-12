// patched content.js
// Based on your original file (reference). Key fixes:
//  - use relative link (no leading '/')
//  - avoid duplicate IDs for repeated elements (use classes instead)
//  - img alt added, better logging, badge fallback handling
// Original file reviewed: content.js. :contentReference[oaicite:1]{index=1}

console.clear();

console.log(document.cookie);

// Add-to-cart (supabase REST, with localStorage fallback)
async function addItemToCart(productId, productName) {
  try {
    // If supabase config missing, use localStorage fallback
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existing = cart.find(item => item.product_id == productId);
      if (existing) existing.quantity += 1;
      else cart.push({ product_id: productId, quantity: 1 });
      localStorage.setItem('cart', JSON.stringify(cart));
      alert(`${productName} added to cart (local).`);
      updateBadge();
      return;
    }

    // Insert into Supabase cart table via REST
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

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to add to cart (${res.status}): ${body}`);
    }

    alert(`${productName} added to cart.`);
    updateBadge();
  } catch (err) {
    console.error('Add to cart error:', err);
    alert('Error adding to cart: ' + err.message);
  }
}

function updateBadge() {
  const badgeEl = document.getElementById('badge');
  if (!badgeEl) {
    // Header might not be present on all pages — that's OK
    console.debug('Badge element (#badge) not found; skipping badge update.');
    return;
  }

  // If supabase config present, fetch cart rows and sum quantities
  if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    const url = `${window.SUPABASE_URL}/rest/v1/cart?select=quantity`;
    fetch(url, {
      headers: {
        apikey: window.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
      }
    })
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch cart: ' + r.status);
        return r.json();
      })
      .then(data => {
        const totalItems = Array.isArray(data) ? data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : 0;
        badgeEl.textContent = totalItems;
        console.log('Cart badge updated (server):', totalItems);
      })
      .catch(err => {
        console.warn('Error fetching cart from server, falling back to localStorage:', err);
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const total = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        badgeEl.textContent = total;
      });
  } else {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const total = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    badgeEl.textContent = total;
    console.log('Cart badge updated (local):', total);
  }
}

// Create a product card for clothing listing
function dynamicClothingSection(ob) {
  const boxDiv = document.createElement("div");
  boxDiv.className = "box";

  const boxLink = document.createElement("a");
  // IMPORTANT: use relative path (project site safe) and encode the id
  boxLink.href = "contentDetails.html?id=" + encodeURIComponent(ob.id);
  boxLink.className = "productLink";
  boxLink.setAttribute('aria-label', `View details for ${ob.name}`);

  const imgTag = document.createElement("img");
  imgTag.src = ob.preview || '';
  imgTag.alt = ob.name || 'Product image';
  imgTag.loading = 'lazy';

  const detailsDiv = document.createElement("div");
  detailsDiv.className = "details";

  const h3 = document.createElement("h3");
  h3.textContent = ob.name || 'Untitled';

  const h4 = document.createElement("h4");
  h4.textContent = ob.brand || '';

  const h2 = document.createElement("h2");
  h2.textContent = "Rs " + (ob.price != null ? ob.price : '—');

  // Add "Add to Cart" button — placed inside details but preventing navigation
  const addToCartBtn = document.createElement("button");
  addToCartBtn.type = "button";
  addToCartBtn.textContent = "Add to Cart";
  addToCartBtn.style.cssText = "margin-top:10px;padding:8px 12px;background:#037a7a;color:#fff;border:none;border-radius:5px;cursor:pointer;";
  addToCartBtn.addEventListener("click", function (e) {
    e.preventDefault();      // prevent anchor navigation when button clicked
    e.stopPropagation();     // stop event from bubbling to anchor
    addItemToCart(ob.id, ob.name);
  });

  // Build DOM
  boxDiv.appendChild(boxLink);
  boxLink.appendChild(imgTag);
  boxLink.appendChild(detailsDiv);
  detailsDiv.appendChild(h3);
  detailsDiv.appendChild(h4);
  detailsDiv.appendChild(h2);
  detailsDiv.appendChild(addToCartBtn);

  return boxDiv;
}

// Initialize products when DOM is ready
function initializeProducts() {
  const containerClothing = document.getElementById("containerClothing");
  if (!containerClothing) {
    console.warn('containerClothing not found on this page — skipping product render.');
    return;
  }

  // Ensure Supabase config is present; show message if not
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

      let addedClothing = 0;
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        // Render items that aren't accessories. Be liberal with casing.
        const accessoryFlag = item.isAccessory === true || item.isaccessory === true;
        if (!accessoryFlag) {
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

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProducts);
} else {
  initializeProducts();
}
