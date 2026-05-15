import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../lib/firebase.ts';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, deleteDoc, where, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LogOut, Calendar, Clock, Package, MapPin, User, Phone, Mail, Truck, Save, Plus, Edit, Trash2, X, AlertCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

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
  notes?: string;
  advance_days?: number;
  pickup_available?: boolean;
  delivery_rates?: {
    under_4_miles: number;
    from_5_to_10_miles: number;
    from_11_to_30_miles: number;
  };
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

interface InventoryItem {
  id: string;
  city_id: string;
  city_name: string;
  product_id: string;
  product_name: string;
  total_quantity: number;
  created_at: any;
  updated_at: any;
}

interface InventoryTransaction {
  id: string;
  inventory_id: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  notes?: string;
  created_at: any;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  selectedCity?: string;
  city_name?: string;
  city_id?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: any;
}

interface Seller {
  id?: string;
  name: string;
  seller_id: string;
  status: 'activated' | 'suspended' | 'on waiting approval';
  phone?: string;
  address?: string;
  city_id?: string;
  createdAt?: any;
}

export default function AdminDashboard() {
  const [queries, setQueries] = useState<ClientQuery[]>([]);
  const [paidOrders, setPaidOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<ClientQuery | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'cities' | 'products' | 'orders' | 'schedule' | 'inventory' | 'messages' | 'sellers'>('requests');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [cityAdmin, setCityAdmin] = useState<any | null>(null);
  const [cityAdminCity, setCityAdminCity] = useState<City | null>(null);
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
    notes: '',
    advance_days: 0,
    pickup_available: true,
    delivery_rates: {
      under_4_miles: 0,
      from_5_to_10_miles: 0,
      from_11_to_30_miles: 0
    },
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
  const [initialStockQuantities, setInitialStockQuantities] = useState<{ [cityId: string]: number }>({});
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerContext, setSellerContext] = useState<Seller | null>(null);
  const [ownedCityId, setOwnedCityId] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableQuantity, setAvailableQuantity] = useState<number>(0);
  const [selectedInventoryCity, setSelectedInventoryCity] = useState<string>('');
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState<string>('');
  const [checkStockDate, setCheckStockDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAddingSeller, setIsAddingSeller] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerId, setNewSellerId] = useState('');
  const [newSellerStatus, setNewSellerStatus] = useState<Seller['status']>('on waiting approval');
  const [newSellerAddress, setNewSellerAddress] = useState('');
  const [newSellerCity, setNewSellerCity] = useState<string>('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState<string>('');
  const [inventoryFilterCity, setInventoryFilterCity] = useState<string>('');
  const [showInventoryTable, setShowInventoryTable] = useState<boolean>(true);
  const [showLowStockAlerts, setShowLowStockAlerts] = useState<boolean>(true);
  const [showStockManagement, setShowStockManagement] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();

  useEffect(() => {
    const cityAdminSession = localStorage.getItem('cityAdminSession');
    if (!cityAdminSession) {
      navigate('/admin');
      return;
    }

    try {
      const ca = JSON.parse(cityAdminSession) as any;
      setCityAdmin(ca);
      if (ca.city_id) setOwnedCityId(ca.city_id);
      localStorage.removeItem('isAdminAuthenticated');
      localStorage.removeItem('sellerSession');
    } catch (err) {
      console.error('Invalid city admin session', err);
      navigate('/admin');
      return;
    }

    loadQueries();
    loadCities();
    loadProducts();
    loadPaidOrders();
    loadInventory();
    loadInventoryTransactions();
    loadMessages();
    loadSellers();
  }, [navigate]);

  useEffect(() => {
    if (cityAdmin && cities.length > 0) {
      const city = cities.find((c) => c.id === cityAdmin.city_id);
      if (city) setCityAdminCity(city);
    }
  }, [cityAdmin, cities]);

  const scopedCityId = cityAdmin?.city_id || sellerContext?.city_id || ownedCityId || '';
  const manageableCities = scopedCityId
    ? cities.filter((city) => city.id === scopedCityId)
    : cities;
  const scopedCityLabel = cityAdminCity?.name || cityAdmin?.city_name || cityAdmin?.city || manageableCities[0]?.name || '';
  const headerProfile = cityAdmin || sellerContext;
  const headerName = headerProfile?.name || headerProfile?.displayName || headerProfile?.username || 'Admin';
  const headerCity = scopedCityLabel || (scopedCityId ? 'Assigned city' : 'All cities');
  const headerPhone = headerProfile?.phone || '-';
  const headerAddress = headerProfile?.address || cityAdminCity?.pickup_address || manageableCities[0]?.pickup_address || '-';
  const manageableInventoryIds = new Set(inventory.map((item) => item.id));
  const manageableInventoryTransactions = inventoryTransactions.filter((txn) => manageableInventoryIds.has(txn.inventory_id));
  const getInventoryQuantity = (cityId: string, productId: string) => (
    inventory.find((item) => item.city_id === cityId && item.product_id === productId)?.total_quantity || 0
  );
  const getOrderDateKey = (order: any) => String(order.eventDate || '').split('T')[0];
  const getCalendarDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const scheduleOrdersByDate = useMemo(() => {
    return paidOrders.reduce((groups: Record<string, any[]>, order) => {
      const dateKey = getOrderDateKey(order);
      if (!dateKey) return groups;
      groups[dateKey] = [...(groups[dateKey] || []), order];
      return groups;
    }, {});
  }, [paidOrders]);
  const selectedScheduleOrders = scheduleOrdersByDate[selectedScheduleDate] || [];
  const todayKey = getCalendarDateKey(new Date());
  const upcomingScheduleDates = Object.keys(scheduleOrdersByDate)
    .filter((dateKey) => dateKey >= todayKey)
    .sort();
  const nextScheduleDate = upcomingScheduleDates[0] || '';
  const followingScheduleDate = upcomingScheduleDates[1] || '';
  const getScheduleColorClass = (dateKey: string) => {
    if (dateKey < todayKey) return 'bg-gray-400 border-gray-500 text-white hover:bg-gray-500';
    if (dateKey === nextScheduleDate) return 'bg-red-600 border-red-700 text-white hover:bg-red-700';
    if (dateKey === followingScheduleDate) return 'bg-orange-500 border-orange-600 text-white hover:bg-orange-600';
    return 'bg-yellow-300 border-yellow-400 text-gray-900 hover:bg-yellow-400';
  };
  const getScheduleDetailClass = (dateKey: string) => {
    if (dateKey < todayKey) return 'bg-gray-400 border-gray-500 text-white';
    if (dateKey === nextScheduleDate) return 'bg-red-600 border-red-700 text-white';
    if (dateKey === followingScheduleDate) return 'bg-orange-500 border-orange-600 text-white';
    return 'bg-yellow-300 border-yellow-400 text-gray-900';
  };
  const getCalendarDays = (monthDate: Date) => {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const days: Array<Date | null> = Array.from({ length: startOffset }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
    }

    return days;
  };
  const calendarMonths = useMemo(() => {
    const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    return [
      { month: calendarMonth, days: getCalendarDays(calendarMonth) },
      { month: nextMonth, days: getCalendarDays(nextMonth) },
    ];
  }, [calendarMonth]);

  useEffect(() => {
    if (!scopedCityId) return;
    if (!selectedInventoryCity || selectedInventoryCity !== scopedCityId) {
      setSelectedInventoryCity(scopedCityId);
    }
    if (inventoryFilterCity && inventoryFilterCity !== scopedCityId) {
      setInventoryFilterCity('');
    }
  }, [scopedCityId, selectedInventoryCity, inventoryFilterCity]);

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

  const loadSellers = async () => {
    try {
      const q = query(collection(db, 'sellers'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data: Seller[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...(d.data() as any) }));
      setSellers(data);
    } catch (err) {
      console.error('Error loading sellers', err);
    }
  };

  const handleAddSeller = async () => {
    try {
      if (!newSellerName || !newSellerId) {
        setSaveMessage('Please provide seller name and seller id');
        setTimeout(() => setSaveMessage(''), 3000);
        return;
      }

      await addDoc(collection(db, 'sellers'), {
        name: newSellerName,
        seller_id: newSellerId,
        status: newSellerStatus,
        address: newSellerAddress || '',
        city_id: newSellerCity || '',
        createdAt: serverTimestamp(),
      });

      setSaveMessage('Seller created successfully');
      setTimeout(() => setSaveMessage(''), 3000);
      setNewSellerName('');
      setNewSellerId('');
      setNewSellerAddress('');
      setNewSellerCity('');
      setNewSellerStatus('on waiting approval');
      setIsAddingSeller(false);
      loadSellers();
    } catch (err) {
      console.error('Error creating seller', err);
      setSaveMessage('Error creating seller');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleUpdateSellerStatus = async (sellerDocId: string, status: Seller['status']) => {
    try {
      const sellerRef = doc(db, 'sellers', sellerDocId);
      await updateDoc(sellerRef, { status });
      setSaveMessage('Seller status updated');
      setTimeout(() => setSaveMessage(''), 3000);
      loadSellers();
    } catch (err) {
      console.error('Error updating seller status', err);
      setSaveMessage('Error updating seller');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const loadInventory = async () => {
    try {
      const cityAdminSession = localStorage.getItem('cityAdminSession');
      let sessionCityId = ownedCityId;
      let sessionCityName = '';

      if (cityAdminSession) {
        try {
          const ca = JSON.parse(cityAdminSession) as any;
          sessionCityId = ca.city_id || ca.cityId || sessionCityId;
          sessionCityName = ca.city_name || ca.city || '';
        } catch (err) {
          console.error('Invalid city admin session', err);
        }
      }

      const querySnapshot = await getDocs(collection(db, 'inventory'));
      const data: InventoryItem[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      
      if (sessionCityId || sessionCityName) {
        const normalizedCityName = sessionCityName.trim().toLowerCase();
        setInventory(data.filter((item) => {
          const itemCityId = String(item.city_id || '');
          const itemCityName = String(item.city_name || '').trim().toLowerCase();
          return (sessionCityId && itemCityId === sessionCityId) || (normalizedCityName && itemCityName === normalizedCityName);
        }));
        return;
      }

      setInventory(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const loadInventoryTransactions = async () => {
    try {
      const q = query(collection(db, 'inventory_transactions'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: InventoryTransaction[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as InventoryTransaction);
      });
      
      setInventoryTransactions(data);
    } catch (error) {
      console.error('Error loading inventory transactions:', error);
    }
  };

  const normalizeCityValue = (value: any) => (value || '').toString().trim().toLowerCase();

  const resolveCityScopeValues = async (session: any): Promise<string[]> => {
    const values = new Set<string>();
    const addValue = (value: any) => {
      const normalized = normalizeCityValue(value);
      if (normalized) values.add(normalized);
    };

    addValue(session.city_name);
    addValue(session.city);
    addValue(session.city_id);
    addValue(session.cityId);

    const cityId = session.city_id || session.cityId || '';
    if (cityId) {
      const cityObj = cities.find((city) => city.id === cityId);
      addValue(cityObj?.name);
      addValue(cityObj?.id);

      if (!cityObj) {
        try {
          const cityRef = doc(db, 'cities', cityId);
          const citySnap = await getDoc(cityRef);
          if (citySnap.exists()) {
            const cityData = citySnap.data() as any;
            addValue(citySnap.id);
            addValue(cityData.name);
          }
        } catch (err) {
          console.error('Error resolving scoped city', err);
        }
      }
    }

    return Array.from(values);
  };

  const filterRecordsByCityScope = <T extends { selectedCity?: string }>(records: T[], cityScopeValues: string[]) => {
    const allowedCities = new Set(cityScopeValues);
    return records.filter((record) => allowedCities.has(normalizeCityValue(record.selectedCity)));
  };

  const filterMessagesByCityScope = (records: ContactMessage[], cityScopeValues: string[]) => {
    const allowedCities = new Set(cityScopeValues);
    return records.filter((record) => {
      const messageCityValues = [
        record.city,
        record.selectedCity,
        record.city_name,
        record.city_id,
      ].map(normalizeCityValue);

      return messageCityValues.some((cityValue) => allowedCities.has(cityValue));
    });
  };

  const calculateAvailableStock = async (cityId: string, productId: string, date: string): Promise<number> => {
    try {
      // Get inventory item
      const inventoryQuery = query(
        collection(db, 'inventory'),
        where('city_id', '==', cityId),
        where('product_id', '==', productId)
      );
      const inventorySnapshot = await getDocs(inventoryQuery);
      
      if (inventorySnapshot.empty) return 0;
      
      const inventoryItem = inventorySnapshot.docs[0].data() as InventoryItem;
      let totalStock = inventoryItem.total_quantity || 0;

      // Get all paid orders for this city and product
      const paidOrdersQuery = query(
        collection(db, 'paidreservation'),
        where('selectedCity', '==', cityId)
      );
      const paidOrdersSnapshot = await getDocs(paidOrdersQuery);
      
      const checkDate = new Date(date);
      
      paidOrdersSnapshot.forEach((doc) => {
        const order = doc.data();
        if (order.cart) {
          order.cart.forEach((item: any) => {
            if (item.productName === inventoryItem.product_name) {
              // Calculate event date range (day before to day after)
              const eventDate = new Date(order.eventDate);
              const dayBefore = new Date(eventDate);
              dayBefore.setDate(dayBefore.getDate() - 1);
              const dayAfter = new Date(eventDate);
              dayAfter.setDate(dayAfter.getDate() + 1);
              
              // Check if selected date falls within this range
              if (checkDate >= dayBefore && checkDate <= dayAfter) {
                totalStock -= item.quantity;
              }
            }
          });
        }
      });
      
      return Math.max(0, totalStock);
    } catch (error) {
      console.error('Error calculating available stock:', error);
      return 0;
    }
  };

  // Synchronous version using already loaded data
  const calculateAvailableStockSync = (cityId: string, productId: string, date: string): number => {
    try {
      // Get inventory item from loaded data
      const inventoryItem = inventory.find(
        item => item.city_id === cityId && item.product_id === productId
      );
      
      if (!inventoryItem) return 0;
      
      let totalStock = inventoryItem.quantity || inventoryItem.total_quantity || 0;

      // Filter paid orders for this city
      const checkDate = new Date(date);
      
      paidOrders.forEach((order) => {
        if (order.selectedCity === cityId && order.cart) {
          order.cart.forEach((item: any) => {
            if (item.productId === productId) {
              // Calculate event date range (day before to day after)
              const eventDate = new Date(order.eventDate);
              const dayBefore = new Date(eventDate);
              dayBefore.setDate(dayBefore.getDate() - 1);
              const dayAfter = new Date(eventDate);
              dayAfter.setDate(dayAfter.getDate() + 1);
              
              // Check if selected date falls within this range
              if (checkDate >= dayBefore && checkDate <= dayAfter) {
                totalStock -= item.quantity;
              }
            }
          });
        }
      });
      
      return Math.max(0, totalStock);
    } catch (error) {
      console.error('Error calculating available stock:', error);
      return 0;
    }
  };

  const handleSaveAvailableQuantity = async () => {
    try {
      if (!selectedInventoryCity || !selectedInventoryProduct) {
        setSaveMessage('Please fill all fields');
        setTimeout(() => setSaveMessage(''), 3000);
        return;
      }

      if (scopedCityId && selectedInventoryCity !== scopedCityId) {
        setSaveMessage('You can only update inventory for your assigned city');
        setTimeout(() => setSaveMessage(''), 3000);
        return;
      }

      // Find or create inventory item
      const inventoryQuery = query(
        collection(db, 'inventory'),
        where('city_id', '==', selectedInventoryCity),
        where('product_id', '==', selectedInventoryProduct)
      );
      const inventorySnapshot = await getDocs(inventoryQuery);
      
      const city = cities.find(c => c.id === selectedInventoryCity);
      const product = products.find(p => p.id === selectedInventoryProduct);
      
      let inventoryId = '';
      const updatedQuantity = Math.max(0, availableQuantity);

      if (inventorySnapshot.empty) {
        const newInventory = await addDoc(collection(db, 'inventory'), {
          city_id: selectedInventoryCity,
          city_name: city?.name || '',
          product_id: selectedInventoryProduct,
          product_name: product?.name || '',
          total_quantity: updatedQuantity,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        inventoryId = newInventory.id;
      } else {
        inventoryId = inventorySnapshot.docs[0].id;
        await updateDoc(doc(db, 'inventory', inventoryId), {
          total_quantity: updatedQuantity,
          updated_at: serverTimestamp(),
        });
      }

      setInventory((currentInventory) => {
        const existingItem = currentInventory.find((item) => item.id === inventoryId);
        if (existingItem) {
          return currentInventory.map((item) =>
            item.id === inventoryId
              ? { ...item, total_quantity: updatedQuantity, updated_at: new Date() }
              : item
          );
        }

        return [
          ...currentInventory,
          {
            id: inventoryId,
            city_id: selectedInventoryCity,
            city_name: city?.name || '',
            product_id: selectedInventoryProduct,
            product_name: product?.name || '',
            total_quantity: updatedQuantity,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];
      });

      setSaveMessage('Available quantity updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      setShowStockManagement(false);
      await loadInventory();
    } catch (error) {
      console.error('Error updating available quantity:', error);
      setSaveMessage('Error updating available quantity');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const loadQueries = async () => {
    try {
      const cityAdminSession = localStorage.getItem('cityAdminSession');
      if (cityAdminSession) {
        try {
          const ca = JSON.parse(cityAdminSession) as any;
          const cityScopeValues = await resolveCityScopeValues(ca);
          const q = query(collection(db, 'clientqueries'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          const data: ClientQuery[] = [];
          snap.forEach((d) => data.push({ id: d.id, ...(d.data() as any) } as ClientQuery));
          setQueries(filterRecordsByCityScope(data, cityScopeValues));
          setLoading(false);
          return;
        } catch (err) {
          console.error('Invalid city admin session', err);
          setQueries([]);
          setLoading(false);
          return;
        }
      }

      setQueries([]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading queries:', error);
      setLoading(false);
    }
  };

  const loadPaidOrders = async () => {
    try {
      const cityAdminSession = localStorage.getItem('cityAdminSession');
      if (cityAdminSession) {
        try {
          const ca = JSON.parse(cityAdminSession) as any;
          const cityScopeValues = await resolveCityScopeValues(ca);
          const q = query(collection(db, 'paidreservation'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          const data: any[] = [];
          snap.forEach((d) => data.push({ id: d.id, ...d.data() }));
          setPaidOrders(filterRecordsByCityScope(data, cityScopeValues));
          return;
        } catch (err) {
          console.error('Invalid city admin session', err);
          setPaidOrders([]);
          return;
        }
      }

      setPaidOrders([]);
    } catch (error) {
      console.error('Error loading paid orders:', error);
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!window.confirm('Are you sure you want to delete this client request?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'clientqueries', queryId));
      setSaveMessage('Request deleted successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      loadQueries();
    } catch (error) {
      console.error('Error deleting request:', error);
      setSaveMessage('Error deleting request');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const loadMessages = async () => {
    try {
      const q = query(collection(db, 'contactmessages'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: ContactMessage[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ContactMessage);
      });

      const cityAdminSession = localStorage.getItem('cityAdminSession');
      if (cityAdminSession) {
        try {
          const ca = JSON.parse(cityAdminSession) as any;
          const cityScopeValues = await resolveCityScopeValues(ca);
          setMessages(filterMessagesByCityScope(data, cityScopeValues));
          return;
        } catch (err) {
          console.error('Invalid city admin session', err);
          setMessages([]);
          return;
        }
      }

      setMessages([]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'contactmessages', messageId));
      setSaveMessage('Message deleted successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      setSaveMessage('Error deleting message');
      setTimeout(() => setSaveMessage(''), 3000);
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
        notes: city.notes || '',
        advance_days: city.advance_days || 0,
        pickup_available: city.pickup_available !== false,
        delivery_rates: city.delivery_rates || {
          under_4_miles: 0,
          from_5_to_10_miles: 0,
          from_11_to_30_miles: 0
        },
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
        notes: newCity.notes || '',
        advance_days: newCity.advance_days || 0,
        pickup_available: newCity.pickup_available !== false,
        delivery_rates: newCity.delivery_rates || {
          under_4_miles: 0,
          from_5_to_10_miles: 0,
          from_11_to_30_miles: 0
        },
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
        notes: '',
        advance_days: 0,
        pickup_available: true,
        delivery_rates: {
          under_4_miles: 0,
          from_5_to_10_miles: 0,
          from_11_to_30_miles: 0
        },
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

      const productDocRef = await addDoc(collection(db, 'products'), {
        name: newProduct.name,
        description: newProduct.description,
        base_price: newProduct.base_price,
        pricing_unit: newProduct.pricing_unit || '',
        category: newProduct.category,
        addon: newProduct.addon && newProduct.addon.name ? newProduct.addon : null,
        image_url: mainImageUrl,
        image_with_addon_url: addonImageUrl,
        gallery_images: galleryUrls,
      });

      // Create inventory records only for cities this user can manage.
      const allowedCityIds = new Set(manageableCities.map((city) => city.id));
      for (const [cityId, quantity] of Object.entries(initialStockQuantities)) {
        if (!allowedCityIds.has(cityId)) continue;
        if (quantity > 0) {
          const city = cities.find(c => c.id === cityId);
          if (city) {
            // Create inventory item
            const inventoryDocRef = await addDoc(collection(db, 'inventory'), {
              city_id: cityId,
              city_name: city.name,
              product_id: productDocRef.id,
              product_name: newProduct.name,
              total_quantity: quantity,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            });

            // Add initial transaction record
            await addDoc(collection(db, 'inventory_transactions'), {
              inventory_id: inventoryDocRef.id,
              type: 'in',
              quantity: quantity,
              date: new Date().toISOString().split('T')[0],
              notes: 'Initial stock',
              created_at: serverTimestamp(),
            });
          }
        }
      }

      setSaveMessage('Product added successfully with inventory!');
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
      setInitialStockQuantities({});
      setUploadingImages(false);
      loadProducts();
      loadInventory();
      loadInventoryTransactions();
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
        pricing_unit: product.pricing_unit || '',
        category: product.category,
        addon: product.addon && product.addon.name ? product.addon : null,
        image_url: mainImageUrl,
        image_with_addon_url: addonImageUrl,
        gallery_images: galleryUrls,
      });

      // Update inventory quantities only for cities this user can manage.
      const allowedCityIds = new Set(manageableCities.map((city) => city.id));
      for (const [cityId, newQuantity] of Object.entries(initialStockQuantities)) {
        if (!allowedCityIds.has(cityId)) continue;
        const city = cities.find(c => c.id === cityId);
        if (!city) continue;

        // Find existing inventory item
        const existingInventory = inventory.find(
          item => item.city_id === cityId && item.product_id === product.id
        );
        
        const currentQuantity = existingInventory?.total_quantity || 0;
        const quantityDiff = newQuantity - currentQuantity;

        if (quantityDiff !== 0) {
          if (existingInventory) {
            // Update existing inventory
            await updateDoc(doc(db, 'inventory', existingInventory.id), {
              total_quantity: newQuantity,
              updated_at: serverTimestamp(),
            });

            // Add transaction record
            await addDoc(collection(db, 'inventory_transactions'), {
              inventory_id: existingInventory.id,
              type: quantityDiff > 0 ? 'in' : 'out',
              quantity: Math.abs(quantityDiff),
              date: new Date().toISOString().split('T')[0],
              notes: `Stock adjustment (${currentQuantity} → ${newQuantity})`,
              created_at: serverTimestamp(),
            });
          } else if (newQuantity > 0) {
            // Create new inventory item
            const inventoryDocRef = await addDoc(collection(db, 'inventory'), {
              city_id: cityId,
              city_name: city.name,
              product_id: product.id,
              product_name: product.name,
              total_quantity: newQuantity,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            });

            // Add initial transaction
            await addDoc(collection(db, 'inventory_transactions'), {
              inventory_id: inventoryDocRef.id,
              type: 'in',
              quantity: newQuantity,
              date: new Date().toISOString().split('T')[0],
              notes: 'Initial stock',
              created_at: serverTimestamp(),
            });
          }
        }
      }

      setSaveMessage('Product updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      setEditingProduct(null);
      setMainImageFile(null);
      setAddonImageFile(null);
      setGalleryImageFiles([]);
      setInitialStockQuantities({});
      setUploadingImages(false);
      loadProducts();
      loadInventory();
      loadInventoryTransactions();
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
    localStorage.removeItem('sellerSession');
    localStorage.removeItem('cityAdminSession');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <div className="w-16 bg-white shadow-lg border-r border-gray-200 fixed left-0 top-0 bottom-0 flex flex-col items-center py-6">
        <nav className="flex-1 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`p-4 rounded-lg transition-colors ${
              activeTab === 'schedule'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Delivery Schedule"
          >
            <Clock className="w-6 h-6" />
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`p-4 rounded-lg transition-colors ${
              activeTab === 'orders'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Paid Orders"
          >
            <Package className="w-6 h-6" />
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`p-4 rounded-lg transition-colors ${
              activeTab === 'requests'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Client Requests"
          >
            <Calendar className="w-6 h-6" />
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`p-4 rounded-lg transition-colors ${
              activeTab === 'products'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Products"
          >
            <Package className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setActiveTab('inventory')}
            className={`p-4 rounded-lg transition-colors ${
              activeTab === 'inventory'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Inventory & Stock"
          >
            <Package className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setActiveTab('messages')}
            className={`p-4 rounded-lg transition-colors ${
              activeTab === 'messages'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Contact Messages"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </nav>
        
        <button
          onClick={handleLogout}
          className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-16">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === 'requests' && 'Client Requests'}
              {activeTab === 'orders' && 'Paid Orders'}
              {activeTab === 'schedule' && 'Delivery Schedule'}
              {activeTab === 'products' && 'Product Management'}
              {activeTab === 'inventory' && 'Inventory & Stock Management'}
              {activeTab === 'messages' && 'Contact Messages'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm lg:text-right">
              <div>
                <p className="text-xs font-medium text-gray-500">Admin Name</p>
                <p className="font-semibold text-gray-900">{headerName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">City Managed</p>
                <p className="font-semibold text-gray-900">{headerCity}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Phone</p>
                <p className="font-semibold text-gray-900">{headerPhone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Address</p>
                <p className="font-semibold text-gray-900">{headerAddress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
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
                      {/* Mobile View - Show only Customer and Date */}
                      <div className="md:hidden space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Customer</p>
                            <p className="font-semibold text-gray-900">{query.customerName}</p>
                            <p className="text-sm text-gray-500 mt-2 mb-1">Event Date</p>
                            <p className="text-sm text-gray-900">{query.eventDate}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedQuery(selectedQuery?.id === query.id ? null : query)}
                              className="px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                            >
                              {selectedQuery?.id === query.id ? 'Hide' : 'Details'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop View - Show all info */}
                      <div className="hidden md:grid md:grid-cols-5 gap-4 items-center">
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
                          <p className="text-sm text-gray-500 mb-1">Selected City</p>
                          <p className="text-sm text-gray-900">{query.selectedCity || '—'}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1">Event Date</p>
                          <p className="text-sm text-gray-900">{query.eventDate}</p>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Total</p>
                            <p className="text-xl font-bold text-green-600">
                              ${calculateTotal(query).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedQuery(selectedQuery?.id === query.id ? null : query)}
                              className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                            >
                              {selectedQuery?.id === query.id ? 'Hide' : 'Details'}
                            </button>
                          </div>
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
        ) : activeTab === 'orders' ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Paid Orders</h2>
              <p className="text-gray-600">
                {scopedCityLabel
                  ? `${scopedCityLabel} paid orders: ${paidOrders.length}`
                  : `Total paid orders: ${paidOrders.length}`}
              </p>
            </div>

            {paidOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  {scopedCityLabel ? `No paid orders for ${scopedCityLabel} yet` : 'No paid orders yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paidOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    {/* Compact view - Always visible */}
                    <div className="p-4 hover:bg-gray-50 transition-colors">
                      {/* Mobile: Card Layout */}
                      <div className="md:hidden space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-gray-500">Customer</p>
                            <p className="font-semibold text-gray-900">{order.customerName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-lg font-bold text-green-600">
                              ${order.pricing?.total?.toFixed(2) || order.total?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Event Date</p>
                            <p className="text-sm text-gray-900">{order.eventDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm text-gray-900 truncate">{order.selectedCity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Method</p>
                            <p className="text-sm text-gray-900 capitalize">{order.deliveryMethod}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <p className="text-sm text-green-600 font-medium">{order.status}</p>
                          </div>
                        </div>
                        
                        {order.address?.userTyped?.street && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <p className="text-xs text-gray-500 mb-1">Customer Home Address</p>
                            <p className="text-sm text-gray-900">
                              {order.address.userTyped.street.trim()}
                              {(order.address.city || order.address.userTyped.state || order.address.userTyped.zipcode) && (
                                <>, {order.address.city || ''} {order.address.userTyped.state || ''} {order.address.userTyped.zipcode || ''}</>
                              )}
                            </p>
                          </div>
                        )}
                        
                        <button
                          onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          {expandedOrderId === order.id ? 'Hide Details' : 'See Details'}
                        </button>
                      </div>
                      
                      {/* Desktop: Grid Layout */}
                      <div className="hidden md:flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Customer</p>
                          <p className="font-semibold text-gray-900">{order.customerName}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Event Date</p>
                          <p className="text-sm text-gray-900">{order.eventDate}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Location</p>
                          <p className="text-sm text-gray-900">{order.selectedCity}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Customer Home Address</p>
                          {order.address?.userTyped?.street ? (
                            <p className="text-sm text-gray-900" title={`${order.address.userTyped.street.trim()}, ${order.address.city || ''} ${order.address.userTyped.state || ''} ${order.address.userTyped.zipcode || ''}`}>
                              {order.address.userTyped.street.trim()}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400">N/A</p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Method</p>
                          <p className="text-sm text-gray-900 capitalize">{order.deliveryMethod}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total</p>
                          <p className="text-xl font-bold text-green-600">
                            ${order.pricing?.total?.toFixed(2) || order.total?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        {expandedOrderId === order.id ? 'Hide Details' : 'See Details'}
                      </button>
                      </div>
                    </div>
                    
                    {/* Expanded details - Only visible when clicked */}
                    {expandedOrderId === order.id && (
                      <div className="px-6 pb-6 pt-2 bg-gray-50 border-t border-gray-200">
                        <div className="grid md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Contact Information</p>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">📧 {order.customerEmail}</p>
                              <p className="text-sm text-gray-600">📱 {order.customerPhone}</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Event Details</p>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">Rental: {order.rentalDays} day(s)</p>
                              <p className="text-sm text-gray-600">Status: <span className="text-green-600 font-medium">{order.status}</span></p>
                              {order.deliveryMethod === 'pickup' ? (
                                <>
                                  <p className="text-sm text-gray-600">Pickup Location: {order.pickupAddress || 'N/A'}</p>
                                  {order.address?.userTyped && (
                                    <div className="text-sm text-gray-600 mt-2">
                                      <span className="font-medium">Event Address:</span>
                                      <br />
                                      {order.address.userTyped.street && (
                                        <>{order.address.userTyped.street.trim()}<br /></>
                                      )}
                                      {(order.address.city || order.address.userTyped.state || order.address.userTyped.zipcode) && (
                                        <>
                                          {order.address.city || ''}{order.address.city && ', '}
                                          {order.address.userTyped.state || ''}{order.address.userTyped.state && ' '}
                                          {order.address.userTyped.zipcode || ''}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600">
                                    Delivery: {
                                      order.address?.userTyped?.street || 
                                      order.address?.street || 
                                      order.address?.fullAddress || 
                                      (typeof order.address === 'string' ? order.address : 'N/A')
                                    }
                                  </p>
                                  {(order.address?.userTyped?.state || order.address?.city) && (
                                    <p className="text-sm text-gray-600">
                                      City/State: {order.address?.city || ''} {order.address?.userTyped?.state || order.address?.state || ''}
                                    </p>
                                  )}
                                  {(order.address?.userTyped?.zipcode || order.address?.zipcode) && (
                                    <p className="text-sm text-gray-600">
                                      Zip: {order.address?.userTyped?.zipcode || order.address?.zipcode}
                                    </p>
                                  )}
                                  {order.distance && (
                                    <p className="text-sm text-gray-600">Distance: {order.distance.toFixed(1)} miles</p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {order.cart && order.cart.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-300">
                            <p className="text-sm font-medium text-gray-700 mb-3">Order Items:</p>
                            <div className="space-y-2">
                              {order.cart.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded">
                                  <span className="text-gray-600">
                                    {item.productName} {item.addonSelected && `+ ${item.addonName}`} × {item.quantity}
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    ${((item.basePrice + (item.addonSelected ? item.addonPrice : 0)) * item.quantity * order.rentalDays).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Pricing Breakdown */}
                            {order.pricing && (
                              <div className="mt-3 pt-3 border-t border-gray-300 bg-white p-3 rounded space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Subtotal:</span>
                                  <span className="text-gray-900">${order.pricing.subtotal?.toFixed(2) || '0.00'}</span>
                                </div>
                                {order.pricing.deliveryFee > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Delivery Fee:</span>
                                    <span className="text-gray-900">${order.pricing.deliveryFee.toFixed(2)}</span>
                                  </div>
                                )}
                                {order.pricing.collectionFee > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Collection Fee:</span>
                                    <span className="text-gray-900">${order.pricing.collectionFee.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Tax (7.25%):</span>
                                  <span className="text-gray-900">${order.pricing.tax?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-300">
                                  <span className="text-gray-900">Total:</span>
                                  <span className="text-green-600">${order.pricing.total?.toFixed(2) || '0.00'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-4 pt-4 border-t border-gray-300 text-xs text-gray-500 space-y-1">
                          <p>Order placed: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'N/A'}</p>
                          <p className="text-gray-400">Payment ID: {order.paymentIntentId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'schedule' ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Delivery Schedule</h2>
              <p className="text-gray-600">
                {scopedCityLabel ? `${scopedCityLabel} paid event dates` : 'Paid event dates'}: {paidOrders.length}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-green-900 rounded-xl shadow-sm border border-green-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                    className="px-3 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700"
                  >
                    Prev
                  </button>
                  <h3 className="text-xl font-bold text-white">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                    className="px-3 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700"
                  >
                    Next
                  </button>
                </div>

                <div className="grid xl:grid-cols-2 gap-6">
                  {calendarMonths.map(({ month, days }) => (
                    <div key={`${month.getFullYear()}-${month.getMonth()}`}>
                      <h4 className="text-center text-lg font-bold text-white mb-3">
                        {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h4>
                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
                          <div key={dayName} className="text-center text-xs font-semibold text-green-100 py-2">{dayName}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {days.map((date, index) => {
                          if (!date) return <div key={`empty-${index}`} className="aspect-square" />;

                          const dateKey = getCalendarDateKey(date);
                          const dayOrders = scheduleOrdersByDate[dateKey] || [];
                          const hasPaidEvents = dayOrders.length > 0;
                          const isSelected = selectedScheduleDate === dateKey;
                          const isToday = dateKey === todayKey;
                          const eventColorClass = getScheduleColorClass(dateKey);

                          return (
                            <button
                              key={dateKey}
                              onClick={() => setSelectedScheduleDate(dateKey)}
                              className={`aspect-square rounded-lg border text-sm transition-colors ${
                                hasPaidEvents
                                  ? eventColorClass
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              } ${isToday ? 'font-bold' : 'font-semibold'} ${isSelected ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                            >
                              <span>{date.getDate()}</span>
                              {isToday && <span className="block text-[10px] leading-none mt-1">Today</span>}
                              {hasPaidEvents && <span className="block text-xs mt-1">{dayOrders.length}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl shadow-sm border p-6 ${selectedScheduleOrders.length > 0 ? getScheduleDetailClass(selectedScheduleDate) : 'bg-white border-gray-200 text-gray-900'}`}>
                <h3 className="text-lg font-semibold mb-2">
                  {new Date(`${selectedScheduleDate}T00:00:00`).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
                <p className={`text-sm mb-4 ${selectedScheduleOrders.length > 0 ? 'text-current' : 'text-gray-600'}`}>{selectedScheduleOrders.length} paid event(s)</p>

                {selectedScheduleOrders.length === 0 ? (
                  <p className="text-sm text-gray-500">No paid delivery events for this date.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedScheduleOrders.map((order) => (
                      <div key={order.id} className="border border-white/40 rounded-lg p-4 bg-white/15">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{order.customerName || '-'}</p>
                            <p className="text-sm">{order.customerPhone || '-'}</p>
                            <p className="text-sm">{order.customerEmail || '-'}</p>
                          </div>
                          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">{order.status || 'paid'}</span>
                        </div>

                        <div className="mt-3 text-sm space-y-1">
                          <p><span className="font-semibold">Method:</span> {order.deliveryMethod || '-'}</p>
                          <p><span className="font-semibold">Address:</span> {order.address?.userTyped?.street || order.address?.street || order.address?.fullAddress || '-'}</p>
                          <p><span className="font-semibold">City/State:</span> {order.address?.city || ''} {order.address?.userTyped?.state || order.address?.state || ''} {order.address?.userTyped?.zipcode || order.address?.zipcode || ''}</p>
                          <p><span className="font-semibold">Distance:</span> {order.distance ? `${Number(order.distance).toFixed(2)} miles` : '-'}</p>
                          <p><span className="font-semibold">Total:</span> ${order.pricing?.total?.toFixed(2) || order.total?.toFixed?.(2) || '0.00'}</p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-semibold mb-2">Items</p>
                          <div className="space-y-1">
                            {(order.cart || []).map((item: any, index: number) => (
                              <p key={index} className="text-sm">
                                {item.productName} x {item.quantity}
                                {item.addonSelected && item.addonName ? ` + ${item.addonName}` : ''}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : activeTab === 'products' ? (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Product Management</h2>
                <p className="text-gray-600">View products. Use Inventory to adjust your city stock quantities.</p>
              </div>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Unit</label>
                      <input
                        type="text"
                        value={(newProduct as any).pricing_unit || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, pricing_unit: e.target.value } as any)}
                        placeholder="per chair, per day, per equipment, etc."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Initial Stock Quantity</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {scopedCityLabel
                          ? `Set the initial inventory quantity for ${scopedCityLabel}`
                          : 'Set the initial inventory quantity for each location'}
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        {manageableCities.map((city) => (
                          <div key={city.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {city.name}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={initialStockQuantities[city.id] || ''}
                              onChange={(e) => setInitialStockQuantities({
                                ...initialStockQuantities,
                                [city.id]: parseInt(e.target.value) || 0
                              })}
                              placeholder="0"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                        <p className="text-xs text-gray-500 mt-2">Leave at 0 if this product is not available in this location</p>
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
                          setInitialStockQuantities({});
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Unit</label>
                        <input
                          type="text"
                          value={(editingProduct as any).pricing_unit || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, pricing_unit: e.target.value } as any)}
                          placeholder="per chair, per day, per equipment, etc."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Stock Quantity</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          {scopedCityLabel
                            ? `Update inventory quantity for ${scopedCityLabel}`
                            : 'Update inventory quantity for each location'}
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                          {manageableCities.map((city) => {
                            const currentStock = inventory.find(
                              item => item.city_id === city.id && item.product_id === editingProduct.id
                            )?.total_quantity || 0;
                            return (
                              <div key={city.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {city.name}
                                  <span className="ml-2 text-xs text-gray-500">(Current: {currentStock})</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={initialStockQuantities[city.id] ?? currentStock}
                                  onChange={(e) => setInitialStockQuantities({
                                    ...initialStockQuantities,
                                    [city.id]: parseInt(e.target.value) || 0
                                  })}
                                  placeholder="0"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Changes will create stock adjustment transactions</p>
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Product Images</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Main Product Image</label>
                            {editingProduct.image_url && (
                              <div className="mb-2 relative group inline-block">
                                <img src={editingProduct.image_url} alt="Current main" className="w-32 h-32 object-cover rounded-lg" />
                                <button
                                  onClick={() => {
                                    setEditingProduct({ ...editingProduct, image_url: '' });
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                  title="Delete image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
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
                              <div className="mb-2 relative group inline-block">
                                <img src={editingProduct.image_with_addon_url} alt="Current addon" className="w-32 h-32 object-cover rounded-lg" />
                                <button
                                  onClick={() => {
                                    setEditingProduct({ ...editingProduct, image_with_addon_url: '' });
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                  title="Delete image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
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
                                <div key={index} className="relative group">
                                  <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                                  <button
                                    onClick={() => {
                                      const newGalleryImages = editingProduct.gallery_images?.filter((_, i) => i !== index) || [];
                                      setEditingProduct({ ...editingProduct, gallery_images: newGalleryImages });
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="Delete image"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
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
                          
                          {/* Current Stock Levels */}
                          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm font-semibold text-gray-700 mb-2">
                              {scopedCityLabel ? `Current Stock in ${scopedCityLabel}:` : 'Current Stock by Location:'}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {manageableCities.map((city) => {
                                const inventoryItem = inventory.find(
                                  item => item.city_id === city.id && item.product_id === product.id
                                );
                                const stockQty = inventoryItem?.total_quantity || 0;
                                return (
                                  <div key={city.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">{city.name}:</span>
                                    <span className={`font-semibold ${stockQty > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                      {stockQty}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Use the Inventory tab to adjust stock quantities
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">Inventory only</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : activeTab === 'cities' ? (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Manage Pickup Cities</h2>
                <p className="text-gray-600">Update pickup addresses and coordinates for each city</p>
              </div>
              {!isAddingCity && (
                <button
                  onClick={() => setIsAddingCity(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add New City
                </button>
              )}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Advance Payment Required (Days)</label>
                    <input
                      type="number"
                      min="0"
                      value={newCity.advance_days || 0}
                      onChange={(e) => setNewCity({ ...newCity, advance_days: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Number of days customers must book in advance (e.g., 10 for New York)</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <input
                        type="checkbox"
                        checked={newCity.pickup_available !== false}
                        onChange={(e) => setNewCity({ ...newCity, pickup_available: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      Pickup Available
                    </label>
                    <p className="mt-1 text-xs text-gray-500">If unchecked, customers can only select delivery for this city</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Rates</label>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Under 4 miles ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newCity.delivery_rates?.under_4_miles || 0}
                          onChange={(e) => setNewCity({ 
                            ...newCity, 
                            delivery_rates: { 
                              ...newCity.delivery_rates,
                              under_4_miles: parseFloat(e.target.value) || 0,
                              from_5_to_10_miles: newCity.delivery_rates?.from_5_to_10_miles || 0,
                              from_11_to_30_miles: newCity.delivery_rates?.from_11_to_30_miles || 0
                            }
                          })}
                          placeholder="10.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">5 to 10 miles ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newCity.delivery_rates?.from_5_to_10_miles || 0}
                          onChange={(e) => setNewCity({ 
                            ...newCity, 
                            delivery_rates: { 
                              ...newCity.delivery_rates,
                              under_4_miles: newCity.delivery_rates?.under_4_miles || 0,
                              from_5_to_10_miles: parseFloat(e.target.value) || 0,
                              from_11_to_30_miles: newCity.delivery_rates?.from_11_to_30_miles || 0
                            }
                          })}
                          placeholder="15.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">11 to 30 miles ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newCity.delivery_rates?.from_11_to_30_miles || 0}
                          onChange={(e) => setNewCity({ 
                            ...newCity, 
                            delivery_rates: { 
                              ...newCity.delivery_rates,
                              under_4_miles: newCity.delivery_rates?.under_4_miles || 0,
                              from_5_to_10_miles: newCity.delivery_rates?.from_5_to_10_miles || 0,
                              from_11_to_30_miles: parseFloat(e.target.value) || 0
                            }
                          })}
                          placeholder="25.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Set flat delivery fees based on distance ranges</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                    <textarea
                      value={newCity.notes}
                      onChange={(e) => setNewCity({ ...newCity, notes: e.target.value })}
                      placeholder="Internal notes about this city (only visible in admin dashboard)"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
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
                        setNewCity({ 
                          name: '', 
                          state: '', 
                          pickup_address: '', 
                          latitude: 0, 
                          longitude: 0, 
                          notes: '', 
                          advance_days: 0,
                          pickup_available: true,
                          delivery_rates: {
                            under_4_miles: 0,
                            from_5_to_10_miles: 0,
                            from_11_to_30_miles: 0
                          }
                        });
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Advance Payment Required (Days)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editingCity.advance_days || 0}
                          onChange={(e) => setEditingCity({ ...editingCity, advance_days: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">Number of days customers must book in advance (e.g., 10 for New York)</p>
                      </div>
                      
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <input
                            type="checkbox"
                            checked={editingCity.pickup_available !== false}
                            onChange={(e) => setEditingCity({ ...editingCity, pickup_available: e.target.checked })}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          Pickup Available
                        </label>
                        <p className="mt-1 text-xs text-gray-500">If unchecked, customers can only select delivery for this city</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Rates
                        </label>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Under 4 miles ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingCity.delivery_rates?.under_4_miles || 0}
                              onChange={(e) => setEditingCity({ 
                                ...editingCity, 
                                delivery_rates: { 
                                  ...editingCity.delivery_rates,
                                  under_4_miles: parseFloat(e.target.value) || 0,
                                  from_5_to_10_miles: editingCity.delivery_rates?.from_5_to_10_miles || 0,
                                  from_11_to_30_miles: editingCity.delivery_rates?.from_11_to_30_miles || 0
                                }
                              })}
                              placeholder="10.00"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">5 to 10 miles ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingCity.delivery_rates?.from_5_to_10_miles || 0}
                              onChange={(e) => setEditingCity({ 
                                ...editingCity, 
                                delivery_rates: { 
                                  ...editingCity.delivery_rates,
                                  under_4_miles: editingCity.delivery_rates?.under_4_miles || 0,
                                  from_5_to_10_miles: parseFloat(e.target.value) || 0,
                                  from_11_to_30_miles: editingCity.delivery_rates?.from_11_to_30_miles || 0
                                }
                              })}
                              placeholder="15.00"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">11 to 30 miles ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingCity.delivery_rates?.from_11_to_30_miles || 0}
                              onChange={(e) => setEditingCity({ 
                                ...editingCity, 
                                delivery_rates: { 
                                  ...editingCity.delivery_rates,
                                  under_4_miles: editingCity.delivery_rates?.under_4_miles || 0,
                                  from_5_to_10_miles: editingCity.delivery_rates?.from_5_to_10_miles || 0,
                                  from_11_to_30_miles: parseFloat(e.target.value) || 0
                                }
                              })}
                              placeholder="25.00"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Set flat delivery fees based on distance ranges</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Notes
                        </label>
                        <textarea
                          value={editingCity.notes || ''}
                          onChange={(e) => setEditingCity({ ...editingCity, notes: e.target.value })}
                          placeholder="Internal notes about this city (only visible in admin dashboard)"
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
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
                          {city.advance_days && city.advance_days > 0 && (
                            <p className="text-xs text-blue-600 font-medium mt-2">
                              ⏰ Payment Required: {city.advance_days} days before event
                            </p>
                          )}
                          {city.pickup_available === false && (
                            <p className="text-xs text-red-600 font-medium mt-2">
                              🚫 Pickup Not Available - Delivery Only
                            </p>
                          )}
                          {city.delivery_rates && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-xs font-semibold text-blue-800 mb-2">Delivery Rates:</p>
                              <div className="grid grid-cols-3 gap-2 text-xs text-blue-700">
                                <div>
                                  <span className="font-medium">Under 4 mi:</span> ${city.delivery_rates.under_4_miles?.toFixed(2) || '0.00'}
                                </div>
                                <div>
                                  <span className="font-medium">5-10 mi:</span> ${city.delivery_rates.from_5_to_10_miles?.toFixed(2) || '0.00'}
                                </div>
                                <div>
                                  <span className="font-medium">11-30 mi:</span> ${city.delivery_rates.from_11_to_30_miles?.toFixed(2) || '0.00'}
                                </div>
                              </div>
                            </div>
                          )}
                          {city.notes && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-xs font-semibold text-yellow-800 mb-1">Admin Notes:</p>
                              <p className="text-sm text-yellow-700 whitespace-pre-wrap">{city.notes}</p>
                            </div>
                          )}
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
        ) : activeTab === 'inventory' ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Inventory & Stock Management</h2>
              <p className="text-gray-600">Manage inventory levels and track stock availability by location</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Products</p>
                    <p className="text-2xl font-bold text-blue-900">{products.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Inventory Items</p>
                    <p className="text-2xl font-bold text-green-900">{inventory.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Locations</p>
                    <p className="text-2xl font-bold text-purple-900">{manageableCities.length}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              
            </div>

            {/* Inventory Overview Table */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div 
                className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowInventoryTable(!showInventoryTable)}
              >
                <h3 className="text-lg font-semibold">Inventory Overview</h3>
                {showInventoryTable ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              
              {showInventoryTable && (
                <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={inventorySearchTerm}
                    onChange={(e) => setInventorySearchTerm(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  
                  {/* Filter by City */}
                  <select
                    value={inventoryFilterCity}
                    onChange={(e) => setInventoryFilterCity(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value="">{scopedCityId ? 'Assigned City' : 'All Cities'}</option>
                    {manageableCities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Mobile: Card View */}
              <div className="md:hidden space-y-4">
                {products
                  .filter(product => 
                    product.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                    product.category.toLowerCase().includes(inventorySearchTerm.toLowerCase())
                  )
                  .map((product) => {
                  const citiesToShow = manageableCities.filter(city => !inventoryFilterCity || city.id === inventoryFilterCity);
                  const totalAcrossCities = citiesToShow.reduce((sum, city) => {
                    const inv = inventory.find(i => i.product_id === product.id && i.city_id === city.id);
                    return sum + (inv?.total_quantity || 0);
                  }, 0);

                  return (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start gap-3 mb-3">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{product.name}</h4>
                          <p className="text-xs text-gray-500">{product.category}</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">Total: {totalAcrossCities}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {citiesToShow.map((city) => {
                          const inv = inventory.find(i => i.product_id === product.id && i.city_id === city.id);
                          const quantity = inv?.total_quantity || 0;
                          const available = calculateAvailableStockSync(
                            city.id,
                            product.id,
                            new Date().toISOString().split('T')[0]
                          );
                          return (
                            <div key={city.id} className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-500">{city.name}</p>
                              <p className="text-sm font-semibold text-gray-900">{quantity}</p>
                              {quantity > 0 && (
                                <p className={`text-xs ${available === quantity ? 'text-green-600' : 'text-yellow-600'}`}>
                                  ({available} avail)
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => {
                          const cityId = citiesToShow[0]?.id || manageableCities[0]?.id || '';
                          setSelectedInventoryProduct(product.id);
                          setSelectedInventoryCity(cityId);
                          setAvailableQuantity(getInventoryQuantity(cityId, product.id));
                          setShowStockManagement(true);
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Adjust Stock
                      </button>
                    </div>
                  );
                })}
                {products.filter(product => 
                  product.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                  product.category.toLowerCase().includes(inventorySearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {inventorySearchTerm ? 'No products match your search.' : 'No products available. Add products first.'}
                  </div>
                )}
              </div>
              
              {/* Desktop: Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      {manageableCities
                        .filter(city => !inventoryFilterCity || city.id === inventoryFilterCity)
                        .map((city) => (
                        <th key={city.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {city.name}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products
                      .filter(product => 
                        product.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                        product.category.toLowerCase().includes(inventorySearchTerm.toLowerCase())
                      )
                      .map((product) => {
                      const citiesToShow = manageableCities.filter(city => !inventoryFilterCity || city.id === inventoryFilterCity);
                      const totalAcrossCities = citiesToShow.reduce((sum, city) => {
                        const inv = inventory.find(i => i.product_id === product.id && i.city_id === city.id);
                        return sum + (inv?.total_quantity || 0);
                      }, 0);

                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {product.image_url && (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-10 h-10 rounded object-cover mr-3"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-xs text-gray-500">{product.category}</div>
                              </div>
                            </div>
                          </td>
                          {citiesToShow.map((city) => {
                            const inv = inventory.find(i => i.product_id === product.id && i.city_id === city.id);
                            const quantity = inv?.total_quantity || 0;
                            const available = calculateAvailableStockSync(
                              city.id,
                              product.id,
                              new Date().toISOString().split('T')[0]
                            );
                            return (
                              <td key={city.id} className="px-6 py-4 text-center">
                                <div className="text-sm font-semibold text-gray-900">{quantity}</div>
                                {quantity > 0 && (
                                  <div className={`text-xs ${available === quantity ? 'text-green-600' : 'text-yellow-600'}`}>
                                    ({available} avail)
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 text-center">
                            <div className="text-sm font-bold text-gray-900">{totalAcrossCities}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                const cityId = citiesToShow[0]?.id || manageableCities[0]?.id || '';
                                setSelectedInventoryProduct(product.id);
                                setSelectedInventoryCity(cityId);
                                setAvailableQuantity(getInventoryQuantity(cityId, product.id));
                                setShowStockManagement(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {products.filter(product => 
                      product.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                      product.category.toLowerCase().includes(inventorySearchTerm.toLowerCase())
                    ).length === 0 && (
                      <tr>
                        <td colSpan={manageableCities.filter(city => !inventoryFilterCity || city.id === inventoryFilterCity).length + 3} className="px-6 py-8 text-center text-gray-500">
                          {inventorySearchTerm ? 'No products match your search.' : 'No products available. Add products first.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
                </div>
              )}
            </div>

            {/* Low Stock Alerts */}
            {(() => {
              const lowStockThreshold = 10;
              const lowStockItems = inventory.filter(item => item.total_quantity <= lowStockThreshold && item.total_quantity > 0);
              const outOfStockItems = products.filter(product => {
                return manageableCities.every(city => {
                  const inv = inventory.find(i => i.product_id === product.id && i.city_id === city.id);
                  return !inv || inv.total_quantity === 0;
                });
              });

              if (lowStockItems.length === 0 && outOfStockItems.length === 0) return null;

              return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                  <div 
                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-yellow-100 transition-colors"
                    onClick={() => setShowLowStockAlerts(!showLowStockAlerts)}
                  >
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <h3 className="text-lg font-semibold text-yellow-900">Stock Alerts</h3>
                      <span className="ml-2 text-sm text-yellow-700">({lowStockItems.length + outOfStockItems.length})</span>
                    </div>
                    {showLowStockAlerts ? <ChevronUp className="w-5 h-5 text-yellow-600" /> : <ChevronDown className="w-5 h-5 text-yellow-600" />}
                  </div>
                  
                  {showLowStockAlerts && (
                    <div className="px-6 pb-6">
                  
                  {lowStockItems.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-yellow-800 mb-2">Low Stock (≤{lowStockThreshold} units)</h4>
                      <div className="space-y-2">
                        {lowStockItems.map(item => {
                          const product = products.find(p => p.id === item.product_id);
                          const city = cities.find(c => c.id === item.city_id);
                          return (
                            <div key={item.id} className="bg-white rounded p-3">
                              <div className="flex items-start gap-3">
                                {product?.image_url && (
                                  <img 
                                    src={product.image_url} 
                                    alt={product.name}
                                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="min-w-0">
                                      <span className="text-sm font-medium text-gray-900 block truncate">{product?.name}</span>
                                      <span className="text-xs text-gray-500">in {city?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="text-sm font-bold text-yellow-700 whitespace-nowrap">{item.total_quantity} left</span>
                                      <button
                                        onClick={() => {
                                          setSelectedInventoryProduct(item.product_id);
                                          setSelectedInventoryCity(item.city_id);
                                          setAvailableQuantity(item.total_quantity || 0);
                                          setShowStockManagement(true);
                                        }}
                                        className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs font-medium whitespace-nowrap"
                                      >
                                        Restock
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {outOfStockItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 mb-2">Out of Stock</h4>
                      <div className="space-y-2">
                        {outOfStockItems.map(product => (
                          <div key={product.id} className="bg-white rounded p-3">
                            <div className="flex items-start gap-3">
                              {product.image_url && (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                                <button
                                  onClick={() => {
                                    const cityId = manageableCities[0]?.id || '';
                                    setSelectedInventoryProduct(product.id);
                                    setSelectedInventoryCity(cityId);
                                    setAvailableQuantity(getInventoryQuantity(cityId, product.id));
                                    setShowStockManagement(true);
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium whitespace-nowrap w-full sm:w-auto"
                                >
                                  Add Stock
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    </div>
                  )}
                </div>
              );
            })()}

            {showStockManagement && (() => {
              const selectedInventoryProductObj = products.find((product) => product.id === selectedInventoryProduct);
              const selectedInventoryCityObj = manageableCities.find((city) => city.id === selectedInventoryCity);

              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200">
                    <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Available Quantity</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedInventoryProductObj?.name || 'Product'} in {selectedInventoryCityObj?.name || 'your city'}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowStockManagement(false)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Current available quantity</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {getInventoryQuantity(selectedInventoryCity, selectedInventoryProduct)}
                        </p>
                      </div>

                      <label className="block">
                        <span className="block text-sm font-medium text-gray-700 mb-2">Set available quantity</span>
                        <input
                          type="number"
                          min="0"
                          value={availableQuantity}
                          onChange={(event) => setAvailableQuantity(parseInt(event.target.value) || 0)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                          placeholder="Example: 50"
                          autoFocus
                        />
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                      <button
                        onClick={() => setShowStockManagement(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAvailableQuantity}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          </>
        ) : activeTab === 'messages' ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact Messages</h2>
              <p className="text-gray-600">Total messages: {messages.length}</p>
            </div>

            {messages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    {/* Compact view - Always visible */}
                    <div className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 grid md:grid-cols-4 gap-4 items-center">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Sender</p>
                            <p className="font-semibold text-gray-900">{message.name}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Date</p>
                            <p className="text-sm text-gray-900">
                              {message.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Subject</p>
                            <p className="text-sm text-gray-900 truncate">{message.subject}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              message.status === 'new' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {message.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => setExpandedMessageId(expandedMessageId === message.id ? null : message.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            {expandedMessageId === message.id ? 'Hide' : 'Details'}
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete message"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded details - Only visible when clicked */}
                    {expandedMessageId === message.id && (
                      <div className="px-6 pb-6 pt-2 bg-gray-50 border-t border-gray-200">
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Contact Information</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {message.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {message.phone}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Message</p>
                          <div className="p-4 bg-white rounded-lg">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
        </div>
      </div>
    </div>
  );
}
