import { useState, useEffect } from 'react';
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
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
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

  const TAX_RATE = 0.0725;

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log('Payment successful:', paymentIntentId);
    
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

      // Save to paidreservation collection
      await addDoc(collection(db, 'paidreservation'), {
        paymentIntentId,
        customerName,
        customerEmail,
        customerPhone,
        eventDate,
        rentalDays,
        deliveryMethod,
        address: deliveryMethod === 'delivery' ? {
          street: eventAddress,
          state: eventState,
          zipcode: eventZipcode,
          fullAddress: `${eventAddress}, ${eventState} ${eventZipcode}`,
          validated: validatedAddress,
        } : null,
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
      });

      console.log('✅ Reservation saved to paidreservation collection');

      // Clear the form
      setCartItems(prev => prev.map(item => ({ ...item, quantity: 1, addonSelected: false })));
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

      alert('🎉 Payment successful! Your booking has been confirmed. We will contact you shortly with delivery details.');
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert('Payment successful! Your booking has been confirmed.');
    }
  };

  useEffect(() => {
    loadProducts();
    loadCities();
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
        setProducts(productsData);
        const initialCart: CartItem[] = productsData.map((product) => ({
          product,
          quantity: 1,
          addonSelected: false,
          addon: product.addon ? {
            id: product.id,
            product_id: product.id,
            name: product.addon.name,
            price: product.addon.price,
          } : undefined,
        }));
        setCartItems(initialCart);
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
        setSelectedCity(data[0]);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
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
    const pickupCoords = await geocodeAddress(selectedCity.pickup_address);

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
        const deliveryFeeCalc = deliveryMethod === 'delivery' ? calculateDeliveryFee(distance) : 0;
        const collectionFeeCalc = deliveryMethod === 'delivery' ? calculateCollectionFee(distance) : 0;
        
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
            street: eventAddress,
            state: eventState,
            zipcode: eventZipcode,
            fullAddress: fullAddress,
            validated: eventCoords,
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
        alert('Your information has been saved successfully!');
      } catch (error) {
        console.error('Error saving to Firestore:', error);
        alert('There was an error saving your information. Please try again.');
      }
    } else {
      setIsAddressValid(false);
      setDistanceMiles(0);
      setValidatedAddress(null);
    }
  }

  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    setCartItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const deliveryFee = deliveryMethod === 'delivery' ? calculateDeliveryFee(distanceMiles) : 0;
  const collectionFee = deliveryMethod === 'delivery' ? calculateCollectionFee(distanceMiles) : 0;

  const isFormComplete = 
    customerName.trim() !== '' &&
    customerPhone.trim() !== '' &&
    customerEmail.trim() !== '' &&
    eventDate !== '' &&
    (deliveryMethod === 'pickup' || (deliveryMethod === 'delivery' && isAddressValid));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Hero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
     

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Items</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {cartItems.map((item, index) => (
                  <ProductCard
                    key={item.product.id}
                    product={item.product}
                    addon={item.addon}
                    quantity={item.quantity}
                    addonSelected={item.addonSelected}
                    onQuantityChange={(quantity) => updateCartItem(index, { quantity })}
                    onAddonToggle={(addonSelected) => updateCartItem(index, { addonSelected })}
                  />
                ))}
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

            <CitySelector
              cities={cities}
              selectedCity={selectedCity}
              onCityChange={setSelectedCity}
            />

            <DeliveryMethodSelector
              method={deliveryMethod}
              onMethodChange={setDeliveryMethod}
              deliveryFee={deliveryFee}
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
                  product={product} 
                  allImages={allImages} 
                />
              );
            })}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

export default App;
