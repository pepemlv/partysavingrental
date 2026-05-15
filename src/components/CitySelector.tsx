import React from 'react';
import { MapPin } from 'lucide-react';
import { City } from '../lib/supabase';

interface CitySelectorProps {
  cities: City[];
  selectedCity: City | null;
  onCityChange: (city: City) => void;
  sellerCityId?: string;
}

export default function CitySelector({ cities, selectedCity, onCityChange, sellerCityId }: CitySelectorProps) {
  // If a seller is present, ensure their city appears first in the list
  const displayCities = React.useMemo(() => {
    // only include cities marked as showable (default to true)
    const visible = cities.filter((c) => c.showable !== false);
    let sid = sellerCityId;
    if (!sid) {
      try {
        const s = localStorage.getItem('sellerSession');
        if (s) {
          const parsed = JSON.parse(s) as any;
          sid = parsed.city_id || parsed.cityId || sid;
        }
      } catch (err) {
        // ignore
      }
    }
    if (!sid) return visible;
    const sellerCity = visible.find((c) => c.id === sid);
    if (!sellerCity) return visible;
    const others = visible.filter((c) => c.id !== sid);
    return [sellerCity, ...others];
  }, [cities, sellerCityId]);
  return (
    <div id="city-selector" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="bg-red-600 text-white rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Select Your City</h3>
        </div>
        <p className="text-sm text-red-50">Select the city close to your event location</p>
      </div>

      <select
        value={selectedCity?.id || ''}
        onChange={(e) => {
          const city = cities.find((c) => c.id === e.target.value);
          if (city) onCityChange(city);
        }}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
      >
        <option value="">Choose a city...</option>
        {displayCities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}, {city.state}
          </option>
        ))}
      </select>

      {selectedCity && (
        <div className="mt-4">
          <div className="p-4 bg-green-50 rounded-lg">
            {selectedCity.pickup_available === false ? (
              <>
                <p className="text-sm font-medium text-red-800 mb-2">
                  🚫 Self-pickup is unavailable. Delivery only.
                </p>
                <p
                  className="text-sm text-gray-900 font-semibold mt-1">Equipment will be delivered to your Event Location.
                </p>
                <p  className="text-sm text-gray-700"> Local Storage Stock : {selectedCity.pickup_address} </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 mb-1">Our address for pickup and drop off:</p>
                <p className="text-sm text-gray-900 font-semibold">{selectedCity.pickup_address}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
