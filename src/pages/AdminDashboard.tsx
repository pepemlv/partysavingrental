import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase.ts';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { LogOut, Calendar, Package, DollarSign, MapPin, User, Phone, Mail, Truck, Settings, Save, Plus } from 'lucide-react';

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

export default function AdminDashboard() {
  const [queries, setQueries] = useState<ClientQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<ClientQuery | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'cities'>('requests');
  const [cities, setCities] = useState<City[]>([]);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [newCity, setNewCity] = useState<Omit<City, 'id'>>({
    name: '',
    state: '',
    pickup_address: '',
    latitude: 0,
    longitude: 0,
  });
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
  }, [navigate]);

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
                  <Settings className="w-4 h-4" />
                  Manage Cities
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
      </div>
    </div>
  );
}
