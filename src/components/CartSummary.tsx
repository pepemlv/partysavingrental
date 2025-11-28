import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { CartItem } from '../lib/supabase';
import CheckoutModal from './CheckoutModal';

interface CartSummaryProps {
  items: CartItem[];
  deliveryFee: number;
  collectionFee: number;
  taxRate: number;
  isFormComplete: boolean;
  rentalDays: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onPaymentSuccess?: (paymentIntentId: string) => void;
}

export default function CartSummary({ 
  items, 
  deliveryFee, 
  collectionFee, 
  taxRate, 
  isFormComplete, 
  rentalDays,
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess 
}: CartSummaryProps) {
  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = items.reduce((sum, item) => {
    const baseTotal = item.product.base_price * item.quantity * rentalDays;
    const addonTotal = item.addonSelected && item.addon ? item.addon.price * item.quantity * rentalDays : 0;
    return sum + baseTotal + addonTotal;
  }, 0);

  const tax = subtotal * taxRate;
  const subtotalWithTax = subtotal + tax;
  const total = subtotalWithTax + deliveryFee + collectionFee;

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setShowCheckout(false);
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentIntentId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-5 h-5 text-gray-700" />
        <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
      </div>

      <div className="space-y-3 mb-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No items in cart</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="flex justify-between items-start py-2 border-b border-gray-100">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                {item.addonSelected && item.addon && (
                  <p className="text-xs text-gray-600 mt-1">+ {item.addon.name}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {item.quantity} × ${(item.product.base_price + (item.addonSelected && item.addon ? item.addon.price : 0)).toFixed(2)} × {rentalDays} day{rentalDays !== 1 ? 's' : ''}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  ${((item.product.base_price + (item.addonSelected && item.addon ? item.addon.price : 0)) * item.quantity * rentalDays).toFixed(2)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(2)}%):</span>
          <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal with Tax:</span>
          <span className="font-medium text-gray-900">${subtotalWithTax.toFixed(2)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery Fee:</span>
            <span className="font-medium text-gray-900">${deliveryFee.toFixed(2)}</span>
          </div>
        )}
        {collectionFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Collect Equipment After Event Fee:</span>
            <span className="font-medium text-gray-900">${collectionFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total:</span>
          <span className="text-green-600">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => setShowCheckout(true)}
          disabled={!isFormComplete}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
        >
          Proceed to Checkout
        </button>
        {!isFormComplete && (
          <p className="text-xs text-red-600 mt-2 text-center">Please complete all required fields to proceed</p>
        )}
      </div>

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        amount={total}
        customerInfo={{
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
