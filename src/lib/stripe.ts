import { loadStripe } from '@stripe/stripe-js';

// Replace with your Stripe publishable key
// Get this from: https://dashboard.stripe.com/apikeys
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
