// js/supabaseClient.js
// Minimal Supabase client helpers for the frontend. Requires a global
// SUPABASE_URL and SUPABASE_ANON_KEY (see supabase-config.example.js).

if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
  console.warn('Supabase config missing: create supabase-config.js with SUPABASE_URL and SUPABASE_ANON_KEY');
}

const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

// Simple fetch wrapper for Supabase REST (no auth flow)
export async function supabaseFetch(path, opts = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase not configured');
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = Object.assign({
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }, opts.headers || {});

  const res = await fetch(url + (opts.query || ''), Object.assign({}, opts, { headers }));
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Supabase request failed ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function getProducts() {
  // Fetch all products (table: products)
  return supabaseFetch('products', { query: '?select=*' });
}

export async function getProductById(id) {
  const rows = await supabaseFetch('products', { query: `?id=eq.${encodeURIComponent(id)}&select=*` });
  return rows[0] || null;
}

export async function createUser(email, password, metadata = {}) {
  // If you want to use Supabase Auth, it's better to call the REST auth endpoint.
  // Here we'll just insert a row into a "users" table as a lightweight backup approach.
  return supabaseFetch('users', {
    method: 'POST',
    body: JSON.stringify({ email, password, metadata })
  });
}

export async function addToCart(productId, quantity = 1) {
  return supabaseFetch('cart', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity })
  });
}

export default {
  getProducts,
  getProductById,
  createUser,
  addToCart
};
