// Quick debugging guide for checkout system

// To test address saving in browser console, run these commands:

// 1. Check if addresses are saved in localStorage:
console.log('Saved addresses:', JSON.parse(localStorage.getItem('userAddresses') || '[]'));

// 2. Manually add an address to localStorage for testing:
function addTestAddress() {
  const testAddr = {
    name: 'Test User',
    street: '123 Main Street',
    city: 'New York',
    zip: '10001',
    phone: '+91 9876543210'
  };
  const saved = JSON.parse(localStorage.getItem('userAddresses') || '[]');
  saved.push(testAddr);
  localStorage.setItem('userAddresses', JSON.stringify(saved));
  console.log('Test address added:', testAddr);
}

// 3. Clear all saved addresses:
function clearAddresses() {
  localStorage.removeItem('userAddresses');
  console.log('All addresses cleared');
}

// 4. View all cart items:
console.log('Cart items:', JSON.parse(localStorage.getItem('cart') || '[]'));

// 5. View all saved orders:
console.log('Saved orders:', JSON.parse(localStorage.getItem('orders') || '[]'));

// DEBUGGING CHECKLIST:
// ✓ Open browser DevTools (F12)
// ✓ Go to Console tab
// ✓ Run: console.log(JSON.parse(localStorage.getItem('userAddresses') || '[]'))
// ✓ After adding an address, run the above command again
// ✓ The address should appear in the list
// ✓ Check for any error messages in the console
