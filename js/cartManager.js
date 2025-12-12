// js/cartManager.js
// Manages cart items stored in Supabase cart table with localStorage fallback.

export async function getCart() {
  try {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      // Fallback to localStorage
      const local = localStorage.getItem('cart');
      return local ? JSON.parse(local) : [];
    }
    
    // Fetch from Supabase
    const url = `${window.SUPABASE_URL}/rest/v1/cart?select=*`;
    const res = await fetch(url, {
      headers: {
        apikey: window.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  } catch (err) {
    console.error('Cart fetch error:', err);
    return [];
  }
}

export async function addToCart(productId, quantity = 1) {
  try {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      // Fallback to localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existing = cart.find(item => item.product_id == productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({ product_id: productId, quantity });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      return { success: true };
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
      body: JSON.stringify({ product_id: productId, quantity })
    });
    if (!res.ok) throw new Error('Failed to add to cart');
    return res.json();
  } catch (err) {
    console.error('Add to cart error:', err);
    return { error: err.message };
  }
}

export async function removeFromCart(cartId) {
  try {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      // Fallback to localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const filtered = cart.filter(item => item.id != cartId);
      localStorage.setItem('cart', JSON.stringify(filtered));
      return { success: true };
    }
    
    // Remove from Supabase
    const url = `${window.SUPABASE_URL}/rest/v1/cart?id=eq.${cartId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        apikey: window.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) throw new Error('Failed to remove from cart');
    return { success: true };
  } catch (err) {
    console.error('Remove from cart error:', err);
    return { error: err.message };
  }
}

export async function updateCartQuantity(cartId, quantity) {
  try {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      // Fallback to localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const item = cart.find(item => item.id == cartId);
      if (item) item.quantity = quantity;
      localStorage.setItem('cart', JSON.stringify(cart));
      return { success: true };
    }
    
    // Update in Supabase
    const url = `${window.SUPABASE_URL}/rest/v1/cart?id=eq.${cartId}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: window.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity })
    });
    if (!res.ok) throw new Error('Failed to update cart');
    return res.json();
  } catch (err) {
    console.error('Update cart error:', err);
    return { error: err.message };
  }
}
