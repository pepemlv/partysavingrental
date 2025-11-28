import { MapPin } from 'lucide-react';
import { City } from '../lib/supabase';

interface CitySelectorProps {
  cities: City[];
  selectedCity: City | null;
  onCityChange: (city: City) => void;
}

export default function CitySelector({ cities, selectedCity, onCityChange }: CitySelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Select Your City</h3>
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
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}, {city.state}
          </option>
        ))}
      </select>

      {selectedCity && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Our address for pickup and drop off:</p>
          <p className="text-sm text-gray-900 font-semibold">{selectedCity.pickup_address}</p>
        </div>
      )}
    </div>
  );
}
