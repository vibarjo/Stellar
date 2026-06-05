// Razorpay Integration for India - Google Pay / UPI Payments

const BACKEND_URL = 'http://localhost:5000'; // Change this to your deployed server URL (e.g., Railway.app URL)

// Load Razorpay Script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

// Handle Google Pay / UPI Payment
async function handlePaymentClick() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Get customer details
    const customerName = prompt('Enter your full name:');
    if (!customerName) return;

    const customerEmail = prompt('Enter your email:');
    if (!customerEmail) return;

    const customerPhone = prompt('Enter your phone number (10 digits):');
    if (!customerPhone || customerPhone.length !== 10) {
        alert('Please enter valid 10-digit phone number');
        return;
    }

    try {
        // Load Razorpay Script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            alert('Failed to load payment gateway. Please try again.');
            return;
        }

        // Calculate total
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Step 1: Create order on backend
        console.log('Creating order...');
        const orderResponse = await fetch(`${BACKEND_URL}/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: totalAmount,
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone,
                cartItems: cart
            })
        });

        const orderData = await orderResponse.json();

        if (!orderData.success) {
            alert('Failed to create order. Please try again.');
            console.error('Order creation error:', orderData);
            return;
        }

        console.log('Order created:', orderData);

        // Step 2: Open Razorpay Checkout
        const options = {
            key: orderData.key_id, // Razorpay API Key
            amount: totalAmount * 100, // Amount in paise
            currency: 'INR',
            order_id: orderData.orderId,
            name: 'Stellar Guppies',
            description: `Order for ${customerName} - ${cart.length} item(s)`,
            image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="70" font-size="60" text-anchor="middle">🐠</text></svg>',
            prefill: {
                name: customerName,
                email: customerEmail,
                contact: customerPhone
            },
            notes: {
                items: cart.length,
                totalAmount: totalAmount
            },
            theme: {
                color: '#0066cc'
            },
            method: {
                upi: true,
                card: false,
                netbanking: false,
                wallet: false
            },
            handler: async function(response) {
                console.log('Payment successful:', response);
                
                // Step 3: Verify payment on backend
                try {
                    const verifyResponse = await fetch(`${BACKEND_URL}/verify-payment`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            customerName: customerName,
                            customerEmail: customerEmail,
                            customerPhone: customerPhone,
                            cartItems: cart,
                            amount: totalAmount
                        })
                    });

                    const verifyData = await verifyResponse.json();

                    if (verifyData.success) {
                        alert(`✓ Payment Successful!\n\nOrder ID: ${verifyData.orderId}\nAmount: ₹${totalAmount.toFixed(2)}\n\nThank you for your order!\n\nOrder confirmation has been sent to ${customerEmail}`);
                        
                        // Clear cart
                        localStorage.removeItem('cart');
                        
                        // Close modal and reload
                        const cartModal = document.getElementById('cartModal');
                        cartModal.style.display = 'none';
                        
                        setTimeout(() => {
                            location.reload();
                        }, 2000);
                    } else {
                        alert('Payment verification failed. Please contact support.');
                    }

                } catch (error) {
                    console.error('Verification error:', error);
                    alert('Payment processed but verification failed. Your order is being processed.');
                    localStorage.removeItem('cart');
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }
            },
            modal: {
                ondismiss: function() {
                    console.log('Payment cancelled');
                    alert('Payment was cancelled. Please try again.');
                }
            }
        };

        const razorpay = new Razorpay(options);
        razorpay.on('payment.failed', function(response) {
            console.error('Payment failed:', response);
            alert(`Payment failed: ${response.error.description}`);
        });
        
        razorpay.open();

    } catch (error) {
        console.error('Payment error:', error);
        alert('An error occurred: ' + error.message);
    }
}

// Add event listener to payment button
document.addEventListener('DOMContentLoaded', function() {
    const paymentBtn = document.getElementById('payWithGooglePay');
    if (paymentBtn) {
        paymentBtn.addEventListener('click', handlePaymentClick);
    }
});