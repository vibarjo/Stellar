# Google Pay & UPI Payment Setup for India 🇮🇳

## Complete Guide for Stellar Guppies - India Payments

### ✅ Why Razorpay for India?

- ✓ Google Pay integration (customers already have it)
- ✓ UPI payments (most popular in India)
- ✓ Direct bank account transfers
- ✓ Lower fees than international gateways
- ✓ Instant settlements
- ✓ Support in Hindi
- ✓ Works with all Indian banks

---

## Step 1: Create Razorpay Account

### Online (Easiest)

1. Visit: https://razorpay.com
2. Click "Sign Up"
3. Enter your details:
   - Full Name
   - Email
   - Phone (Indian mobile)
   - Business Name: "Stellar Guppies"
4. Create password
5. Verify phone OTP
6. Verify email

### Required Documents (for verification):

- Aadhar Card
- PAN Card
- Bank Account Details
- Business Address

---

## Step 2: Add Your Bank Account

**Where money will be transferred:**

1. Login to Razorpay Dashboard
2. Go to Settings → Account Settings
3. Add Bank Account:
   - Bank Name
   - Account Number
   - IFSC Code
   - Account Holder Name (must match your identity)
4. Submit for verification (usually 1-2 days)

**Example Bank Details Format:**
```
Bank: State Bank of India
Account: 12345678901234
IFSC: SBIN0001234
Holder: Your Name
```

---

## Step 3: Get Your API Keys

1. Go to Razorpay Dashboard
2. Click on "API Keys" (or Settings → API Keys)
3. Copy:
   - **Key ID** (like: rzp_live_xxx...)
   - **Key Secret** (keep this SECRET!)

**Example:**
```
Key ID: rzp_live_HO2jxYeZbMUVPT
Key Secret: YOUR_SECRET_KEY_HERE (NEVER SHARE!)
```

---

## Step 4: Install Backend Server for India

### Option A: Using Node.js + Razorpay

**File: package.json**
```json
{
  "name": "stellar-guppies-india",
  "version": "1.0.0",
  "description": "Payment processing for India",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "razorpay": "^2.8.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "body-parser": "^1.20.0"
  }
}
```

**File: .env**
```
RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
PORT=5000
NODE_ENV=development
```

**File: server.js**
```javascript
require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Store orders
const orders = [];

// Test endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Server running',
        message: 'Stellar Guppies Payment Server - India'
    });
});

// Create Razorpay Order
app.post('/create-order', async (req, res) => {
    try {
        const { amount, customerName, customerEmail, customerPhone, cartItems } = req.body;

        // Amount in paise (rupees * 100)
        const amountInPaise = Math.round(amount * 100);

        // Create order
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: 'receipt_' + Date.now(),
            payment_capture: 1,
            notes: {
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone,
                itemCount: cartItems.length
            }
        });

        console.log('Razorpay Order Created:', order);

        res.json({
            success: true,
            orderId: order.id,
            amount: amount,
            currency: 'INR',
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
});

// Verify Payment
app.post('/verify-payment', async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            customerName,
            customerEmail,
            customerPhone,
            cartItems,
            amount
        } = req.body;

        // Create signature to verify
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        // Verify signature matches
        if (generated_signature === razorpay_signature) {
            
            // Payment verified! Save order to database
            const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            
            const savedOrder = {
                orderId: orderId,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone,
                items: cartItems,
                totalAmount: amount,
                paymentStatus: 'completed',
                paymentMethod: 'Google Pay / UPI',
                createdAt: new Date().toISOString()
            };

            orders.push(savedOrder);
            console.log('Payment Verified! Order Saved:', savedOrder);

            res.json({
                success: true,
                orderId: orderId,
                paymentId: razorpay_payment_id,
                message: 'Payment successful!',
                order: savedOrder
            });

        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed - Signature mismatch'
            });
        }

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
});

// Get all orders
app.get('/orders', (req, res) => {
    res.json({
        totalOrders: orders.length,
        totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        orders: orders
    });
});

// Get order details
app.get('/order/:orderId', (req, res) => {
    const order = orders.find(o => o.orderId === req.params.orderId);
    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log('✓ Razorpay Integration Ready');
});
```

---

## Step 5: Update Frontend Files

### Update: payment.js

```javascript
// Razorpay Integration for India

const RAZORPAY_KEY_ID = 'rzp_live_YOUR_KEY_ID'; // Replace with your Key ID
const BACKEND_URL = 'http://localhost:5000'; // Or your deployed server URL

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

    // Get customer details from user
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
            alert('Failed to load payment gateway');
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
            alert('Failed to create order: ' + orderData.message);
            return;
        }

        console.log('Order created:', orderData);

        // Step 2: Open Razorpay Checkout
        const options = {
            key: RAZORPAY_KEY_ID,
            amount: totalAmount * 100, // Amount in paise
            currency: 'INR',
            order_id: orderData.orderId,
            name: 'Stellar Guppies',
            description: `Order for ${customerName}`,
            image: '🐠',
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
            handler: async function(response) {
                console.log('Payment handler called:', response);
                
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
                        alert(`✓ Payment Successful!\nOrder ID: ${verifyData.orderId}\nAmount: ₹${totalAmount}\n\nThank you for your order!`);
                        
                        // Clear cart
                        localStorage.removeItem('cart');
                        
                        // Reload page
                        location.reload();
                    } else {
                        alert('Payment verification failed: ' + verifyData.message);
                    }

                } catch (error) {
                    console.error('Verification error:', error);
                    alert('Payment verification failed: ' + error.message);
                }
            },
            modal: {
                ondismiss: function() {
                    alert('Payment cancelled');
                }
            }
        };

        const razorpay = new Razorpay(options);
        razorpay.open();

    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed: ' + error.message);
    }
}

// Add event listener
document.addEventListener('DOMContentLoaded', function() {
    const paymentBtn = document.getElementById('payWithGooglePay');
    if (paymentBtn) {
        paymentBtn.addEventListener('click', handlePaymentClick);
    }
});
```

---

## Step 6: Update HTML

Add this to your index.html in the cart modal footer:

```html
<div class="modal-footer">
    <div class="cart-total">Total: ₹<span id="cartTotal">0.00</span></div>
    <button id="payWithGooglePay" class="gpay-button">
        <i class="fas fa-mobile-alt"></i>
        Pay with Google Pay / UPI
    </button>
</div>
```

---

## Step 7: Deploy Server

### Option 1: Free Hosting - Railway.app

1. Create GitHub account (if not already)
2. Push your backend code to GitHub
3. Go to https://railway.app
4. Connect GitHub
5. Select your repository
6. Add environment variables:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
7. Deploy!
8. Get your URL (e.g., `https://your-app.railway.app`)

### Option 2: Free Hosting - Render

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub
4. Add environment variables
5. Deploy

### Option 3: Run Locally

```bash
npm install
npm start
```

Server will be at: `http://localhost:5000`

---

## Step 8: How Money Reaches Your Bank Account

### Timeline:

1. **Customer pays via Google Pay** → ₹500
2. **Razorpay receives payment**
3. **Razorpay deducts fee** (2% = ₹10)
4. **Your amount** ₹490
5. **Razorpay sends to your bank** → Usually within 24 hours

### Where to check:

1. Login to Razorpay Dashboard
2. Go to Transactions
3. See all payments
4. Check your bank account

### Example:

```
Customer pays:     ₹500
Razorpay fee:      -₹10 (2%)
You receive:       ₹490 ✓
Time to bank:      24 hours
```

---

## Complete Pricing in India

### Razorpay Fees:
- Google Pay / UPI: 0% to 2% (varies)
- Debit Card: 1% + ₹5 max
- Credit Card: 2% + ₹5 max
- NetBanking: 0% to 1%

### Example with Your Products:

```
Red Dragon Guppies: ₹299
Your fee (2%):      -₹6
You get:            ₹293

Blue Diamond:       ₹349
Your fee (2%):      -₹7
You get:            ₹342
```

---

## Testing Before Going Live

### Test Mode:

1. Use Key ID and Secret from "Test" tab
2. Don't accept real payments

### Test Payments:

You can use these test UPI IDs:
- `success@razorpay`
- `failure@razorpay`

Or test cards:
- Visa: 4111 1111 1111 1111
- Mastercard: 5555 5555 5555 4444

---

## Going Live Checklist 📋

- [ ] Razorpay account created
- [ ] Bank account verified
- [ ] API keys saved
- [ ] Backend server deployed
- [ ] Frontend updated
- [ ] Tested with test payments
- [ ] Switched to LIVE keys
- [ ] Updated backend URL on frontend
- [ ] Website has HTTPS (important!)
- [ ] Monitor first few orders

---

## Common Issues & Fixes

### Issue 1: Payment button not working
**Fix:** Make sure backend URL is correct in payment.js

### Issue 2: "Signature mismatch"
**Fix:** Check your Key Secret is correct in .env

### Issue 3: Money not reaching bank
**Fix:** Verify your bank account in Razorpay dashboard

### Issue 4: Customer doesn't have Google Pay
**Fix:** Razorpay shows multiple payment options automatically

---

## Contact Support

**Razorpay Support:** https://razorpay.com/support
**Email:** support@razorpay.com
**Phone:** +91 XXXX-XXXX-XXXX (check website for current number)

---

## Next Steps

1. ✅ Create Razorpay account
2. ✅ Verify bank account
3. ✅ Get API keys
4. ✅ Deploy backend server
5. ✅ Test with test payments
6. ✅ Go live!

**Total Time: 2-3 days** (mostly waiting for bank verification)

Would you like help with any specific step?
