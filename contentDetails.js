console.clear()

// Parse product ID from URL
let params = new URLSearchParams(location.search);
let id = params.get('id');
console.log('Product ID:', id);

// Update cart badge
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

if(document.cookie.indexOf(',counter=')>=0)
{
    let counter = document.cookie.split(',')[1].split('=')[1]
    document.getElementById("badge").innerHTML = counter
}

function dynamicContentDetails(ob)
{
    let mainContainer = document.createElement('div')
    mainContainer.id = 'containerD'
    document.getElementById('containerProduct').appendChild(mainContainer);

    let imageSectionDiv = document.createElement('div')
    imageSectionDiv.id = 'imageSection'

    let imgTag = document.createElement('img')
     imgTag.id = 'imgDetails'
     //imgTag.id = ob.photos
     imgTag.src = ob.preview

    imageSectionDiv.appendChild(imgTag)

    let productDetailsDiv = document.createElement('div')
    productDetailsDiv.id = 'productDetails'

    // console.log(productDetailsDiv);

    let h1 = document.createElement('h1')
    let h1Text = document.createTextNode(ob.name)
    h1.appendChild(h1Text)

    let h4 = document.createElement('h4')
    let h4Text = document.createTextNode(ob.brand)
    h4.appendChild(h4Text)
    console.log(h4);

    let detailsDiv = document.createElement('div')
    detailsDiv.id = 'details'

    let h3DetailsDiv = document.createElement('h3')
    let h3DetailsText = document.createTextNode('Rs ' + ob.price)
    h3DetailsDiv.appendChild(h3DetailsText)

    let h3 = document.createElement('h3')
    let h3Text = document.createTextNode('Description')
    h3.appendChild(h3Text)

    let para = document.createElement('p')
    let paraText = document.createTextNode(ob.description)
    para.appendChild(paraText)

    let productPreviewDiv = document.createElement('div')
    productPreviewDiv.id = 'productPreview'

    let h3ProductPreviewDiv = document.createElement('h3')
    let h3ProductPreviewText = document.createTextNode('Product Preview')
    h3ProductPreviewDiv.appendChild(h3ProductPreviewText)
    productPreviewDiv.appendChild(h3ProductPreviewDiv)

    // For Supabase, we have a single preview image
    let imgTagProductPreviewDiv = document.createElement('img')
    imgTagProductPreviewDiv.id = 'previewImg'
    imgTagProductPreviewDiv.src = ob.preview
    imgTagProductPreviewDiv.onclick = function(event)
    {
        console.log("clicked" + this.src)
        imgTag.src = ob.preview
        document.getElementById("imgDetails").src = this.src
    }
    productPreviewDiv.appendChild(imgTagProductPreviewDiv)

    let buttonDiv = document.createElement('div')
    buttonDiv.id = 'button'

    let buttonTag = document.createElement('button')
    buttonDiv.appendChild(buttonTag)

    buttonText = document.createTextNode('Add to Cart')
    buttonTag.onclick = async function() {
        try {
            if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
                // Fallback to localStorage
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                const existing = cart.find(item => item.product_id == ob.id);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    cart.push({ product_id: ob.id, quantity: 1 });
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                alert(`${ob.name} added to cart!`);
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
                body: JSON.stringify({ product_id: ob.id, quantity: 1 })
            });
            if (!res.ok) throw new Error('Failed to add to cart');
            alert(`${ob.name} added to cart!`);
            updateBadge();
        } catch (err) {
            console.error('Add to cart error:', err);
            alert('Error adding to cart: ' + err.message);
        }
    }
    buttonTag.appendChild(buttonText)


    console.log(mainContainer.appendChild(imageSectionDiv));
    mainContainer.appendChild(imageSectionDiv)
    mainContainer.appendChild(productDetailsDiv)
    productDetailsDiv.appendChild(h1)
    productDetailsDiv.appendChild(h4)
    productDetailsDiv.appendChild(detailsDiv)
    detailsDiv.appendChild(h3DetailsDiv)
    detailsDiv.appendChild(h3)
    detailsDiv.appendChild(para)
    productDetailsDiv.appendChild(productPreviewDiv)
    
    
    productDetailsDiv.appendChild(buttonDiv)


    return mainContainer
}



// BACKEND CALLING

// Fetch product details from Supabase
async function fetchProductDetails() {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
        console.error('Supabase not configured');
        return;
    }

    const url = `${window.SUPABASE_URL}/rest/v1/products?id=eq.${id}&select=*`;
    console.log('Fetching product details from Supabase:', url);

    try {
        const response = await fetch(url, {
            headers: {
                apikey: window.SUPABASE_ANON_KEY,
                Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch product details: ' + response.status);
        }

        const data = await response.json();
        console.log('Product details:', data);

        if (data && data.length > 0) {
            dynamicContentDetails(data[0]);
        } else {
            console.error('Product not found');
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
    }
}

fetchProductDetails();
