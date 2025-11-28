import { useState, FormEvent } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Lock, CreditCard } from 'lucide-react';

interface CheckoutFormProps {
  amount: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export default function CheckoutForm({ amount, customerInfo, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment intent on your backend
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const fullUrl = `${apiUrl}/api/create-payment-intent`;
      
      console.log('🔵 Payment Request Details:');
      console.log('  - API URL:', apiUrl);
      console.log('  - Full Endpoint:', fullUrl);
      console.log('  - Amount:', amount, '($' + amount.toFixed(2) + ')');
      console.log('  - Customer:', customerInfo.name, customerInfo.email);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
        }),
      });

      console.log('🔵 Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend Error Response:', errorText);
        console.error('❌ TROUBLESHOOTING:');
        console.error('   1. Check that VITE_API_URL is set in Vercel:', apiUrl || 'NOT SET!');
        console.error('   2. Expected URL: https://partysavingrental.onrender.com');
        console.error('   3. Actual URL used:', fullUrl);
        console.error('   4. Render backend status: Check https://dashboard.render.com');
        throw new Error(`Payment API Error (${response.status}): ${errorText || 'Failed to create payment intent'}`);
      }

      const { clientSecret } = await response.json();

      console.log('✅ Payment Intent Created Successfully');
      console.log('  - Client Secret received:', clientSecret ? 'Yes' : 'No');

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
        },
      });

      if (error) {
        console.error('❌ Stripe Payment Confirmation Error:', error);
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment Succeeded!');
        console.log('  - Payment Intent ID:', paymentIntent.id);
        console.log('  - Amount:', paymentIntent.amount / 100);
        onSuccess(paymentIntent.id);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('❌ Payment Error Details:', error);
      console.error('❌ Error Type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ Error Message:', error instanceof Error ? error.message : String(error));
      
      const errorMsg = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      setErrorMessage(errorMsg);
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Card Information
          </div>
        </label>
        <div className="p-4 border border-gray-300 rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
        <Lock className="w-4 h-4" />
        <span>Secure payment powered by Stripe</span>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </span>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </button>
      </div>

      <p className="text-xs text-center text-gray-500">
        Your payment information is encrypted and secure. We never store your card details.
      </p>
    </form>
  );
}
