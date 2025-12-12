// js/checkout.js
// Checkout modal functionality with address and payment management

export async function showCheckoutModal(cartItems, total) {
  const modal = document.createElement('div');
  modal.id = 'checkoutModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 10px;
    padding: 30px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  // Load user's addresses
  const addresses = await fetchUserAddresses();
  console.log('Checkout modal loading with addresses:', addresses);
  
  
  let html = `
    <h2 style="text-align: center; color: #037a7a; margin-bottom: 20px;">Checkout</h2>
    
    <div style="margin-bottom: 20px;">
      <h3 style="color: #333;">Select Address</h3>
      <div id="addressList" style="margin-bottom: 10px;">
  `;

  if (addresses.length > 0) {
    addresses.forEach((addr, index) => {
      html += `
        <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1; cursor: pointer;" onclick="document.querySelector('input[value=\\"${index}\\"]').checked = true;">
            <input type="radio" name="address" value="${index}" style="margin-right: 10px;">
            <strong>${addr.name}</strong><br>
            ${addr.street}, ${addr.city} - ${addr.zip}<br>
            <small>${addr.phone}</small>
          </div>
          <button type="button" class="removeAddressBtn" data-index="${index}" style="padding: 5px 10px; background: #d32f2f; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; white-space: nowrap; margin-left: 10px;">
            Remove
          </button>
        </div>
      `;
    });
  } else {
    html += `<p style="color: #999;">No addresses saved yet.</p>`;
  }

  html += `
      </div>
      <button id="addNewAddressBtn" style="width: 100%; padding: 10px; background: #037a7a; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
        + Add New Address
      </button>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="color: #333;">Select Payment Method</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="radio" name="payment" value="credit_card" checked style="margin-right: 10px;">
          <i class="fas fa-credit-card" style="margin-right: 10px; color: #037a7a;"></i> Credit/Debit Card
        </label>
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="radio" name="payment" value="upi" style="margin-right: 10px;">
          <i class="fas fa-mobile-alt" style="margin-right: 10px; color: #037a7a;"></i> UPI
        </label>
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="radio" name="payment" value="netbanking" style="margin-right: 10px;">
          <i class="fas fa-university" style="margin-right: 10px; color: #037a7a;"></i> Net Banking
        </label>
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="radio" name="payment" value="cod" style="margin-right: 10px;">
          <i class="fas fa-money-bill-wave" style="margin-right: 10px; color: #037a7a;"></i> Cash on Delivery
        </label>
      </div>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
      <h3 style="color: #333; margin-top: 0;">Order Summary</h3>
      <p><strong>Total Items:</strong> ${cartItems.length}</p>
      <p style="font-size: 18px; color: #037a7a;"><strong>Total: Rs ${total}</strong></p>
    </div>

    <div style="display: flex; gap: 10px;">
      <button id="cancelCheckout" style="flex: 1; padding: 12px; background: #ddd; color: #333; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">
        Cancel
      </button>
      <button id="placeOrderBtn" style="flex: 1; padding: 12px; background: #037a7a; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">
        Place Order
      </button>
    </div>
  `;

  modalContent.innerHTML = html;
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Event listeners
  document.getElementById('cancelCheckout').addEventListener('click', () => {
    modal.remove();
  });

  // Add remove button listeners for addresses
  document.querySelectorAll('.removeAddressBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      console.log('Removing address at index:', index);
      await removeAddress(index);
      console.log('Address removed, reopening checkout');
      modal.remove();
      // Reopen checkout with updated addresses
      await showCheckoutModal(cartItems, total);
    });
  });

  document.getElementById('addNewAddressBtn').addEventListener('click', () => {
    showAddAddressForm(modal, addresses, total, cartItems);
  });

  document.getElementById('placeOrderBtn').addEventListener('click', async () => {
    const selectedAddressRadio = document.querySelector('input[name="address"]:checked');
    const selectedPayment = document.querySelector('input[name="payment"]:checked').value;

    if (!selectedAddressRadio && addresses.length > 0) {
      alert('Please select an address');
      return;
    }

    const selectedAddressIndex = selectedAddressRadio ? parseInt(selectedAddressRadio.value) : null;
    const address = addresses[selectedAddressIndex] || null;

    if (!address) {
      alert('Please add an address first');
      return;
    }

    // Place order
    await placeOrder(cartItems, total, address, selectedPayment, modal);
  });
}

async function fetchUserAddresses() {
  // First check localStorage
  const localAddresses = localStorage.getItem('userAddresses');
  if (localAddresses) {
    try {
      const addresses = JSON.parse(localAddresses);
      console.log('Addresses loaded from localStorage:', addresses);
      return addresses;
    } catch (err) {
      console.error('Error parsing localStorage addresses:', err);
    }
  }

  // Then try Supabase
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.log('Supabase not configured, using localStorage only');
    return [];
  }

  try {
    const res = await fetch(`${window.SUPABASE_URL}/rest/v1/addresses?select=*`, {
      headers: {
        apikey: window.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch addresses');
    const addresses = await res.json();
    console.log('Addresses loaded from Supabase:', addresses);
    return addresses;
  } catch (err) {
    console.error('Fetch addresses error:', err);
    return [];
  }
}

async function saveAddress(address) {
  // Always save to localStorage first (reliable)
  const saved = localStorage.getItem('userAddresses') || '[]';
  const addresses = JSON.parse(saved);
  addresses.push(address);
  localStorage.setItem('userAddresses', JSON.stringify(addresses));
  console.log('Address saved to localStorage:', address);

  // Also try to save to Supabase if available
  if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(`${window.SUPABASE_URL}/rest/v1/addresses`, {
        method: 'POST',
        headers: {
          apikey: window.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(address)
      });
      if (!res.ok) {
        console.warn('Supabase save failed:', res.status, await res.text());
      } else {
        console.log('Address saved to Supabase');
      }
    } catch (err) {
      console.warn('Supabase save error (using localStorage):', err);
    }
  }

  return address;
}

async function removeAddress(index) {
  console.log('removeAddress called with index:', index);
  
  // Remove from localStorage
  const saved = localStorage.getItem('userAddresses') || '[]';
  const addresses = JSON.parse(saved);
  
  console.log('Current addresses before removal:', addresses);
  
  if (index >= 0 && index < addresses.length) {
    const removed = addresses.splice(index, 1);
    localStorage.setItem('userAddresses', JSON.stringify(addresses));
    console.log('Address removed from localStorage:', removed[0]);
    console.log('Remaining addresses:', addresses);
    
    // Also try to remove from Supabase if available
    if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && removed[0].id) {
      try {
        const response = await fetch(`${window.SUPABASE_URL}/rest/v1/addresses?id=eq.${removed[0].id}`, {
          method: 'DELETE',
          headers: {
            apikey: window.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
          }
        });
        if (response.ok) {
          console.log('Address removed from Supabase');
        } else {
          console.warn('Failed to remove from Supabase:', response.status);
        }
      } catch (err) {
        console.warn('Supabase removal error (using localStorage):', err);
      }
    }
  } else {
    console.warn('Invalid address index:', index, 'Total addresses:', addresses.length);
  }
}

function showAddAddressForm(parentModal, addresses, total, cartItems) {
  const formModal = document.createElement('div');
  formModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1001;
  `;

  const formContent = document.createElement('div');
  formContent.style.cssText = `
    background: white;
    border-radius: 10px;
    padding: 30px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  formContent.innerHTML = `
    <h3 style="color: #037a7a; margin-bottom: 20px;">Add New Address</h3>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">Full Name:</label>
      <input type="text" id="addrName" placeholder="John Doe" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
    </div>

    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">Street Address:</label>
      <input type="text" id="addrStreet" placeholder="123 Main St" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">City:</label>
        <input type="text" id="addrCity" placeholder="New York" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
      </div>
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">ZIP Code:</label>
        <input type="text" id="addrZip" placeholder="10001" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">Phone Number:</label>
      <input type="tel" id="addrPhone" placeholder="+91 XXXXXXXXXX" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
    </div>

    <div style="display: flex; gap: 10px;">
      <button id="cancelAddressForm" style="flex: 1; padding: 10px; background: #ddd; color: #333; border: none; border-radius: 5px; cursor: pointer;">
        Cancel
      </button>
      <button id="saveAddressBtn" style="flex: 1; padding: 10px; background: #037a7a; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
        Save Address
      </button>
    </div>
  `;

  formModal.appendChild(formContent);
  document.body.appendChild(formModal);

  document.getElementById('cancelAddressForm').addEventListener('click', () => {
    formModal.remove();
  });

  document.getElementById('saveAddressBtn').addEventListener('click', async () => {
    const name = document.getElementById('addrName').value.trim();
    const street = document.getElementById('addrStreet').value.trim();
    const city = document.getElementById('addrCity').value.trim();
    const zip = document.getElementById('addrZip').value.trim();
    const phone = document.getElementById('addrPhone').value.trim();

    console.log('Saving address:', { name, street, city, zip, phone });

    if (!name || !street || !city || !zip || !phone) {
      alert('Please fill all fields');
      return;
    }

    const address = { name, street, city, zip, phone };
    await saveAddress(address);

    console.log('Address saved, closing modals and reopening checkout');
    alert('Address saved successfully!');
    formModal.remove();
    parentModal.remove();
    
    // Reopen checkout with updated addresses
    await showCheckoutModal(cartItems, total);
  });
}

async function placeOrder(cartItems, total, address, paymentMethod, modal) {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    // Fallback: save order to localStorage
    const order = {
      id: Date.now(),
      items: cartItems,
      total: total,
      address: address,
      payment_method: paymentMethod,
      status: 'completed',
      created_at: new Date().toISOString()
    };
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear cart from localStorage
    localStorage.removeItem('cart');

    // Show success and redirect
    showOrderPlacedModal(modal, order);
    return;
  }

  try {
    // Save order to Supabase
    const orderData = {
      items: JSON.stringify(cartItems),
      total: total,
      address: JSON.stringify(address),
      payment_method: paymentMethod,
      status: 'pending'
    };

    console.log('Placing order with data:', orderData);

    const res = await fetch(`${window.SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        apikey: window.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orderData)
    });

    console.log('Order response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to place order (${res.status}): ${errorText}`);
    }

    // Try to parse response
    let order;
    const responseText = await res.text();
    
    if (responseText) {
      try {
        const parsed = JSON.parse(responseText);
        order = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch (e) {
        console.warn('Could not parse order response, creating local copy');
        // If response is empty or invalid, create a local order object
        order = {
          id: Date.now(),
          items: cartItems,
          total: total,
          address: address,
          payment_method: paymentMethod,
          status: 'pending'
        };
      }
    } else {
      // Empty response - create local order
      order = {
        id: Date.now(),
        items: cartItems,
        total: total,
        address: address,
        payment_method: paymentMethod,
        status: 'pending'
      };
    }

    console.log('Order created:', order);

    // Clear cart from Supabase
    if (cartItems.length > 0) {
      const cartIds = cartItems.map(item => item.id).filter(id => id);
      for (const cartId of cartIds) {
        try {
          await fetch(`${window.SUPABASE_URL}/rest/v1/cart?id=eq.${cartId}`, {
            method: 'DELETE',
            headers: {
              apikey: window.SUPABASE_ANON_KEY,
              Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
            }
          });
        } catch (err) {
          console.warn('Failed to delete cart item:', err);
        }
      }
    }

    // Clear cart from localStorage as well
    localStorage.removeItem('cart');

    showOrderPlacedModal(modal, order);
  } catch (err) {
    console.error('Place order error:', err);
    alert('Error placing order: ' + err.message);
  }
}

function showOrderPlacedModal(parentModal, order) {
  parentModal.remove();

  const successModal = document.createElement('div');
  successModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  const successContent = document.createElement('div');
  successContent.style.cssText = `
    background: white;
    border-radius: 10px;
    padding: 40px;
    width: 90%;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  // Parse address if it's a string (JSON from database)
  let addressData = order.address;
  if (typeof addressData === 'string') {
    try {
      addressData = JSON.parse(addressData);
    } catch (e) {
      addressData = {};
    }
  }

  const addressName = addressData?.name || order.address_name || 'N/A';

  successContent.innerHTML = `
    <div style="font-size: 60px; color: #4caf50; margin-bottom: 20px; animation: scaleIn 0.5s ease-out;">
      <i class="fas fa-check-circle"></i>
    </div>
    
    <h2 style="color: #333; margin-bottom: 10px;">✓ Order Placed Successfully!</h2>
    
    <p style="color: #666; margin-bottom: 20px;">
      Thank you for your order. Your order ID is<br>
      <strong style="font-size: 18px; color: #037a7a;">#${order.id || Date.now()}</strong>
    </p>

    <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: left; border-left: 4px solid #4caf50;">
      <p style="margin: 8px 0;"><strong>Order Total:</strong> Rs ${order.total || 0}</p>
      <p style="margin: 8px 0;"><strong>Payment Method:</strong> ${order.payment_method || 'N/A'}</p>
      <p style="margin: 8px 0;"><strong>Delivery Address:</strong> ${addressName}</p>
    </div>

    <p style="color: #999; font-size: 13px; margin-bottom: 20px; line-height: 1.5;">
      ✉️ You will receive an email confirmation shortly.<br>
      📦 Your order will be delivered within 3-5 business days.
    </p>

    <p style="color: #999; font-size: 12px; margin-bottom: 20px;">
      Redirecting to home page in <span id="countdown">3</span> seconds...
    </p>

    <button id="continueShoppingBtn" style="width: 100%; padding: 12px; background: #037a7a; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">
      Return to Home
    </button>

    <style>
      @keyframes scaleIn {
        from {
          transform: scale(0);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
    </style>
  `;

  successModal.appendChild(successContent);
  document.body.appendChild(successModal);

  // Countdown and auto-redirect
  let count = 3;
  const countdownEl = document.getElementById('countdown');
  const countdownInterval = setInterval(() => {
    count--;
    if (countdownEl) {
      countdownEl.textContent = count;
    }
    if (count <= 0) {
      clearInterval(countdownInterval);
      redirectToHome();
    }
  }, 1000);

  document.getElementById('continueShoppingBtn').addEventListener('click', redirectToHome);

  function redirectToHome() {
    successModal.remove();
    clearInterval(countdownInterval);
    window.location.href = 'index.html';
  }
}
