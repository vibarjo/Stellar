// Mobile Menu Toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', function() {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close menu when a link is clicked
const links = navLinks.querySelectorAll('a');
links.forEach(link => {
    link.addEventListener('click', function() {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const isClickInsideNav = navToggle.contains(event.target) || navLinks.contains(event.target);
    if (!isClickInsideNav) {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
    }
});

// Category Navigation Function
function toggleCategory(categoryId) {
    const section = document.getElementById(categoryId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        section.style.animation = 'highlightSection 1s ease-out';
    }
}

// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Shopping Cart Management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartDisplay() {
    const cartCount = document.querySelector('.cart-count');
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        emptyCart.style.display = 'block';
        cartTotal.textContent = '0.00';
    } else {
        emptyCart.style.display = 'none';
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>$${item.price} x <input type="number" min="1" value="${item.quantity}" class="quantity-input" data-index="${index}"></p>
                </div>
                <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
                <button class="remove-item" data-index="${index}">Remove</button>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = total.toFixed(2);
        
        // Add event listeners to quantity inputs
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', function() {
                const index = this.dataset.index;
                const quantity = parseInt(this.value) || 1;
                if (quantity > 0) {
                    cart[index].quantity = quantity;
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartDisplay();
                }
            });
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.dataset.index;
                cart.splice(index, 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartDisplay();
            });
        });
    }
}

// Add to Cart functionality
const addToCartButtons = document.querySelectorAll('.add-to-cart');
addToCartButtons.forEach(button => {
    button.addEventListener('click', function() {
        const productCard = this.closest('.product-card');
        const productId = productCard.dataset.productId;
        const productName = productCard.dataset.productName;
        const productPrice = parseFloat(productCard.dataset.productPrice);
        
        // Check if product already in cart
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: productPrice,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        
        // Visual feedback
        this.textContent = 'Added ✓';
        this.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
            this.textContent = 'Add to Cart';
            this.style.backgroundColor = '';
        }, 2000);
    });
});

// Cart Modal
const cartModal = document.getElementById('cartModal');
const cartLink = document.querySelector('.cart-link');
const closeBtn = document.querySelector('.close');

cartLink.addEventListener('click', function(e) {
    e.preventDefault();
    updateCartDisplay();
    cartModal.style.display = 'block';
});

closeBtn.addEventListener('click', function() {
    cartModal.style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target === cartModal) {
        cartModal.style.display = 'none';
    }
});

// Contact Form Submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = this.querySelector('input[type="text"]').value;
        const email = this.querySelector('input[type="email"]').value;
        const message = this.querySelector('textarea').value;
        
        if (name && email && message) {
            alert(`Thank you, ${name}! Your message has been sent. We will contact you soon at ${email}.`);
            this.reset();
        } else {
            alert('Please fill in all fields.');
        }
    });
}

// Initialize cart display on page load
updateCartDisplay();