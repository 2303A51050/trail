// js/cart-loader.js
// ES module to load and display cart items with product details from Supabase.

import { getCart, removeFromCart, updateCartQuantity } from './cartManager.js';
import { showCheckoutModal } from './checkout.js';

async function loadCart() {
  const cartContainer = document.getElementById('cartContainer');
  const totalItemEl = document.getElementById('totalItem');
  
  if (!cartContainer) return;
  
  try {
    // Fetch cart items
    const cartItems = await getCart();
    
    if (!cartItems || cartItems.length === 0) {
      cartContainer.innerHTML = '<p>Your cart is empty.</p>';
      totalItemEl.textContent = 'Total Items: 0';
      return;
    }
    
    // Fetch product details for each cart item
    const productIds = cartItems.map(item => item.product_id);
    const products = await fetchProducts(productIds);
    
    let total = 0;
    let html = '';
    
    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.product_id);
      if (!product) continue;
      
      const subtotal = (product.price || 0) * cartItem.quantity;
      total += subtotal;
      
      html += `
        <div id="boxContainer">
          <div id="box">
            <img src="${product.preview || 'img/placeholder.png'}" alt="${product.name}">
            <div>
              <h3>${product.name}</h3>
              <h4>${product.brand || 'Brand'}</h4>
              <h2>Rs ${product.price}</h2>
              <div>
                <label>Qty: </label>
                <input type="number" min="1" value="${cartItem.quantity}" 
                  data-cart-id="${cartItem.id}" class="qty-input" style="width: 50px;">
                <button class="remove-btn" data-cart-id="${cartItem.id}">Remove</button>
              </div>
              <p>Subtotal: Rs ${subtotal}</p>
            </div>
          </div>
        </div>
      `;
    }
    
    cartContainer.innerHTML = html;
    totalItemEl.textContent = `Total Items: ${cartItems.length}`;
    
    // Attach event listeners for quantity change and remove
    document.querySelectorAll('.qty-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const cartId = e.target.dataset.cartId;
        const qty = parseInt(e.target.value) || 1;
        await updateCartQuantity(cartId, qty);
        loadCart(); // Reload to update totals
      });
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const cartId = e.target.dataset.cartId;
        await removeFromCart(cartId);
        loadCart(); // Reload
      });
    });
    
    // Show total
    const totalBox = document.createElement('div');
    totalBox.id = 'totalContainer';
    totalBox.innerHTML = `
      <h2>Total: Rs ${total}</h2>
      <button id="checkoutBtn">Checkout</button>
    `;
    cartContainer.appendChild(totalBox);

    // Add checkout button event listener
    document.getElementById('checkoutBtn').addEventListener('click', async () => {
      await showCheckoutModal(cartItems, total);
    });
    
  } catch (err) {
    console.error('Load cart error:', err);
    cartContainer.innerHTML = '<p>Error loading cart. Please refresh.</p>';
  }
}

async function fetchProducts(productIds) {
  // Fetch product details from Supabase (or mock API)
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    // Fallback to mock API
    return [];
  }
  
  const url = `${window.SUPABASE_URL}/rest/v1/products?id=in.(${productIds.join(',')})&select=*`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: window.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  } catch (err) {
    console.error('Fetch products error:', err);
    return [];
  }
}

// Load cart on page load
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  // Update badge after cart is loaded
  if (window.updateBadge) {
    window.updateBadge();
  }
});
