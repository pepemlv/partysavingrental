# Stripe Payment Integration Setup

## 🔑 Getting Your Stripe API Keys

1. **Create a Stripe Account**
   - Go to [https://stripe.com](https://stripe.com)
   - Sign up for a free account

2. **Get Your API Keys**
   - Log in to your Stripe Dashboard
   - Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
   - You'll see two types of keys:
     - **Publishable key** (starts with `pk_test_` or `pk_live_`)
     - **Secret key** (starts with `sk_test_` or `sk_live_`)

3. **Update Your .env File**
   Replace the placeholder values in `.env` with your actual keys:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_actual_key_here
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   ```

## 🚀 Running the Application

### Start Both Frontend and Backend:
```bash
npm run dev:all
```

This will start:
- Frontend (Vite): http://localhost:5173
- Backend (Express): http://localhost:3001

### Or run them separately:

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 💳 Testing Payments

Stripe provides test card numbers for testing:

### Successful Payment:
- **Card Number:** 4242 4242 4242 4242
- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### Declined Payment:
- **Card Number:** 4000 0000 0000 0002

### More test cards: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

## 📝 Important Notes

- **Test Mode:** Use test keys (starting with `pk_test_` and `sk_test_`) for development
- **Live Mode:** Only switch to live keys when ready for production
- **Security:** Never commit your `.env` file with real keys to version control
- **Webhook Secret:** Optional for development, required for production webhooks

## 🔒 Security Best Practices

1. Keep `.env` file in `.gitignore` (already configured)
2. Never expose your secret key in client-side code
3. Use environment variables for all sensitive data
4. Enable Stripe's built-in fraud detection in production
5. Use HTTPS in production

## 📦 What's Included

- ✅ Stripe payment processing
- ✅ Secure checkout modal
- ✅ Card validation
- ✅ Payment confirmation
- ✅ Error handling
- ✅ Payment history saved to Firestore
- ✅ Customer information collection

## 🛠️ Troubleshooting

**"Payment server is not running"**
- Make sure port 3001 is not in use
- Check that `npm run server` is running without errors

**"Invalid API Key"**
- Verify your keys are correctly copied from Stripe Dashboard
- Ensure no extra spaces in `.env` file
- Restart the server after changing `.env`

**"Network Error"**
- Check that both frontend and backend servers are running
- Verify the proxy configuration in `vite.config.ts`
