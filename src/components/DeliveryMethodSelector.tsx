import { Package, Truck, Car } from 'lucide-react';

interface DeliveryMethodSelectorProps {
  method: 'pickup' | 'delivery';
  onMethodChange: (method: 'pickup' | 'delivery') => void;
  deliveryFee: number;
  distanceMiles: number;
  isAddressValid: boolean;
  pickupAvailable?: boolean;
}

export default function DeliveryMethodSelector({
  method,
  onMethodChange,
  deliveryFee,
  distanceMiles,
  isAddressValid,
  pickupAvailable = true,
}: DeliveryMethodSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Method</h3>

      {isAddressValid && distanceMiles > 25 && (
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-300">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ Your address is {distanceMiles.toFixed(1)} miles away. This is over 25 miles from our location. Please verify you selected the correct city closest to your event address{pickupAvailable ? ', or consider using the Self Pickup option' : ''}.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <label
          className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
            pickupAvailable 
              ? `cursor-pointer ${method === 'pickup' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`
              : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="delivery"
              value="pickup"
              checked={method === 'pickup'}
              onChange={(e) => onMethodChange(e.target.value as 'pickup' | 'delivery')}
              disabled={!pickupAvailable}
              className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            />
            <Package className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Pickup Yourself {!pickupAvailable && '(Not Available)'}</p>
              <p className="text-sm text-gray-600">Pickup at location Free</p>
            </div>
          </div>
          <span className="font-semibold text-gray-900">$0.00</span>
        </label>

        {/* Pickup Capacity Guide - Only visible when pickup is selected */}
        {method === 'pickup' && pickupAvailable && (
          <div className="ml-10 mt-2 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-gray-700">Pickup Capacity Guide:</p>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span><strong>Sedan Car:</strong> 10 chairs, 2 tables (per round)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span><strong>Small SUV:</strong> 20 chairs, 5 tables</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span><strong>Big SUV/Van:</strong> 25 chairs, 7 tables</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span><strong>Cargo Van:</strong> 50 chairs, 10 tables</span>
              </div>
            </div>
          </div>
        )}

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
