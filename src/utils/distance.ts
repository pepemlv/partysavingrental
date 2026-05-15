export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export interface GeocodedAddress {
  lat: number;
  lon: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export async function geocodeAddress(address: string): Promise<GeocodedAddress | null> {
  try {
    // Use Google Maps Geocoding API for better US address coverage
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        const components = result.address_components;
        
        // Parse address components
        const addressData: any = {};
        components.forEach((component: any) => {
          if (component.types.includes('street_number')) {
            addressData.house_number = component.long_name;
          }
          if (component.types.includes('route')) {
            addressData.road = component.long_name;
          }
          if (component.types.includes('locality')) {
            addressData.city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_2')) {
            addressData.county = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            addressData.state = component.long_name;
          }
          if (component.types.includes('postal_code')) {
            addressData.postcode = component.long_name;
          }
          if (component.types.includes('country')) {
            addressData.country = component.long_name;
          }
        });
        
        return {
          lat: location.lat,
          lon: location.lng,
          display_name: result.formatted_address,
          address: addressData,
        };
      }
    }
    
    // Fallback to OpenStreetMap if Google Maps API key is not configured
    console.log('Using OpenStreetMap as fallback for geocoding');
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name,
        address: data[0].address || {},
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export function calculateDeliveryFee(
  distanceMiles: number,
  cityDeliveryRates?: { under_4_miles: number; from_5_to_10_miles: number; from_11_to_30_miles: number },
  defaultRatePerMile = 1.7,
  minFee = 10
): number {
  // 1) Decide which rate per mile to use
  let ratePerMile = defaultRatePerMile;

  if (cityDeliveryRates) {
    if (distanceMiles <= 4) {
      ratePerMile = cityDeliveryRates.under_4_miles;
    } else if (distanceMiles <= 10) {
      ratePerMile = cityDeliveryRates.from_5_to_10_miles;
    } else if (distanceMiles <= 30) {
      ratePerMile = cityDeliveryRates.from_11_to_30_miles;
    } else {
      // distances > 30: you can choose your rule
      ratePerMile = cityDeliveryRates.from_11_to_30_miles * 1.5;
    }
  } else {
    // fallback rate logic if you still want it
    ratePerMile = distanceMiles > 11 ? 1.6 : 2;
  }

  // 2) Convert rate/mile to total dollars
  const fee = distanceMiles * ratePerMile;

  // 3) Apply minimum charge
  return Math.max(fee, minFee);
}

export function calculateCollectionFee(
  distanceMiles: number,
  cityDeliveryRates?: { under_4_miles: number; from_5_to_10_miles: number; from_11_to_30_miles: number },
  defaultRatePerMile = 1.7,
  minFee = 10
): number {
  // collection fee uses the same pricing as delivery
  return calculateDeliveryFee(distanceMiles, cityDeliveryRates, defaultRatePerMile, minFee);
}