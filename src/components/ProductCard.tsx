import { useEffect, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Product, ProductAddon } from '../lib/supabase';

// Import product images
import chairDetail from '../images/products/chair/chairdetail.png';
import chairCovered from '../images/products/chair/chaircovered.png';
import uncoveredTable from '../images/products/table/uncoveredtable.png';
import foldTableCovered from '../images/products/table/foldtablecovered.png';

interface ProductCardProps {
  product: Product;
  addon?: ProductAddon;
  quantity: number;
  addonSelected: boolean;
  onQuantityChange: (quantity: number) => void;
  onAddonToggle: (selected: boolean) => void;
  availableStock?: number;
  nearbyAvailability?: Array<{
    cityName: string;
    quantity: number;
  }>;
}

export default function ProductCard({
  product,
  addon,
  quantity,
  addonSelected,
  onQuantityChange,
  onAddonToggle,
  availableStock,
  nearbyAvailability = [],
}: ProductCardProps) {
  const holdTimeoutRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const quantityRef = useRef(quantity);
  const availableStockRef = useRef(availableStock);

  const baseTotal = product.base_price * quantity;
  const addonTotal = addonSelected && addon ? addon.price * quantity : 0;
  const totalPrice = baseTotal + addonTotal;
  const isOutOfStock = availableStock !== undefined && availableStock <= 0;

  useEffect(() => {
    quantityRef.current = quantity;
    availableStockRef.current = availableStock;
  }, [quantity, availableStock]);

  const clearQuantityHold = () => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  useEffect(() => clearQuantityHold, []);

  const changeQuantity = (direction: 1 | -1) => {
    const maxQty = availableStockRef.current ?? 999;
    const nextQuantity = direction === 1
      ? Math.min(maxQty, quantityRef.current + 1)
      : Math.max(0, quantityRef.current - 1);

    if (nextQuantity !== quantityRef.current) {
      quantityRef.current = nextQuantity;
      onQuantityChange(nextQuantity);
    }
  };

  const startQuantityHold = (direction: 1 | -1) => {
    clearQuantityHold();
    changeQuantity(direction);

    holdTimeoutRef.current = window.setTimeout(() => {
      holdIntervalRef.current = window.setInterval(() => changeQuantity(direction), 90);
    }, 350);
  };

  // Determine which image to show based on product type and addon selection
  const getProductImage = () => {
    // Use Firebase Storage images if available
    if (addonSelected && product.image_with_addon_url) {
      return product.image_with_addon_url;
    }
    if (product.image_url) {
      return product.image_url;
    }

    // Fallback to hardcoded images for backward compatibility
    const isChair = product.name.toLowerCase().includes('chair');
    const isTable = product.name.toLowerCase().includes('table');
    
    if (isChair) {
      return addonSelected ? chairCovered : chairDetail;
    } else if (isTable) {
      return addonSelected ? foldTableCovered : uncoveredTable;
    }
    
    // Final fallback to product image_urls if available
    return product.image_urls?.[0] || null;
  };

  const currentImage = getProductImage();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
      <div className="aspect-square bg-green-600 relative p-4">
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-contain transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🪑</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{product.description}</p>

        {addon && (
          <label className="flex items-center gap-2 mb-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={addonSelected}
              onChange={(e) => onAddonToggle(e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
            />
            <span className="text-sm font-bold  text-red-700 ">
              {addon.name} (+${addon.price.toFixed(2)})
            </span>
          </label>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                ${product.base_price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                {product.pricing_unit || `per ${product.name.toLowerCase().includes('table') ? 'table' : 'chair'}`}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-900 text-center">QTY</p>
            <div className="flex items-center justify-center gap-3 py-2">
              <button
                onPointerDown={(event) => {
                  event.preventDefault();
                  startQuantityHold(-1);
                }}
                onPointerUp={clearQuantityHold}
                onPointerLeave={clearQuantityHold}
                onPointerCancel={clearQuantityHold}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-5 h-5 text-gray-600" />
              </button>
              <span className="w-12 text-center text-xl font-bold text-gray-900">{quantity}</span>
              <button
                onPointerDown={(event) => {
                  event.preventDefault();
                  startQuantityHold(1);
                }}
                onPointerUp={clearQuantityHold}
                onPointerLeave={clearQuantityHold}
                onPointerCancel={clearQuantityHold}
                disabled={availableStock !== undefined && quantity >= availableStock}
                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-colors ${
                  availableStock !== undefined && quantity >= availableStock
                    ? 'border-gray-300 bg-gray-200 cursor-not-allowed'
                    : 'border-green-500 bg-green-500 hover:bg-green-600'
                }`}
              >
                <Plus className={`w-5 h-5 ${
                  availableStock !== undefined && quantity >= availableStock ? 'text-gray-400' : 'text-white'
                }`} />
              </button>
            </div>
            {isOutOfStock ? (
              <div className="space-y-1 text-center text-xs">
                <p className="font-semibold text-red-600">Out of stock in selected city</p>
                {nearbyAvailability.length > 0 && (
                  <div className="rounded-lg bg-green-900 px-3 py-2 text-white">
                    <p className="font-semibold">Select a nearby city available to order:</p>
                    {nearbyAvailability.map((item) => (
                      <p key={item.cityName}>Available in {item.cityName}: {item.quantity}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : availableStock !== undefined && quantity >= availableStock && (
              <p className="text-xs text-red-600 text-center font-semibold">You reached max available stock ({availableStock})</p>
            )}
          </div>

          {quantity > 0 && (
            <div className="pt-4 border-t-2 border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-700">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
