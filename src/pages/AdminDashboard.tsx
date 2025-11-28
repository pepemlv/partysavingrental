import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../lib/firebase.ts';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LogOut, Calendar, Package, MapPin, User, Phone, Mail, Truck, Save, Plus, Edit, Trash2 } from 'lucide-react';

interface ClientQuery {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: {
    street: string;
    state: string;
    zipcode: string;
    fullAddress: string;
  };
  eventDate: string;
  rentalDays: number;
  deliveryMethod: string;
  selectedCity: string;
  distance: number;
  deliveryFee: number;
  collectionFee: number;
  cart: Array<{
    productName: string;
    quantity: number;
    basePrice: number;
    addonSelected: boolean;
    addonName: string | null;
    addonPrice: number;
  }>;
  createdAt: any;
}

interface City {
  id: string;
  name: string;
  state: string;
  pickup_address: string;
  latitude: number;
  longitude: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  category: string;
  image_url?: string;
  image_with_addon_url?: string;
  gallery_images?: string[];
  addon?: {
    name: string;
    price: number;
  };
}

export default function AdminDashboard() {
  const [queries, setQueries] = useState<ClientQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<ClientQuery | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'cities' | 'products'>('requests');
  const [cities, setCities] = useState<City[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newCity, setNewCity] = useState<Omit<City, 'id'>>({
    name: '',
    state: '',
    pickup_address: '',
    latitude: 0,
    longitude: 0,
  });
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    base_price: 0,
    category: 'furniture',
    addon: {
      name: '',
      price: 0,
    },
  });
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [addonImageFile, setAddonImageFile] = useState<File | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem('isAdminAuthenticated');
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }

    loadQueries();
    loadCities();
    loadProducts();
  }, [navigate]);

  const loadProducts = async () => {
    try {
      const q = query(collection(db, 'products'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const data: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Product);
      });
      
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCities = async () => {
    try {
      const q = query(collection(db, 'cities'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const data: City[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as City);
      });
      
      setCities(data);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadQueries = async () => {
    try {
      const q = query(collection(db, 'clientqueries'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: ClientQuery[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ClientQuery);
      });
      
      setQueries(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading queries:', error);
      setLoading(false);
    }
  };

  const handleUpdateCity = async (city: City) => {
    try {
      const cityRef = doc(db, 'cities', city.id);
      await updateDoc(cityRef, {
        name: city.name,
        state: city.state,
        pickup_address: city.pickup_address,
        latitude: city.latitude,
        longitude: city.longitude,
      });

      setSaveMessage('City updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      setEditingCity(null);
      loadCities();
    } catch (error) {
      console.error('Error updating city:', error);
      setSaveMessage('Error updating city');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleAddCity = async () => {
    try {
      await addDoc(collection(db, 'cities'), {
        name: newCity.name,
        state: newCity.state,
        pickup_address: newCity.pickup_address,
        latitude: newCity.latitude,
        longitude: newCity.longitude,
      });

      setSaveMessage('City added successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      setIsAddingCity(false);
      setNewCity({
        name: '',
        state: '',
        pickup_address: '',
        latitude: 0,
        longitude: 0,
      });
      loadCities();
    } catch (error) {
      console.error('Error adding city:', error);
      setSaveMessage('Error adding city');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleAddProduct = async () => {
    try {
      setUploadingImages(true);
      let mainImageUrl = '';
      let addonImageUrl = '';
      const galleryUrls: string[] = [];

      // Upload main image if selected
      if (mainImageFile) {
        const mainImageRef = ref(storage, `products/${Date.now()}_${mainImageFile.name}`);
        await uploadBytes(mainImageRef, mainImageFile);
        mainImageUrl = await getDownloadURL(mainImageRef);
      }

      // Upload addon image if selected
      if (addonImageFile) {
        const addonImageRef = ref(storage, `products/${Date.now()}_addon_${addonImageFile.name}`);
        await uploadBytes(addonImageRef, addonImageFile);
        addonImageUrl = await getDownloadURL(addonImageRef);
      }

      // Upload gallery images if selected
      if (galleryImageFiles.length > 0) {
        for (const file of galleryImageFiles) {
          const galleryImageRef = ref(storage, `products/gallery/${Date.now()}_${file.name}`);
          await uploadBytes(galleryImageRef, file);
          const url = await getDownloadURL(galleryImageRef);
          galleryUrls.push(url);
        }
      }

      await addDoc(collection(db, 'products'), {
        name: newProduct.name,
        description: newProduct.description,
        base_price: newProduct.base_price,
        category: newProduct.category,
        addon: newProduct.addon && newProduct.addon.name ? newProduct.addon : null,
        image_url: mainImageUrl,
        image_with_addon_url: addonImageUrl,
        gallery_images: galleryUrls,
      });

      setSaveMessage('Product added successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      setIsAddingProduct(false);
      setNewProduct({
        name: '',
        description: '',
        base_price: 0,
        category: 'furniture',
        addon: {
          name: '',
          price: 0,
        },
        image_url: '',
        image_with_addon_url: '',
      });
      setMainImageFile(null);
      setAddonImageFile(null);
      setGalleryImageFiles([]);
      setUploadingImages(false);
      loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      setSaveMessage('Error adding product');
      setTimeout(() => setSaveMessage(''), 3000);
      setUploadingImages(false);
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      setUploadingImages(true);
      let mainImageUrl = product.image_url || '';
      let addonImageUrl = product.image_with_addon_url || '';
      let galleryUrls = product.gallery_images || [];

      // Upload new main image if selected
      if (mainImageFile) {
        const mainImageRef = ref(storage, `products/${Date.now()}_${mainImageFile.name}`);
        await uploadBytes(mainImageRef, mainImageFile);
        mainImageUrl = await getDownloadURL(mainImageRef);
      }

      // Upload new addon image if selected
      if (addonImageFile) {
        const addonImageRef = ref(storage, `products/${Date.now()}_addon_${addonImageFile.name}`);
        await uploadBytes(addonImageRef, addonImageFile);
        addonImageUrl = await getDownloadURL(addonImageRef);
      }

      // Upload new gallery images if selected
      if (galleryImageFiles.length > 0) {
        const newGalleryUrls: string[] = [];
        for (const file of galleryImageFiles) {
          const galleryImageRef = ref(storage, `products/gallery/${Date.now()}_${file.name}`);
          await uploadBytes(galleryImageRef, file);
          const url = await getDownloadURL(galleryImageRef);
          newGalleryUrls.push(url);
        }
        galleryUrls = [...galleryUrls, ...newGalleryUrls];
      }

      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        name: product.name,
        description: product.description,
        base_price: product.base_price,
        category: product.category,
        addon: product.addon && product.addon.name ? product.addon : null,
        image_url: mainImageUrl,
        image_with_addon_url: addonImageUrl,
        gallery_images: galleryUrls,
      });

      setSaveMessage('Product updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      setEditingProduct(null);
      setMainImageFile(null);
      setAddonImageFile(null);
      setGalleryImageFiles([]);
      setUploadingImages(false);
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      setSaveMessage('Error updating product');
      setTimeout(() => setSaveMessage(''), 3000);
      setUploadingImages(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteDoc(doc(db, 'products', productId));
      setSaveMessage('Product deleted successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setSaveMessage('Error deleting product');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    navigate('/admin');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTotal = (query: ClientQuery) => {
    const cartTotal = query.cart.reduce((sum, item) => {
      return sum + (item.basePrice + item.addonPrice) * item.quantity * query.rentalDays;
    }, 0);
    const subtotal = cartTotal + query.deliveryFee + query.collectionFee;
    const tax = subtotal * 0.0725;
    return subtotal + tax;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'requests'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Client Requests
                </button>
                <button
                  onClick={() => setActiveTab('cities')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'cities'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Cities
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'products'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Products
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'requests' ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Client Requests</h2>
              <p className="text-gray-600">Total requests: {queries.length}</p>
            </div>

            {queries.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No client requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queries.map((query) => (
                  <div
                    key={query.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="grid md:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Customer</p>
                          <p className="font-semibold text-gray-900">{query.customerName}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Address</p>
                          <p className="text-sm text-gray-900">{query.address.street}</p>
                          <p className="text-xs text-gray-600">{query.address.state} {query.address.zipcode}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Event Date</p>
                          <p className="text-sm text-gray-900">{query.eventDate}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Total</p>
                            <p className="text-xl font-bold text-green-600">
                              ${calculateTotal(query).toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedQuery(selectedQuery?.id === query.id ? null : query)}
                            className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                          >
                            {selectedQuery?.id === query.id ? 'Hide' : 'Details'}
                          </button>
                        </div>
                      </div>

                      {selectedQuery?.id === query.id && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                              <div className="flex items-start gap-2">
                                <User className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Customer</p>
                                  <p className="text-sm text-gray-900">{query.customerName}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Phone className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Phone</p>
                                  <p className="text-sm text-gray-900">{query.customerPhone}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Email</p>
                                  <p className="text-sm text-gray-900">{query.customerEmail}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 mb-3">Event Details</h4>
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Address</p>
                                  <p className="text-sm text-gray-900">{query.address.street}</p>
                                  <p className="text-sm text-gray-900">{query.address.state} {query.address.zipcode}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Event Date & Duration</p>
                                  <p className="text-sm text-gray-900">{query.eventDate}</p>
                                  <p className="text-sm text-gray-600">{query.rentalDays} day{query.rentalDays !== 1 ? 's' : ''} rental</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Truck className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Delivery</p>
                                  <p className="text-sm text-gray-900 capitalize">{query.deliveryMethod}</p>
                                  <p className="text-xs text-gray-600">
                                    {query.distance.toFixed(2)} miles from {query.selectedCity}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Submitted</p>
                                  <p className="text-sm text-gray-900">{formatDate(query.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <h4 className="font-semibold text-gray-900 mb-3">Cart Items:</h4>
                          <div className="space-y-2">
                            {query.cart.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">{item.productName}</p>
                                  {item.addonSelected && item.addonName && (
                                    <p className="text-sm text-gray-600">+ {item.addonName}</p>
                                  )}
                                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                </div>
                                <p className="font-semibold text-gray-900">
                                  ${((item.basePrice + item.addonPrice) * item.quantity * query.rentalDays).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 p-4 bg-green-50 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Delivery Fee:</span>
                              <span className="font-medium text-gray-900">${query.deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Collection Fee:</span>
                              <span className="font-medium text-gray-900">${query.collectionFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Tax (7.25%):</span>
                              <span className="font-medium text-gray-900">
                                ${((calculateTotal(query) - (calculateTotal(query) / 1.0725)) ).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-green-200">
                              <span className="text-gray-900">Total:</span>
                              <span className="text-green-600">${calculateTotal(query).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Manage Pickup Cities</h2>
                <p className="text-gray-600">Update pickup addresses and coordinates for each city</p>
              </div>
              <button
                onClick={() => setIsAddingCity(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add New City
              </button>
            </div>

            {saveMessage && (
              <div className={`mb-4 p-4 rounded-lg ${
                saveMessage.includes('Error') 
                  ? 'bg-red-50 border border-red-200 text-red-800' 
                  : 'bg-green-50 border border-green-200 text-green-800'
              }`}>
                {saveMessage}
              </div>
            )}

            {isAddingCity && (
              <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New City</h3>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City Name</label>
                      <input
                        type="text"
                        value={newCity.name}
                        onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                        placeholder="Charlotte"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={newCity.state}
                        onChange={(e) => setNewCity({ ...newCity, state: e.target.value })}
                        placeholder="NC"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address</label>
                    <input
                      type="text"
                      value={newCity.pickup_address}
                      onChange={(e) => setNewCity({ ...newCity, pickup_address: e.target.value })}
                      placeholder="123 Main St, Charlotte, NC 28202"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={newCity.latitude}
                        onChange={(e) => setNewCity({ ...newCity, latitude: parseFloat(e.target.value) || 0 })}
                        placeholder="35.2271"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={newCity.longitude}
                        onChange={(e) => setNewCity({ ...newCity, longitude: parseFloat(e.target.value) || 0 })}
                        placeholder="-80.8431"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCity}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add City
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingCity(false);
                        setNewCity({ name: '', state: '', pickup_address: '', latitude: 0, longitude: 0 });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {cities.map((city) => (
                <div key={city.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  {editingCity?.id === city.id ? (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City Name
                          </label>
                          <input
                            type="text"
                            value={editingCity.name}
                            onChange={(e) => setEditingCity({ ...editingCity, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            value={editingCity.state}
                            onChange={(e) => setEditingCity({ ...editingCity, state: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pickup Address
                        </label>
                        <input
                          type="text"
                          value={editingCity.pickup_address}
                          onChange={(e) => setEditingCity({ ...editingCity, pickup_address: e.target.value })}
                          placeholder="Full address with street, city, state, zip"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Latitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={editingCity.latitude}
                            onChange={(e) => setEditingCity({ ...editingCity, latitude: parseFloat(e.target.value) || 0 })}
                            placeholder="35.2271"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Longitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={editingCity.longitude}
                            onChange={(e) => setEditingCity({ ...editingCity, longitude: parseFloat(e.target.value) || 0 })}
                            placeholder="-80.8431"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateCity(editingCity)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingCity(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{city.name}, {city.state}</h3>
                          <div className="flex items-start gap-2 mt-2">
                            <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                            <p className="text-sm text-gray-600">{city.pickup_address}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            📍 Coordinates: {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingCity(city)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'products' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
                {!isAddingProduct && (
                  <button
                    onClick={() => setIsAddingProduct(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Product
                  </button>
                )}
              </div>

              {saveMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                  {saveMessage}
                </div>
              )}

              {isAddingProduct && (
                <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h3>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          placeholder="Folding Chair"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <input
                          type="text"
                          value={newProduct.category}
                          onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                          placeholder="furniture"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        placeholder="Comfortable folding chair for your event"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Base Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newProduct.base_price}
                        onChange={(e) => setNewProduct({ ...newProduct, base_price: parseFloat(e.target.value) || 0 })}
                        placeholder="1.88"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Product Images</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Main Product Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setMainImageFile(e.target.files?.[0] || null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          {mainImageFile && (
                            <p className="text-sm text-green-600 mt-1">✓ {mainImageFile.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Image with Addon</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setAddonImageFile(e.target.files?.[0] || null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          {addonImageFile && (
                            <p className="text-sm text-green-600 mt-1">✓ {addonImageFile.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Gallery Images (Multiple)</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Multiple Images for Product Gallery
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setGalleryImageFiles(files);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        {galleryImageFiles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-semibold text-green-600">
                              ✓ {galleryImageFiles.length} image(s) selected:
                            </p>
                            <ul className="text-xs text-gray-600 list-disc list-inside">
                              {galleryImageFiles.map((file, index) => (
                                <li key={index}>{file.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          These images will appear in the "Our Products" section on the website
                        </p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Addon Details</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Addon Name</label>
                          <input
                            type="text"
                            value={newProduct.addon?.name || ''}
                            onChange={(e) => setNewProduct({ 
                              ...newProduct, 
                              addon: { 
                                name: e.target.value, 
                                price: newProduct.addon?.price || 0 
                              } 
                            })}
                            placeholder="Add cloth cover"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Addon Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={newProduct.addon?.price || 0}
                            onChange={(e) => setNewProduct({ 
                              ...newProduct, 
                              addon: { 
                                name: newProduct.addon?.name || '', 
                                price: parseFloat(e.target.value) || 0 
                              } 
                            })}
                            placeholder="1.00"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddProduct}
                        disabled={uploadingImages}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {uploadingImages ? 'Uploading Images...' : 'Add Product'}
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingProduct(false);
                          setNewProduct({
                            name: '',
                            description: '',
                            base_price: 0,
                            category: 'furniture',
                            addon: { name: '', price: 0 },
                          });
                          setMainImageFile(null);
                          setAddonImageFile(null);
                          setGalleryImageFiles([]);
                        }}
                        disabled={uploadingImages}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  {editingProduct?.id === product.id ? (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                          <input
                            type="text"
                            value={editingProduct.name}
                            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                          <input
                            type="text"
                            value={editingProduct.category}
                            onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={editingProduct.description}
                          onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.base_price}
                          onChange={(e) => setEditingProduct({ ...editingProduct, base_price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Product Images</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Main Product Image</label>
                            {editingProduct.image_url && (
                              <div className="mb-2">
                                <img src={editingProduct.image_url} alt="Current main" className="w-32 h-32 object-cover rounded-lg" />
                                <p className="text-xs text-gray-500 mt-1">Current image</p>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setMainImageFile(e.target.files?.[0] || null)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                            {mainImageFile && (
                              <p className="text-sm text-green-600 mt-1">✓ New image: {mainImageFile.name}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Image with Addon</label>
                            {editingProduct.image_with_addon_url && (
                              <div className="mb-2">
                                <img src={editingProduct.image_with_addon_url} alt="Current addon" className="w-32 h-32 object-cover rounded-lg" />
                                <p className="text-xs text-gray-500 mt-1">Current image</p>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setAddonImageFile(e.target.files?.[0] || null)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                            {addonImageFile && (
                              <p className="text-sm text-green-600 mt-1">✓ New image: {addonImageFile.name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Gallery Images</h4>
                        {editingProduct.gallery_images && editingProduct.gallery_images.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Current Gallery Images:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {editingProduct.gallery_images.map((url, index) => (
                                <div key={index} className="relative">
                                  <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add More Gallery Images
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setGalleryImageFiles(files);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                          {galleryImageFiles.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-sm font-semibold text-green-600">
                                ✓ {galleryImageFiles.length} new image(s) to add:
                              </p>
                              <ul className="text-xs text-gray-600 list-disc list-inside">
                                {galleryImageFiles.map((file, index) => (
                                  <li key={index}>{file.name}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            New images will be added to existing gallery images
                          </p>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Addon Details</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Addon Name</label>
                            <input
                              type="text"
                              value={editingProduct.addon?.name || ''}
                              onChange={(e) => setEditingProduct({ 
                                ...editingProduct, 
                                addon: { 
                                  name: e.target.value, 
                                  price: editingProduct.addon?.price || 0 
                                } 
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Addon Price ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingProduct.addon?.price || 0}
                              onChange={(e) => setEditingProduct({ 
                                ...editingProduct, 
                                addon: { 
                                  name: editingProduct.addon?.name || '', 
                                  price: parseFloat(e.target.value) || 0 
                                } 
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateProduct(editingProduct)}
                          disabled={uploadingImages}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          <Save className="w-4 h-4" />
                          {uploadingImages ? 'Uploading...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(null);
                            setMainImageFile(null);
                            setAddonImageFile(null);
                            setGalleryImageFiles([]);
                          }}
                          disabled={uploadingImages}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                          
                          {/* Product Images Display */}
                          {(product.image_url || product.image_with_addon_url) && (
                            <div className="mt-3 flex gap-4">
                              {product.image_url && (
                                <div>
                                  <img src={product.image_url} alt={product.name} className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200" />
                                  <p className="text-xs text-gray-500 mt-1 text-center">Main</p>
                                </div>
                              )}
                              {product.image_with_addon_url && (
                                <div>
                                  <img src={product.image_with_addon_url} alt={`${product.name} with addon`} className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200" />
                                  <p className="text-xs text-gray-500 mt-1 text-center">With Addon</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Gallery Images Display */}
                          {product.gallery_images && product.gallery_images.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Gallery Images ({product.gallery_images.length}):
                              </p>
                              <div className="grid grid-cols-6 gap-2">
                                {product.gallery_images.map((url, index) => (
                                  <div key={index}>
                                    <img 
                                      src={url} 
                                      alt={`Gallery ${index + 1}`} 
                                      className="w-full h-16 object-cover rounded-lg border-2 border-gray-200" 
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-3 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-600">Category: {product.category}</span>
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              Base Price: ${product.base_price.toFixed(2)}
                            </div>
                          </div>
                          {product.addon && product.addon.name && (
                            <div className="mt-2 inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                              <span className="text-sm text-blue-700">
                                Addon: {product.addon.name} (+${product.addon.price.toFixed(2)})
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
