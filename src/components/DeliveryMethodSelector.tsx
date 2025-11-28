import { Package, Truck } from 'lucide-react';

interface DeliveryMethodSelectorProps {
  method: 'pickup' | 'delivery';
  onMethodChange: (method: 'pickup' | 'delivery') => void;
  deliveryFee: number;
}

export default function DeliveryMethodSelector({
  method,
  onMethodChange,
  deliveryFee,
}: DeliveryMethodSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Method</h3>

      <div className="space-y-3">
        <label
          className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
            method === 'pickup'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="delivery"
              value="pickup"
              checked={method === 'pickup'}
              onChange={(e) => onMethodChange(e.target.value as 'pickup' | 'delivery')}
              className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
            />
            <Package className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Pickup Yourself</p>
              <p className="text-sm text-gray-600">Pickup at location Free</p>
            </div>
          </div>
          <span className="font-semibold text-gray-900">$0.00</span>
        </label>

        <label
          className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
            method === 'delivery'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="delivery"
              value="delivery"
              checked={method === 'delivery'}
              onChange={(e) => onMethodChange(e.target.value as 'pickup' | 'delivery')}
              className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
            />
            <Truck className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Get Fast Delivery</p>
              <p className="text-sm text-gray-600">
                Delivered to your porch from ${deliveryFee > 0 ? deliveryFee.toFixed(2) : '10'}
              </p>
            </div>
          </div>
          <span className="font-semibold text-gray-900">
            ${deliveryFee > 0 ? deliveryFee.toFixed(2) : '0.00'}
          </span>
        </label>
      </div>
    </div>
  );
}
