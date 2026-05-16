import { useState, useEffect, useRef } from 'react';
import { supabase, Product, ProductAddon, City, CartItem } from './lib/supabase';
import { geocodeAddress, calculateDistance, calculateDeliveryFee, calculateCollectionFee, GeocodedAddress } from './utils/distance';
import { db } from './lib/firebase.ts';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy as firestoreOrderBy } from 'firebase/firestore';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartSummary from './components/CartSummary';
import CitySelector from './components/CitySelector';
import DeliveryMethodSelector from './components/DeliveryMethodSelector';
import RentalDetails from './components/RentalDetails';
import EventDetailsForm from './components/EventDetailsForm';
import ContactForm from './components/ContactForm';
import Gallery from './components/Gallery';
import Footer from './components/Footer';

function ProductGalleryCard({ product, allImages }: { product: Product; allImages: string[] }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-8">
        {/* Main large image at top */}
        {allImages.length > 0 && (
          <div className="mb-6 aspect-video rounded-xl overflow-hidden bg-green-600">
            <img
              src={allImages[selectedImageIndex]}
              alt={product.name}
              className="w-full h-full object-contain p-4 transition-all duration-300"
            />
          </div>
        )}
        
        {/* Product info */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
          <p className="text-3xl font-bold text-green-600 mb-4">${product.base_price?.toFixed(2)}</p>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        </div>
        
        {/* Small thumbnail images at bottom */}
        {allImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {allImages.slice(0, 4).map((url: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`aspect-square rounded-lg overflow-hidden bg-green-600 cursor-pointer transition-all ${
                  selectedImageIndex === idx 
                    ? 'ring-4 ring-green-500 ring-offset-2' 
                    : 'hover:ring-2 hover:ring-green-400'
                }`}
              >
                <img
                  src={url}
                  alt={`${product.name} ${idx + 1}`}
                  className="w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Record<string, ProductAddon>>({});
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('delivery');
  const [rentalDays, setRentalDays] = useState(1);
  const [eventDate, setEventDate] = useState('');
  const [eventAddress, setEventAddress] = useState('');
  const [eventState, setEventState] = useState('');
  const [eventZipcode, setEventZipcode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [distanceMiles, setDistanceMiles] = useState(0);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState<GeocodedAddress | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [paidReservations, setPaidReservations] = useState<any[]>([]);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState('');
  const [paymentStatusType, setPaymentStatusType] = useState<'success' | 'warning'>('success');
  const previousCityIdRef = useRef<string | null>(null);

  const TAX_RATE = 0.0725;

  const getProductDisplayOrder = (product: Product) => {
    const order = Number(product.display_order || 0);
    return order > 0 ? order : Number.MAX_SAFE_INTEGER;
  };

  const getCityPricedProduct = (product: Product, city: City | null): Product => {
    if (!city) return product;
    const metropolePrice = city.metropole_id ? product.metropole_prices?.[city.metropole_id] : undefined;
    if (metropolePrice !== undefined && metropolePrice !== null) {
      return { ...product, base_price: Number(metropolePrice) };
    }
    const cityPrice = product.city_prices?.[city.id];
    if (cityPrice === undefined || cityPrice === null) return product;
    return { ...product, base_price: Number(cityPrice) };
  };

  // Auto-select delivery if pickup is not available for selected city
  useEffect(() => {
    if (selectedCity && selectedCity.pickup_available === false) {
      setDeliveryMethod('delivery');
    }
  }, [selectedCity]);

  useEffect(() => {
    const currentCityId = selectedCity?.id || null;
    const cityChanged = previousCityIdRef.current !== currentCityId;
    previousCityIdRef.current = currentCityId;

    setCartItems((prev) => {
      const previousById = new Map(prev.map((item) => [item.product.id, item]));
      return products.map((product) => {
        const existing = previousById.get(product.id);
        const pricedProduct = getCityPricedProduct(product, selectedCity);
        return {
          product: pricedProduct,
          quantity: cityChanged ? 0 : existing?.quantity || 0,
          addonSelected: cityChanged ? false : existing?.addonSelected || false,
          addon: product.addon ? {
            id: product.id,
            product_id: product.id,
            name: product.addon.name,
            price: product.addon.price,
          } : undefined,
        };
      });
    });
  }, [products, selectedCity]);

  const reservationMatchesCity = (reservation: any, city: City): boolean => {
    const reservationCityName = String(reservation.selectedCity || reservation.city_name || '').trim().toLowerCase();
    const cityName = city.name.trim().toLowerCase();

    return reservation.cityId === city.id
      || reservation.city_id === city.id
      || reservationCityName === cityName;
  };

  // Calculate available stock for a product in a city on the selected event date
  const calculateAvailableStockForCity = (productId: string, city: City | null): number => {
    if (!city || !eventDate) return 999; // Return large number if no city/date selected

    // Find inventory for this product in the requested city
    const inventoryItem = inventory.find(
      item => item.product_id === productId && item.city_id === city.id
    );

    if (!inventoryItem) return 0; // No inventory

    const totalStock = inventoryItem.total_quantity || 0;

    // Calculate blocked stock from paid reservations
    const blockedStock = paidReservations.reduce((blocked, reservation) => {
      if (!reservationMatchesCity(reservation, city)) return blocked;

      const reservationDate = new Date(reservation.eventDate);
      const selectedDate = new Date(eventDate);

      // Block stock if reservation overlaps (day before to day after)
      const dayBefore = new Date(reservationDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const dayAfter = new Date(reservationDate);
      dayAfter.setDate(dayAfter.getDate() + 1);

      if (selectedDate >= dayBefore && selectedDate <= dayAfter) {
        // Check if this reservation has this product
        const cartItem = reservation.cart?.find((item: any) => 
          item.productId === productId || item.productName === products.find(p => p.id === productId)?.name
        );
        if (cartItem) {
          return blocked + (cartItem.quantity || 0);
        }
      }

      return blocked;
    }, 0);

    return Math.max(0, totalStock - blockedStock);
  };

  const calculateAvailableStock = (productId: string): number => (
    calculateAvailableStockForCity(productId, selectedCity)
  );

  const getSameMetropoleAvailability = (productId: string, currentStock: number) => {
    if (!selectedCity?.metropole_id || currentStock > 0) return [];

    return cities
      .filter((city) => city.id !== selectedCity.id && city.metropole_id === selectedCity.metropole_id)
      .map((city) => ({
        cityName: city.name,
        quantity: calculateAvailableStockForCity(productId, city),
      }))
      .filter((item) => item.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log('PAYMENT SUCCESS DEBUG: Stripe reported payment success', { paymentIntentId });
    setPaymentStatusType('warning');
    setPaymentStatusMessage('Payment successful. Saving reservation...');
    
    // Save complete reservation to Firestore
    try {
      const subtotal = cartItems.reduce((sum, item) => {
        const baseTotal = item.product.base_price * item.quantity * rentalDays;
        const addonTotal = item.addonSelected && item.addon ? item.addon.price * item.quantity * rentalDays : 0;
        return sum + baseTotal + addonTotal;
      }, 0);
      const tax = subtotal * TAX_RATE;
      const total = subtotal + tax + deliveryFee + collectionFee;

      // Prepare cart data
      const cartData = cartItems
        .filter(item => item.quantity > 0)
        .map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          basePrice: item.product.base_price,
          addonSelected: item.addonSelected,
          addonName: item.addon?.name || null,
          addonPrice: item.addon?.price || 0,
        }));

      const paidReservation = {
        paymentIntentId,
        customerName,
        customerEmail,
        customerPhone,
        eventDate,
        rentalDays,
        deliveryMethod,
        address: validatedAddress ? {
          // Save validated address for both delivery and pickup
          street: validatedAddress.address.road 
            ? `${validatedAddress.address.house_number || ''} ${validatedAddress.address.road}`.trim()
            : eventAddress,
          city: validatedAddress.address.city || validatedAddress.address.town || validatedAddress.address.village || '',
          state: validatedAddress.address.state || eventState,
          zipcode: validatedAddress.address.postcode || eventZipcode,
          fullAddress: validatedAddress.display_name || `${eventAddress}, ${eventState} ${eventZipcode}`,
          validated: validatedAddress,
          // Keep original user input for reference
          userTyped: {
            street: eventAddress,
            state: eventState,
            zipcode: eventZipcode,
          }
        } : (eventAddress ? {
          // If no validation but address entered, save basic info
          street: eventAddress,
          city: '',
          state: eventState,
          zipcode: eventZipcode,
          fullAddress: `${eventAddress}, ${eventState} ${eventZipcode}`,
          validated: null,
          userTyped: {
            street: eventAddress,
            state: eventState,
            zipcode: eventZipcode,
          }
        } : null),
        selectedCity: selectedCity?.name || '',
        pickupAddress: selectedCity?.pickup_address || '',
        distance: distanceMiles,
        cart: cartData,
        pricing: {
          subtotal,
          tax,
          deliveryFee,
          collectionFee,
          total,
        },
        status: 'confirmed',
        createdAt: serverTimestamp(),
      };

      console.log('PAYMENT SUCCESS DEBUG: saving paid reservation to Firestore', {
        paymentIntentId,
        selectedCity: paidReservation.selectedCity,
        customerEmail: paidReservation.customerEmail,
        total: paidReservation.pricing.total,
        cartItems: paidReservation.cart.length,
      });

      // Save to paidreservation collection after successful payment.
      await addDoc(collection(db, 'paidreservation'), paidReservation);
      console.log('Reservation saved to paidreservation collection.');

      // Clear the form
      setCartItems(prev => prev.map(item => ({ ...item, quantity: 0, addonSelected: false })));
      setRentalDays(1);
      setEventDate(new Date().toISOString().split('T')[0]);
      setEventAddress('');
      setEventState('');
      setEventZipcode('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setDistanceMiles(0);
      setIsAddressValid(false);
      setValidatedAddress(null);
      setDeliveryMethod('pickup');

      setPaymentStatusType('success');
      setPaymentStatusMessage('Payment successful. Your reservation has been confirmed.');
      alert('Payment successful! Your reservation has been confirmed.');
    } catch (error) {
      console.error('PAYMENT SUCCESS ERROR: reservation save failed', {
        error,
        message: error instanceof Error ? error.message : String(error),
      });
      setPaymentStatusType('warning');
      setPaymentStatusMessage('Payment successful, but saving the reservation needs attention.');
      alert('Payment successful! Your reservation has been confirmed. We will contact you shortly.');
    }
  };

  useEffect(() => {
    loadProducts();
    loadCities();
    loadInventory();
    loadPaidReservations();
    setEventDate(new Date().toISOString().split('T')[0]);
  }, []);

  async function loadProducts() {
    try {
      const q = query(collection(db, 'products'), firestoreOrderBy('name'));
      const querySnapshot = await getDocs(q);
      const productsData: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });

      if (productsData.length > 0) {
        setProducts(productsData.sort((a, b) => {
          const orderDifference = getProductDisplayOrder(a) - getProductDisplayOrder(b);
          return orderDifference || (a.name || '').localeCompare(b.name || '');
        }));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  async function loadCities() {
    try {
      const q = query(collection(db, 'cities'), firestoreOrderBy('name'));
      const querySnapshot = await getDocs(q);
      const data: City[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as City);
      });
      
      if (data.length > 0) {
        setCities(data);
        // Don't set default city - user must choose
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  }

  async function loadInventory() {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventory'));
      const data: any[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      
      setInventory(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  }

  async function loadPaidReservations() {
    try {
      const querySnapshot = await getDocs(collection(db, 'paidreservation'));
      const data: any[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      
      setPaidReservations(data);
    } catch (error) {
      console.error('Error loading paid reservations:', error);
    }
  }

  async function validateAddress() {
    if (!eventAddress || !eventState || !eventZipcode || !selectedCity) {
      setIsAddressValid(false);
      setValidatedAddress(null);
      return;
    }

    const fullAddress = `${eventAddress}, ${eventState} ${eventZipcode}`;
    const eventCoords = await geocodeAddress(fullAddress);
    
    // Try geocoding first, then fallback to stored coordinates
    let pickupCoords = await geocodeAddress(selectedCity.pickup_address);
    
    // If geocoding fails, use stored coordinates as fallback
    if (!pickupCoords && selectedCity.latitude && selectedCity.longitude) {
      console.log('Using stored coordinates for pickup location');
      pickupCoords = {
        lat: selectedCity.latitude,
        lon: selectedCity.longitude,
        display_name: selectedCity.pickup_address,
        address: {}
      };
    }

    if (eventCoords && pickupCoords) {
      const distance = calculateDistance(
        pickupCoords.lat,
        pickupCoords.lon,
        eventCoords.lat,
        eventCoords.lon
      );
      setDistanceMiles(distance);
      setIsAddressValid(true);
      setValidatedAddress(eventCoords);

      // Save to Firestore
      try {
        console.log('Attempting to save to Firestore...');
        const deliveryFeeCalc = deliveryMethod === 'delivery' ? calculateDeliveryFee(distance, selectedCity?.delivery_rates) : 0;
        const collectionFeeCalc = deliveryMethod === 'delivery' ? calculateCollectionFee(distance, selectedCity?.delivery_rates) : 0;
        
        // Prepare cart data
        const cartData = cartItems
          .filter(item => item.quantity > 0)
          .map(item => ({
            productName: item.product.name,
            quantity: item.quantity,
            basePrice: item.product.base_price,
            addonSelected: item.addonSelected,
            addonName: item.addon?.name || null,
            addonPrice: item.addon?.price || 0,
          }));

        const docData = {
          customerName,
          customerEmail,
          customerPhone,
          address: {
            // Save validated address instead of user-typed address
            street: eventCoords.address.road 
              ? `${eventCoords.address.house_number || ''} ${eventCoords.address.road}`.trim()
              : eventAddress,
            city: eventCoords.address.city || eventCoords.address.town || eventCoords.address.village || '',
            state: eventCoords.address.state || eventState,
            zipcode: eventCoords.address.postcode || eventZipcode,
            fullAddress: eventCoords.display_name || fullAddress,
            validated: eventCoords,
            // Keep original user input for reference
            userTyped: {
              street: eventAddress,
              state: eventState,
              zipcode: eventZipcode,
            }
          },
          eventDate,
          rentalDays,
          deliveryMethod,
          selectedCity: selectedCity.name,
          distance: distance,
          deliveryFee: deliveryFeeCalc,
          collectionFee: collectionFeeCalc,
          cart: cartData,
          createdAt: serverTimestamp(),
        };

        console.log('Data to be saved:', docData);
        
        const docRef = await addDoc(collection(db, 'clientqueries'), docData);
        
        console.log('Client query saved successfully with ID:', docRef.id);
      } catch (error) {
        console.error('Error saving to Firestore:', error);
      }
    } else {
      setIsAddressValid(false);
      setDistanceMiles(0);
      setValidatedAddress(null);
    }
  }

  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    // Check if user is trying to change quantity and city is not selected
    if (updates.quantity !== undefined && !selectedCity) {
      alert('Please select your city first!');
      // Scroll to city selector
      document.getElementById('city-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setCartItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const deliveryFee = deliveryMethod === 'delivery' ? calculateDeliveryFee(distanceMiles, selectedCity?.delivery_rates) : 0;
  const collectionFee = deliveryMethod === 'delivery' ? calculateCollectionFee(distanceMiles, selectedCity?.delivery_rates) : 0;

  // Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    const baseTotal = item.product.base_price * item.quantity * rentalDays;
    const addonTotal = item.addonSelected && item.addon ? item.addon.price * item.quantity * rentalDays : 0;
    return sum + baseTotal + addonTotal;
  }, 0);

  const isFormComplete = 
    customerName.trim() !== '' &&
    customerPhone.trim() !== '' &&
    customerEmail.trim() !== '' &&
    eventDate !== '' &&
    (deliveryMethod === 'pickup' || (deliveryMethod === 'delivery' && isAddressValid));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {paymentStatusMessage && (
        <div className={`fixed top-4 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg ${
          paymentStatusType === 'success'
            ? 'border-green-200 bg-green-50 text-green-900'
            : 'border-yellow-200 bg-yellow-50 text-yellow-900'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <p>{paymentStatusMessage}</p>
            <button
              type="button"
              onClick={() => setPaymentStatusMessage('')}
              className="shrink-0 text-current opacity-70 hover:opacity-100"
              aria-label="Dismiss payment status"
            >
              X
            </button>
          </div>
        </div>
      )}
      <Hero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
     

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <CitySelector
              cities={cities}
              selectedCity={selectedCity}
              onCityChange={setSelectedCity}
            />

            <section>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Items</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {cartItems.map((item, index) => {
                  const availableStock = calculateAvailableStock(item.product.id);

                  return (
                    <ProductCard
                      key={item.product.id}
                      product={item.product}
                      addon={item.addon}
                      quantity={item.quantity}
                      addonSelected={item.addonSelected}
                      onQuantityChange={(quantity) => updateCartItem(index, { quantity })}
                      onAddonToggle={(addonSelected) => updateCartItem(index, { addonSelected })}
                      availableStock={availableStock}
                      nearbyAvailability={getSameMetropoleAvailability(item.product.id, availableStock)}
                    />
                  );
                })}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  How many days do you want to use the equipment?
                </h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setRentalDays(Math.max(1, rentalDays - 1))}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xl font-bold text-gray-600">−</span>
                  </button>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{rentalDays}</div>
                    <div className="text-sm text-gray-600">day{rentalDays !== 1 ? 's' : ''}</div>
                  </div>
                  <button
                    onClick={() => setRentalDays(rentalDays + 1)}
                    className="w-10 h-10 rounded-lg border-2 border-green-500 bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors"
                  >
                    <span className="text-xl font-bold text-white">+</span>
                  </button>
                </div>
              </div>

            </section>

            <DeliveryMethodSelector
              method={deliveryMethod}
              onMethodChange={setDeliveryMethod}
              deliveryFee={deliveryFee}
              distanceMiles={distanceMiles}
              isAddressValid={isAddressValid}
              pickupAvailable={selectedCity?.pickup_available !== false}
            />

            <EventDetailsForm
              eventAddress={eventAddress}
              eventState={eventState}
              eventZipcode={eventZipcode}
              customerName={customerName}
              customerPhone={customerPhone}
              customerEmail={customerEmail}
              eventDate={eventDate}
              onEventAddressChange={setEventAddress}
              onEventStateChange={setEventState}
              onEventZipcodeChange={setEventZipcode}
              onCustomerNameChange={setCustomerName}
              onCustomerPhoneChange={setCustomerPhone}
              onCustomerEmailChange={setCustomerEmail}
              onEventDateChange={setEventDate}
              onValidateAddress={validateAddress}
              isAddressValid={isAddressValid}
              validatedAddress={validatedAddress}
              rentalDays={rentalDays}
              distanceMiles={distanceMiles}
              deliveryFee={deliveryFee}
              collectionFee={collectionFee}
              deliveryMethod={deliveryMethod}
              selectedCityName={selectedCity?.name || ''}
              advanceDays={selectedCity?.advance_days || 0}
              subtotal={subtotal}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CartSummary
                items={cartItems.filter((item) => item.quantity > 0)}
                deliveryFee={deliveryFee}
                collectionFee={collectionFee}
                taxRate={TAX_RATE}
                isFormComplete={isFormComplete}
                isAddressValid={isAddressValid}
                deliveryMethod={deliveryMethod}
                rentalDays={rentalDays}
                customerName={customerName}
                customerEmail={customerEmail}
                customerPhone={customerPhone}
                onPaymentSuccess={handlePaymentSuccess}
              />
            </div>
          </div>
        </div>
           <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Our Products</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {products.map((product) => {
              const pricedProduct = getCityPricedProduct(product, selectedCity);
              // Get all images: main, addon, and gallery
              const allImages: string[] = [];
              if (product.image_url) allImages.push(product.image_url);
              if (product.image_with_addon_url) allImages.push(product.image_with_addon_url);
              if (product.gallery_images && product.gallery_images.length > 0) {
                allImages.push(...product.gallery_images);
              }
              
              return (
                <ProductGalleryCard 
                  key={product.id} 
                  product={pricedProduct} 
                  allImages={allImages} 
                />
              );
            })}
          </div>
        </section>
      </div>
      <ContactForm />
      <Gallery />
      <Footer />
    </div>
  );
}

export default App;
