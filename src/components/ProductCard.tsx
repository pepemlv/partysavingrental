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
}

export default function ProductCard({
  product,
  addon,
  quantity,
  addonSelected,
  onQuantityChange,
  onAddonToggle,
}: ProductCardProps) {
  const baseTotal = product.base_price * quantity;
  const addonTotal = addonSelected && addon ? addon.price * quantity : 0;
  const totalPrice = baseTotal + addonTotal;

  // Determine which image to show based on product type and addon selection
  const getProductImage = () => {
    const isChair = product.name.toLowerCase().includes('chair');
    const isTable = product.name.toLowerCase().includes('table');
    
    if (isChair) {
      return addonSelected ? chairCovered : chairDetail;
    } else if (isTable) {
      return addonSelected ? foldTableCovered : uncoveredTable;
    }
    
    // Fallback to product image URL if available
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
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
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
                per {product.name.toLowerCase().includes('table') ? 'table' : 'chair'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 py-2">
            <button
              onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
              className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Minus className="w-5 h-5 text-gray-600" />
            </button>
            <span className="w-12 text-center text-xl font-bold text-gray-900">{quantity}</span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-10 h-10 rounded-lg border-2 border-green-500 bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
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
