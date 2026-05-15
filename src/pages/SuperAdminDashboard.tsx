import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../lib/firebase.ts';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, query, orderBy, deleteDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Briefcase, Calendar, Clock, Edit, LogOut, Mail, MapPin, MessageSquare, Package, Phone, Plus, Save, Trash2, Truck, User, X } from 'lucide-react';

interface AdminUser {
  id?: string;
  username: string;
  displayName?: string;
  createdAt?: any;
}

type Section = 'schedule' | 'requests' | 'orders' | 'products' | 'inventory' | 'franchiseRequests' | 'messages' | 'metropoles' | 'cities' | 'admins' | 'cityAdmins' | 'sellers';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('requests');
  const [cityFilter, setCityFilter] = useState('');

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [cityAdmins, setCityAdmins] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [metropoles, setMetropoles] = useState<any[]>([]);
  const [clientQueries, setClientQueries] = useState<any[]>([]);
  const [paidOrders, setPaidOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [franchiseApplications, setFranchiseApplications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState<any>({
    name: '',
    description: '',
    base_price: 0,
    display_order: 0,
    pricing_unit: '',
    category: 'furniture',
    addon: { name: '', price: 0 },
    metropole_prices: {},
  });
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [addonImageFile, setAddonImageFile] = useState<File | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedInventoryCity, setSelectedInventoryCity] = useState('');
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState('');
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState('');
  const [editingDisplayName, setEditingDisplayName] = useState('');

  const [isAddingCityAdmin, setIsAddingCityAdmin] = useState(false);
  const [cityAdminForm, setCityAdminForm] = useState<any>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city_id: '',
    username: '',
    password: '',
    status: 'on wait for approval',
  });
  const [editingCityAdminId, setEditingCityAdminId] = useState<string | null>(null);
  const [editingCityAdmin, setEditingCityAdmin] = useState<any>(null);

  const [isAddingCity, setIsAddingCity] = useState(false);
  const [isAddingMetropole, setIsAddingMetropole] = useState(false);
  const [newMetropole, setNewMetropole] = useState({ name: '', state: '' });
  const [editingMetropoleId, setEditingMetropoleId] = useState<string | null>(null);
  const [editingMetropole, setEditingMetropole] = useState<any>(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const [newCity, setNewCity] = useState<any>({
    name: '',
    state: '',
    metropole_id: '',
    metropole_name: '',
    pickup_address: '',
    latitude: '',
    longitude: '',
    notes: '',
    advance_days: 1,
    pickup_available: true,
    showable: true,
    delivery_rates: {
      under_4_miles: 0,
      from_5_to_10_miles: 0,
      from_11_to_30_miles: 0,
    },
  });
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCity, setEditingCity] = useState<any>(null);

  useEffect(() => {
    const isSuper = localStorage.getItem('isSuperAdminAuthenticated');
    if (!isSuper) {
      navigate('/admin');
      return;
    }
    loadAllData();
  }, [navigate]);

  const loadCollection = async (name: string, orderField?: string) => {
    const ref = orderField ? query(collection(db, name), orderBy(orderField, 'desc')) : collection(db, name);
    const snap = await getDocs(ref);
    const data: any[] = [];
    snap.forEach((item) => data.push({ id: item.id, ...(item.data() as any) }));
    return data;
  };

  const loadAllData = async () => {
    try {
      const [adminData, cityAdminData, cityData, metropoleData, requestData, orderData, productData, inventoryData, franchiseData, messageData, sellerData] = await Promise.all([
        loadCollection('admins'),
        loadCollection('cityadministrator'),
        loadCollection('cities'),
        loadCollection('metropoles'),
        loadCollection('clientqueries', 'createdAt'),
        loadCollection('paidreservation', 'createdAt'),
        loadCollection('products'),
        loadCollection('inventory'),
        loadCollection('franchiseapplications', 'createdAt'),
        loadCollection('contactmessages', 'createdAt'),
        loadCollection('sellers', 'createdAt'),
      ]);

      setAdmins(adminData);
      setCityAdmins(cityAdminData);
      setCities(cityData.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      setMetropoles(metropoleData.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      setClientQueries(requestData);
      setPaidOrders(orderData);
      setProducts(productData.sort((a, b) => {
        const firstOrder = Number(a.display_order || 0) > 0 ? Number(a.display_order) : Number.MAX_SAFE_INTEGER;
        const secondOrder = Number(b.display_order || 0) > 0 ? Number(b.display_order) : Number.MAX_SAFE_INTEGER;
        return firstOrder - secondOrder || (a.name || '').localeCompare(b.name || '');
      }));
      setInventory(inventoryData);
      setFranchiseApplications(franchiseData);
      setMessages(messageData);
      setSellers(sellerData);
    } catch (err) {
      console.error('Error loading super admin data', err);
    }
  };

  const selectedCity = cities.find((city) => city.id === cityFilter);
  const cityName = selectedCity?.name || '';
  const cityMatches = (value: any) => !cityFilter || String(value || '').trim().toLowerCase() === cityName.trim().toLowerCase();
  const cityIdMatches = (value: any) => !cityFilter || String(value || '') === cityFilter;

  const filteredRequests = useMemo(() => clientQueries.filter((item) => cityMatches(item.selectedCity)), [clientQueries, cityFilter, cityName]);
  const filteredOrders = useMemo(() => paidOrders.filter((item) => cityMatches(item.selectedCity)), [paidOrders, cityFilter, cityName]);
  const filteredInventory = useMemo(() => inventory.filter((item) => cityIdMatches(item.city_id)), [inventory, cityFilter]);
  const filteredFranchiseApplications = useMemo(() => franchiseApplications.filter((item) => cityMatches(item.city) || cityMatches(item.selectedCity)), [franchiseApplications, cityFilter, cityName]);
  const filteredMessages = useMemo(() => messages.filter((item) => cityMatches(item.city || item.selectedCity || item.city_name) || cityIdMatches(item.city_id)), [messages, cityFilter, cityName]);
  const filteredCityAdmins = useMemo(() => cityAdmins.filter((item) => cityIdMatches(item.city_id)), [cityAdmins, cityFilter]);
  const filteredSellers = useMemo(() => sellers.filter((item) => cityIdMatches(item.city_id)), [sellers, cityFilter]);
  const filteredProducts = useMemo(() => {
    if (!cityFilter) return products;
    const productIds = new Set(filteredInventory.map((item) => item.product_id));
    return products.filter((product) => productIds.has(product.id));
  }, [products, filteredInventory, cityFilter]);

  const sectionTitle: Record<Section, string> = {
    schedule: 'Delivery Schedule',
    requests: 'Client Requests',
    orders: 'Paid Orders',
    products: 'Product Management',
    inventory: 'Inventory & Stock Management',
    franchiseRequests: 'Franchise Requests',
    messages: 'Contact Messages',
    metropoles: 'Metropole Management',
    cities: 'City Management',
    admins: 'Admin Management',
    cityAdmins: 'City Admin Management',
    sellers: 'Sellers',
  };

  const navItems: Array<{ id: Section; title: string; icon: any }> = [
    { id: 'schedule', title: 'Delivery Schedule', icon: Clock },
    { id: 'orders', title: 'Paid Orders', icon: Truck },
    { id: 'requests', title: 'Client Requests', icon: Calendar },
    { id: 'products', title: 'Products', icon: Package },
    { id: 'inventory', title: 'Inventory & Stock', icon: Package },
    { id: 'franchiseRequests', title: 'Franchise Requests', icon: Briefcase },
    { id: 'messages', title: 'Contact Messages', icon: MessageSquare },
    { id: 'metropoles', title: 'Metropoles', icon: MapPin },
    { id: 'cities', title: 'Cities', icon: MapPin },
    { id: 'admins', title: 'Admins', icon: User },
    { id: 'cityAdmins', title: 'City Admins', icon: User },
    { id: 'sellers', title: 'Sellers', icon: User },
  ];

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

  const formatMoney = (value: any) => {
    const amount = Number(value || 0);
    return `$${amount.toFixed(2)}`;
  };

  const calculateRequestTotal = (item: any) => {
    if (item.pricing?.total || item.total) return Number(item.pricing?.total || item.total);

    const rentalDays = Number(item.rentalDays || 1);
    const cartTotal = (item.cart || []).reduce((sum: number, cartItem: any) => {
      const basePrice = Number(cartItem.basePrice || cartItem.price || 0);
      const addonPrice = Number(cartItem.addonPrice || 0);
      const quantity = Number(cartItem.quantity || 0);
      return sum + (basePrice + addonPrice) * quantity * rentalDays;
    }, 0);
    const subtotal = cartTotal + Number(item.deliveryFee || 0) + Number(item.collectionFee || 0);
    return subtotal + subtotal * 0.0725;
  };

  const getLineItemTotal = (record: any, cartItem: any) => {
    const basePrice = Number(cartItem.basePrice || cartItem.price || 0);
    const addonPrice = cartItem.addonSelected === false ? 0 : Number(cartItem.addonPrice || 0);
    const quantity = Number(cartItem.quantity || 0);
    const rentalDays = Number(record.rentalDays || 1);
    return (basePrice + addonPrice) * quantity * rentalDays;
  };

  const getPricingBreakdown = (item: any) => {
    const deliveryFee = Number(item.pricing?.deliveryFee ?? item.deliveryFee ?? 0);
    const collectionFee = Number(item.pricing?.collectionFee ?? item.collectionFee ?? 0);
    const cartTotal = (item.cart || []).reduce((sum: number, cartItem: any) => sum + getLineItemTotal(item, cartItem), 0);
    const subtotal = Number(item.pricing?.subtotal ?? cartTotal + deliveryFee + collectionFee);
    const tax = Number(item.pricing?.tax ?? subtotal * 0.0725);
    const total = Number(item.pricing?.total ?? item.total ?? subtotal + tax);

    return { deliveryFee, collectionFee, tax, total };
  };

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

  const getAddressLines = (item: any) => {
    const street = item.address?.userTyped?.street || item.address?.street || item.address?.fullAddress || '-';
    const city = item.address?.city || item.address?.userTyped?.city || '';
    const state = item.address?.userTyped?.state || item.address?.state || '';
    const zipcode = item.address?.userTyped?.zipcode || item.address?.zipcode || '';
    const secondLine = [city, state, zipcode].filter(Boolean).join(' ');

    return { street, secondLine };
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      base_price: 0,
      display_order: 0,
      pricing_unit: '',
      category: 'furniture',
      addon: { name: '', price: 0 },
      city_prices: {},
      metropole_prices: {},
      image_url: '',
      image_with_addon_url: '',
      gallery_images: [],
    });
    setMainImageFile(null);
    setAddonImageFile(null);
    setGalleryImageFiles([]);
    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const getProductMetropolePrice = (product: any, metropoleId: string) => {
    const value = product.metropole_prices?.[metropoleId];
    return value === undefined || value === '' ? product.base_price || 0 : Number(value);
  };

  const getProductCityPrice = (product: any, cityId: string) => {
    const city = cities.find((item) => item.id === cityId);
    if (city?.metropole_id) return getProductMetropolePrice(product, city.metropole_id);
    const value = product.city_prices?.[cityId];
    return value === undefined || value === '' ? product.base_price || 0 : Number(value);
  };

  const getInventoryQuantity = (cityId: string, productId: string) => (
    inventory.find((item) => item.city_id === cityId && item.product_id === productId)?.total_quantity || 0
  );

  const openStockModal = (cityId: string, productId: string) => {
    setSelectedInventoryCity(cityId);
    setSelectedInventoryProduct(productId);
    setAvailableQuantity(getInventoryQuantity(cityId, productId));
    setShowStockModal(true);
  };

  const handleSaveAvailableQuantity = async () => {
    if (!selectedInventoryCity || !selectedInventoryProduct) return;

    const city = cities.find((item) => item.id === selectedInventoryCity);
    const product = products.find((item) => item.id === selectedInventoryProduct);
    const inventoryQuery = query(
      collection(db, 'inventory'),
      where('city_id', '==', selectedInventoryCity),
      where('product_id', '==', selectedInventoryProduct)
    );
    const inventorySnapshot = await getDocs(inventoryQuery);
    const updatedQuantity = Math.max(0, availableQuantity);
    let inventoryId = '';

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

    setShowStockModal(false);
    loadAllData();
  };

  const uploadProductImages = async (currentProduct: any = {}) => {
    let imageUrl = currentProduct.image_url || '';
    let addonImageUrl = currentProduct.image_with_addon_url || '';
    let galleryUrls = currentProduct.gallery_images || [];

    if (mainImageFile) {
      const imageRef = ref(storage, `products/${Date.now()}_${mainImageFile.name}`);
      await uploadBytes(imageRef, mainImageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    if (addonImageFile) {
      const addonRef = ref(storage, `products/${Date.now()}_addon_${addonImageFile.name}`);
      await uploadBytes(addonRef, addonImageFile);
      addonImageUrl = await getDownloadURL(addonRef);
    }

    if (galleryImageFiles.length > 0) {
      const newGalleryUrls: string[] = [];
      for (const file of galleryImageFiles) {
        const galleryRef = ref(storage, `products/gallery/${Date.now()}_${file.name}`);
        await uploadBytes(galleryRef, file);
        newGalleryUrls.push(await getDownloadURL(galleryRef));
      }
      galleryUrls = [...galleryUrls, ...newGalleryUrls];
    }

    return { imageUrl, addonImageUrl, galleryUrls };
  };

  const handleSaveProduct = async () => {
    if (!productForm.name) return;
    setUploadingProduct(true);
    try {
      const { imageUrl, addonImageUrl, galleryUrls } = await uploadProductImages(editingProduct || {});
      const payload = {
        name: productForm.name,
        description: productForm.description || '',
        base_price: Number(productForm.base_price || 0),
        display_order: Number(productForm.display_order || 0),
        pricing_unit: productForm.pricing_unit || '',
        category: productForm.category || 'furniture',
        addon: productForm.addon?.name ? { name: productForm.addon.name, price: Number(productForm.addon.price || 0) } : null,
        metropole_prices: productForm.metropole_prices || {},
        city_prices: productForm.city_prices || {},
        image_url: imageUrl,
        image_with_addon_url: addonImageUrl,
        gallery_images: galleryUrls,
      };

      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), payload);
      } else {
        await addDoc(collection(db, 'products'), payload);
      }

      resetProductForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setUploadingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await deleteDoc(doc(db, 'products', productId));
    loadAllData();
  };

  const startEditingProduct = (product: any) => {
    setEditingProduct(product);
    setIsAddingProduct(false);
    setProductForm({
      ...product,
      addon: product.addon || { name: '', price: 0 },
      display_order: product.display_order || 0,
      city_prices: product.city_prices || {},
      metropole_prices: product.metropole_prices || {},
      gallery_images: product.gallery_images || [],
    });
    setMainImageFile(null);
    setAddonImageFile(null);
    setGalleryImageFiles([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('isSuperAdminAuthenticated');
    navigate('/admin/super-login');
  };

  const handleCreateAdmin = async () => {
    if (!newUsername) return;
    await addDoc(collection(db, 'admins'), {
      username: newUsername,
      displayName: newDisplayName || newUsername,
      createdAt: serverTimestamp(),
    });
    setNewUsername('');
    setNewDisplayName('');
    setIsAddingAdmin(false);
    loadAllData();
  };

  const handleSaveAdmin = async (adminId: string | undefined) => {
    if (!adminId) return;
    await updateDoc(doc(db, 'admins', adminId), {
      username: editingUsername,
      displayName: editingDisplayName,
    });
    setEditingAdminId(null);
    loadAllData();
  };

  const handleCreateCityAdmin = async () => {
    if (!cityAdminForm.name || !cityAdminForm.username || !cityAdminForm.password) return;
    const assignedCity = cities.find((city) => city.id === cityAdminForm.city_id);
    await addDoc(collection(db, 'cityadministrator'), {
      ...cityAdminForm,
      city_name: assignedCity?.name || '',
      createdAt: serverTimestamp(),
    });
    setCityAdminForm({ name: '', phone: '', email: '', address: '', city_id: '', username: '', password: '', status: 'on wait for approval' });
    setIsAddingCityAdmin(false);
    loadAllData();
  };

  const handleCreateMetropole = async () => {
    if (!newMetropole.name) return;
    await addDoc(collection(db, 'metropoles'), {
      name: newMetropole.name,
      state: newMetropole.state,
      createdAt: serverTimestamp(),
    });
    setNewMetropole({ name: '', state: '' });
    setIsAddingMetropole(false);
    loadAllData();
  };

  const handleSaveMetropole = async (metropole: any) => {
    if (!metropole?.id) return;
    await updateDoc(doc(db, 'metropoles', metropole.id), {
      name: metropole.name,
      state: metropole.state || '',
    });
    setEditingMetropoleId(null);
    setEditingMetropole(null);
    loadAllData();
  };

  const handleSaveCityAdmin = async (admin: any) => {
    const assignedCity = cities.find((city) => city.id === admin.city_id);
    await updateDoc(doc(db, 'cityadministrator', admin.id), {
      ...admin,
      city_name: assignedCity?.name || '',
    });
    setEditingCityAdminId(null);
    setEditingCityAdmin(null);
    loadAllData();
  };

  const handleCreateCity = async () => {
    if (!newCity.name || !newCity.state) return;
    const metropole = metropoles.find((item) => item.id === newCity.metropole_id);
    await addDoc(collection(db, 'cities'), {
      ...newCity,
      metropole_name: metropole?.name || '',
      latitude: newCity.latitude === '' ? 0 : Number(newCity.latitude),
      longitude: newCity.longitude === '' ? 0 : Number(newCity.longitude),
      createdAt: serverTimestamp(),
    });
    setNewCity({
      name: '',
      state: '',
      metropole_id: '',
      metropole_name: '',
      pickup_address: '',
      latitude: '',
      longitude: '',
      notes: '',
      advance_days: 1,
      pickup_available: true,
      showable: true,
      delivery_rates: { under_4_miles: 0, from_5_to_10_miles: 0, from_11_to_30_miles: 0 },
    });
    setIsAddingCity(false);
    loadAllData();
  };

  const handleSaveCity = async (city: any) => {
    const metropole = metropoles.find((item) => item.id === city.metropole_id);
    await updateDoc(doc(db, 'cities', city.id), {
      name: city.name,
      state: city.state,
      metropole_id: city.metropole_id || '',
      metropole_name: metropole?.name || city.metropole_name || '',
      pickup_address: city.pickup_address,
      showable: city.showable ?? true,
      latitude: city.latitude === '' ? 0 : Number(city.latitude),
      longitude: city.longitude === '' ? 0 : Number(city.longitude),
      notes: city.notes || '',
      advance_days: Number(city.advance_days) || 0,
      pickup_available: city.pickup_available !== false,
      delivery_rates: city.delivery_rates || {},
    });
    setEditingCityId(null);
    setEditingCity(null);
    loadAllData();
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    await deleteDoc(doc(db, 'clientqueries', requestId));
    if (expandedDetailsId === `request-${requestId}`) {
      setExpandedDetailsId(null);
    }
    loadAllData();
  };

  const EmptyState = ({ text }: { text: string }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 text-lg">{text}</p>
    </div>
  );

  const DetailButton = ({ id }: { id: string }) => (
    <button
      onClick={() => setExpandedDetailsId(expandedDetailsId === id ? null : id)}
      className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
    >
      {expandedDetailsId === id ? 'Hide' : 'Details'}
    </button>
  );

  const ProductEditor = () => (
    <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <input value={productForm.name || ''} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} placeholder="Product name" className="border px-3 py-2 rounded" />
        <input value={productForm.category || ''} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} placeholder="Category" className="border px-3 py-2 rounded" />
        <textarea value={productForm.description || ''} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} placeholder="Description" className="border px-3 py-2 rounded md:col-span-2" rows={3} />
        <label className="text-sm text-gray-700">
          Default base price
          <input type="number" step="0.01" value={productForm.base_price || 0} onChange={(event) => setProductForm({ ...productForm, base_price: parseFloat(event.target.value) || 0 })} placeholder="Default base price" className="mt-1 w-full border px-3 py-2 rounded" />
        </label>
        <label className="text-sm text-gray-700">
          Display order
          <input type="number" min="0" step="1" value={productForm.display_order || 0} onChange={(event) => setProductForm({ ...productForm, display_order: Number(event.target.value) || 0 })} placeholder="1 shows first" className="mt-1 w-full border px-3 py-2 rounded" />
        </label>
        <label className="text-sm text-gray-700">
          Pricing unit
          <input value={productForm.pricing_unit || ''} onChange={(event) => setProductForm({ ...productForm, pricing_unit: event.target.value })} placeholder="per chair" className="mt-1 w-full border px-3 py-2 rounded" />
        </label>
      </div>

      <div className="mt-5 border-t border-blue-200 pt-4">
        <p className="font-semibold text-gray-900 mb-3">Metropole Prices</p>
        <div className="grid md:grid-cols-3 gap-4">
          {metropoles.map((metropole) => (
            <label key={metropole.id} className="text-sm text-gray-700">
              {metropole.name}{metropole.state ? `, ${metropole.state}` : ''}
              <input
                type="number"
                step="0.01"
                value={productForm.metropole_prices?.[metropole.id] ?? ''}
                onChange={(event) => setProductForm({
                  ...productForm,
                  metropole_prices: {
                    ...(productForm.metropole_prices || {}),
                    [metropole.id]: event.target.value === '' ? '' : parseFloat(event.target.value) || 0,
                  },
                })}
                placeholder={`Default ${formatMoney(productForm.base_price)}`}
                className="mt-1 w-full border px-3 py-2 rounded"
              />
            </label>
          ))}
          {metropoles.length === 0 && <p className="text-sm text-gray-600">Create metropoles first to set metropole prices.</p>}
        </div>
      </div>

      <div className="mt-5 border-t border-blue-200 pt-4">
        <p className="font-semibold text-gray-900 mb-3">Images</p>
        <div className="grid md:grid-cols-3 gap-4">
          <label className="text-sm text-gray-700">Main Image<input type="file" accept="image/*" onChange={(event) => setMainImageFile(event.target.files?.[0] || null)} className="mt-1 w-full border px-3 py-2 rounded bg-white" /></label>
          <label className="text-sm text-gray-700">Addon Image<input type="file" accept="image/*" onChange={(event) => setAddonImageFile(event.target.files?.[0] || null)} className="mt-1 w-full border px-3 py-2 rounded bg-white" /></label>
          <label className="text-sm text-gray-700">Gallery Images<input type="file" accept="image/*" multiple onChange={(event) => setGalleryImageFiles(Array.from(event.target.files || []))} className="mt-1 w-full border px-3 py-2 rounded bg-white" /></label>
        </div>
      </div>

      <div className="mt-5 border-t border-blue-200 pt-4">
        <p className="font-semibold text-gray-900 mb-3">Addon</p>
        <div className="grid md:grid-cols-2 gap-4">
          <input value={productForm.addon?.name || ''} onChange={(event) => setProductForm({ ...productForm, addon: { name: event.target.value, price: productForm.addon?.price || 0 } })} placeholder="Addon name" className="border px-3 py-2 rounded" />
          <input type="number" step="0.01" value={productForm.addon?.price || 0} onChange={(event) => setProductForm({ ...productForm, addon: { name: productForm.addon?.name || '', price: parseFloat(event.target.value) || 0 } })} placeholder="Addon price" className="border px-3 py-2 rounded" />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button onClick={handleSaveProduct} disabled={uploadingProduct} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
          {uploadingProduct ? 'Saving...' : 'Save Product'}
        </button>
        <button onClick={resetProductForm} disabled={uploadingProduct} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <div className="w-16 bg-white shadow-lg border-r border-gray-200 fixed left-0 top-0 bottom-0 flex flex-col items-center py-6">
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`p-4 rounded-lg transition-colors ${activeSection === id ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              title={title}
            >
              <Icon className="w-6 h-6" />
            </button>
          ))}
        </nav>

        <button onClick={handleLogout} className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors" title="Logout">
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 ml-16">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{sectionTitle[activeSection]}</h2>
              <p className="text-sm text-gray-600">Super Admin view: {selectedCity ? selectedCity.name : 'All cities'}</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">City Filter</label>
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}, {city.state}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-8">
          {activeSection === 'schedule' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Delivery Schedule</h2>
                <p className="text-gray-600">All city paid event dates: {paidOrders.length}</p>
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

                            return (
                              <button
                                key={dateKey}
                                onClick={() => setSelectedScheduleDate(dateKey)}
                                className={`aspect-square rounded-lg border text-sm transition-colors ${
                                  hasPaidEvents
                                    ? getScheduleColorClass(dateKey)
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
                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">{order.selectedCity || 'City'}</span>
                          </div>

                          <div className="mt-3 text-sm space-y-1">
                            <p><span className="font-semibold">Method:</span> {order.deliveryMethod || '-'}</p>
                            <p><span className="font-semibold">Address:</span> {getAddressLines(order).street}</p>
                            <p><span className="font-semibold">City/State:</span> {getAddressLines(order).secondLine || '-'}</p>
                            <p><span className="font-semibold">Distance:</span> {order.distance ? `${Number(order.distance).toFixed(2)} miles` : '-'}</p>
                            <p><span className="font-semibold">Total:</span> {formatMoney(getPricingBreakdown(order).total)}</p>
                          </div>

                          <div className="mt-3 pt-3 border-t border-white/40">
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
          )}

          {activeSection === 'requests' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Client Requests</h2>
                <p className="text-gray-600">{selectedCity ? `${selectedCity.name} requests` : 'Total requests'}: {filteredRequests.length}</p>
              </div>
              {filteredRequests.length === 0 ? <EmptyState text="No client requests" /> : (
                <div className="space-y-4">
                  {filteredRequests.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 items-center">
                        <div><p className="text-sm text-gray-500">Customer</p><p className="font-semibold text-gray-900">{item.customerName || '-'}</p></div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="text-sm text-gray-900">{getAddressLines(item).street}</p>
                          <p className="text-xs text-gray-600">{getAddressLines(item).secondLine}</p>
                        </div>
                        <div><p className="text-sm text-gray-500">Selected City</p><p className="text-sm text-gray-900">{item.selectedCity || '-'}</p></div>
                        <div><p className="text-sm text-gray-500">Event Date</p><p className="text-sm text-gray-900">{item.eventDate || '-'}</p></div>
                        <div><p className="text-sm text-gray-500">Total</p><p className="text-xl font-bold text-green-600">{formatMoney(calculateRequestTotal(item))}</p></div>
                        <div className="flex justify-end gap-2">
                          <DetailButton id={`request-${item.id}`} />
                          <button
                            onClick={() => handleDeleteRequest(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete request"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      {expandedDetailsId === `request-${item.id}` && (
                        <div className="mt-6 pt-6 border-t border-gray-200 text-sm">
                          <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                              <div className="flex items-start gap-2">
                                <User className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Customer</p>
                                  <p className="text-sm text-gray-900">{item.customerName || '-'}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Phone className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Phone</p>
                                  <p className="text-sm text-gray-900">{item.customerPhone || '-'}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Email</p>
                                  <p className="text-sm text-gray-900">{item.customerEmail || '-'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 mb-3">Event Details</h4>
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Address</p>
                                  <p className="text-sm text-gray-900">{getAddressLines(item).street}</p>
                                  <p className="text-sm text-gray-900">{getAddressLines(item).secondLine}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Event Date & Duration</p>
                                  <p className="text-sm text-gray-900">{item.eventDate || '-'}</p>
                                  <p className="text-sm text-gray-600">{item.rentalDays || 1} day{Number(item.rentalDays || 1) !== 1 ? 's' : ''} rental</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Truck className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Delivery</p>
                                  <p className="text-sm text-gray-900 capitalize">{item.deliveryMethod || '-'}</p>
                                  <p className="text-xs text-gray-600">
                                    {item.distance ? `${Number(item.distance).toFixed(2)} miles from ${item.selectedCity || '-'}` : `From ${item.selectedCity || '-'}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Submitted</p>
                                  <p className="text-sm text-gray-900">{formatDate(item.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <h4 className="font-semibold text-gray-900 mb-3">Cart Items:</h4>
                          <div className="space-y-2">
                            {(item.cart || []).map((cartItem: any, index: number) => (
                              <div key={index} className="flex justify-between items-start gap-4 p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">{cartItem.productName || '-'}</p>
                                  {cartItem.addonSelected && cartItem.addonName && (
                                    <p className="text-sm text-gray-600">+ {cartItem.addonName}</p>
                                  )}
                                  <p className="text-sm text-gray-600">Quantity: {cartItem.quantity || 0}</p>
                                </div>
                                <p className="font-semibold text-gray-900">{formatMoney(getLineItemTotal(item, cartItem))}</p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 p-4 bg-green-50 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Delivery Fee:</span>
                              <span className="font-medium text-gray-900">{formatMoney(getPricingBreakdown(item).deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Collection Fee:</span>
                              <span className="font-medium text-gray-900">{formatMoney(getPricingBreakdown(item).collectionFee)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Tax (7.25%):</span>
                              <span className="font-medium text-gray-900">{formatMoney(getPricingBreakdown(item).tax)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-green-200">
                              <span className="text-gray-900">Total:</span>
                              <span className="text-green-600">{formatMoney(getPricingBreakdown(item).total)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === 'orders' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Paid Orders</h2>
                <p className="text-gray-600">{selectedCity ? `${selectedCity.name} paid orders` : 'Total paid orders'}: {filteredOrders.length}</p>
              </div>
              {filteredOrders.length === 0 ? <EmptyState text="No paid orders" /> : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 items-center">
                        <div><p className="text-sm text-gray-500">Customer</p><p className="font-semibold text-gray-900">{order.customerName || '-'}</p></div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="text-sm text-gray-900">{getAddressLines(order).street}</p>
                          <p className="text-xs text-gray-600">{getAddressLines(order).secondLine}</p>
                        </div>
                        <div><p className="text-sm text-gray-500">Selected City</p><p className="text-sm text-gray-900">{order.selectedCity || '-'}</p></div>
                        <div><p className="text-sm text-gray-500">Event Date</p><p className="text-sm text-gray-900">{order.eventDate || '-'}</p></div>
                        <div><p className="text-sm text-gray-500">Total</p><p className="text-xl font-bold text-green-600">{formatMoney(getPricingBreakdown(order).total)}</p></div>
                        <div className="md:text-right"><DetailButton id={`order-${order.id}`} /></div>
                      </div>
                      {expandedDetailsId === `order-${order.id}` && (
                        <div className="mt-6 pt-6 border-t border-gray-200 text-sm">
                          <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                              <div className="flex items-start gap-2">
                                <User className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Customer</p>
                                  <p className="text-sm text-gray-900">{order.customerName || '-'}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Phone className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Phone</p>
                                  <p className="text-sm text-gray-900">{order.customerPhone || '-'}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Email</p>
                                  <p className="text-sm text-gray-900">{order.customerEmail || '-'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 mb-3">Event Details</h4>
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Address</p>
                                  <p className="text-sm text-gray-900">{getAddressLines(order).street}</p>
                                  <p className="text-sm text-gray-900">{getAddressLines(order).secondLine}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Event Date & Duration</p>
                                  <p className="text-sm text-gray-900">{order.eventDate || '-'}</p>
                                  <p className="text-sm text-gray-600">{order.rentalDays || 1} day{Number(order.rentalDays || 1) !== 1 ? 's' : ''} rental</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Truck className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Delivery</p>
                                  <p className="text-sm text-gray-900 capitalize">{order.deliveryMethod || '-'}</p>
                                  <p className="text-xs text-gray-600">
                                    {order.distance ? `${Number(order.distance).toFixed(2)} miles from ${order.selectedCity || '-'}` : `From ${order.selectedCity || '-'}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-gray-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Submitted</p>
                                  <p className="text-sm text-gray-900">{formatDate(order.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <h4 className="font-semibold text-gray-900 mb-3">Cart Items:</h4>
                          <div className="space-y-2">
                            {(order.cart || []).map((cartItem: any, index: number) => (
                              <div key={index} className="flex justify-between items-start gap-4 p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">{cartItem.productName || '-'}</p>
                                  {cartItem.addonSelected && cartItem.addonName && (
                                    <p className="text-sm text-gray-600">+ {cartItem.addonName}</p>
                                  )}
                                  <p className="text-sm text-gray-600">Quantity: {cartItem.quantity || 0}</p>
                                </div>
                                <p className="font-semibold text-gray-900">{formatMoney(getLineItemTotal(order, cartItem))}</p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 p-4 bg-green-50 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Delivery Fee:</span>
                              <span className="font-medium text-gray-900">{formatMoney(getPricingBreakdown(order).deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Collection Fee:</span>
                              <span className="font-medium text-gray-900">{formatMoney(getPricingBreakdown(order).collectionFee)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Tax (7.25%):</span>
                              <span className="font-medium text-gray-900">{formatMoney(getPricingBreakdown(order).tax)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-green-200">
                              <span className="text-gray-900">Total:</span>
                              <span className="text-green-600">{formatMoney(getPricingBreakdown(order).total)}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                            <p>Payment ID: {order.paymentIntentId || '-'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === 'products' && (
            <>
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Product Management</h2>
                  <p className="text-gray-600">{selectedCity ? `${selectedCity.name} products with inventory` : 'Total products'}: {filteredProducts.length}</p>
                </div>
                {!isAddingProduct && !editingProduct && (
                  <button onClick={() => setIsAddingProduct(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-5 h-5" />
                    Add Product
                  </button>
                )}
              </div>
              {(isAddingProduct || editingProduct) && ProductEditor()}
              {filteredProducts.length === 0 ? <EmptyState text="No products" /> : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => {
                    const productInventory = filteredInventory.filter((item) => item.product_id === product.id);
                    return (
                      <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {product.image_url && <img src={product.image_url} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                              <p className="text-sm text-gray-600">{product.category}</p>
                              <p className="text-xs font-semibold text-gray-500 mt-1">Show order: {product.display_order || 'Not set'}</p>
                              <p className="text-sm font-semibold text-green-600 mt-1">Default: {formatMoney(product.base_price)}</p>
                              {selectedCity && (
                                <p className="text-sm font-semibold text-blue-600 mt-1">{selectedCity.metropole_name || selectedCity.name}: {formatMoney(getProductCityPrice(product, selectedCity.id))}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <p className="font-semibold text-gray-900">Stock</p>
                            <p>{productInventory.reduce((sum, item) => sum + (item.total_quantity || 0), 0)}</p>
                            <div className="mt-3 flex gap-2">
                              <DetailButton id={`product-${product.id}`} />
                              <button onClick={() => startEditingProduct(product)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Edit product"><Edit className="w-5 h-5" /></button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete product"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </div>
                        </div>
                        {expandedDetailsId === `product-${product.id}` && (
                          <div className="mt-6 pt-6 border-t border-gray-200 grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-semibold text-gray-900 mb-2">Description</p>
                              <p className="text-gray-700 whitespace-pre-wrap">{product.description || '-'}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-2">Inventory by City</p>
                              {productInventory.length === 0 ? (
                                <p className="text-gray-700">No inventory records</p>
                              ) : productInventory.map((item) => (
                                <p key={item.id} className="text-gray-700">{item.city_name}: {item.total_quantity || 0} in stock, {formatMoney(getProductCityPrice(product, item.city_id))}</p>
                              ))}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-2">Metropole Prices</p>
                              {metropoles.map((metropole) => (
                                <p key={metropole.id} className="text-gray-700">{metropole.name}: {formatMoney(getProductMetropolePrice(product, metropole.id))}</p>
                              ))}
                            </div>
                            {product.addon?.name && (
                              <div>
                                <p className="font-semibold text-gray-900 mb-2">Addon</p>
                                <p className="text-gray-700">{product.addon.name} (+${product.addon.price?.toFixed(2) || '0.00'})</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeSection === 'inventory' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Inventory & Stock Management</h2>
                <p className="text-gray-600">{selectedCity ? `${selectedCity.name} products` : 'All city products'}: {products.length}</p>
              </div>
              {products.length === 0 ? <EmptyState text="No products" /> : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          {(selectedCity ? [selectedCity] : cities).map((city) => (
                            <th key={city.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{city.name}</th>
                          ))}
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => {
                          const citiesToShow = selectedCity ? [selectedCity] : cities;
                          const totalQuantity = citiesToShow.reduce((sum, city) => sum + getInventoryQuantity(city.id, product.id), 0);

                          return (
                            <tr key={product.id}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                <div className="flex items-center gap-3">
                                  {product.image_url && <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded object-cover" />}
                                  <div>
                                    <p className="font-semibold text-gray-900">{product.name}</p>
                                    <p className="text-xs text-gray-500">{product.category}</p>
                                  </div>
                                </div>
                              </td>
                              {citiesToShow.map((city) => (
                                <td key={city.id} className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => openStockModal(city.id, product.id)}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                  >
                                    {getInventoryQuantity(city.id, product.id)}
                                  </button>
                                </td>
                              ))}
                              <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">{totalQuantity}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {showStockModal && (() => {
                const product = products.find((item) => item.id === selectedInventoryProduct);
                const city = cities.find((item) => item.id === selectedInventoryCity);

                return (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200">
                      <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Available Quantity</h3>
                          <p className="text-sm text-gray-600 mt-1">{product?.name || 'Product'} in {city?.name || 'city'}</p>
                        </div>
                        <button onClick={() => setShowStockModal(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Close">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Current available quantity</p>
                          <p className="text-2xl font-bold text-gray-900">{getInventoryQuantity(selectedInventoryCity, selectedInventoryProduct)}</p>
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
                        <button onClick={() => setShowStockModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button onClick={handleSaveAvailableQuantity} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {activeSection === 'franchiseRequests' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Franchise Requests</h2>
                <p className="text-gray-600">{selectedCity ? `${selectedCity.name} franchise requests` : 'Total franchise requests'}: {filteredFranchiseApplications.length}</p>
              </div>
              {filteredFranchiseApplications.length === 0 ? <EmptyState text="No franchise requests" /> : (
                <div className="space-y-4">
                  {filteredFranchiseApplications.map((request) => (
                    <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="grid md:grid-cols-6 gap-4 items-center">
                        <div>
                          <p className="text-xs text-gray-500">Applicant</p>
                          <p className="font-semibold text-gray-900">{request.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Market</p>
                          <p className="text-sm text-gray-900">{request.city || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm text-gray-900">{request.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Driver License</p>
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${request.hasDriverLicense ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {request.hasDriverLicense ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">SUV</p>
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${request.hasSuv ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {request.hasSuv ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="md:text-right"><DetailButton id={`franchise-${request.id}`} /></div>
                      </div>
                      {expandedDetailsId === `franchise-${request.id}` && (
                        <div className="mt-6 pt-6 border-t border-gray-200 text-sm">
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="font-semibold text-gray-900 mb-2">Contact</p>
                              <p className="text-gray-700">Email: {request.email || '-'}</p>
                              <p className="text-gray-700">Phone: {request.phone || '-'}</p>
                              <p className="text-gray-700">Market: {request.city || '-'}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-2">Requirements</p>
                              <p className="text-gray-700">Driver license: {request.hasDriverLicense ? 'Yes' : 'No'}</p>
                              <p className="text-gray-700">SUV / vehicle: {request.hasSuv ? 'Yes' : 'No'}</p>
                              <p className="text-gray-700">Submitted: {formatDate(request.createdAt)}</p>
                            </div>
                          </div>
                          <p className="font-semibold text-gray-900 mb-2">Message</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{request.message || '-'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === 'messages' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact Messages</h2>
                <p className="text-gray-600">{selectedCity ? `${selectedCity.name} messages` : 'Total messages'}: {filteredMessages.length}</p>
              </div>
              {filteredMessages.length === 0 ? <EmptyState text="No messages" /> : (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <div key={message.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="grid md:grid-cols-5 gap-4 items-center">
                        <div><p className="text-xs text-gray-500">Sender</p><p className="font-semibold text-gray-900">{message.name}</p></div>
                        <div><p className="text-xs text-gray-500">City</p><p className="text-sm text-gray-900">{message.city || message.city_name || '-'}</p></div>
                        <div><p className="text-xs text-gray-500">Subject</p><p className="text-sm text-gray-900">{message.subject}</p></div>
                        <div><p className="text-xs text-gray-500">Date</p><p className="text-sm text-gray-900">{formatDate(message.createdAt)}</p></div>
                        <div className="md:text-right"><DetailButton id={`message-${message.id}`} /></div>
                      </div>
                      {expandedDetailsId === `message-${message.id}` && (
                        <div className="mt-6 pt-6 border-t border-gray-200 text-sm">
                          <p className="font-semibold text-gray-900 mb-2">Contact</p>
                          <div className="grid md:grid-cols-2 gap-3 mb-4">
                            <p className="text-gray-700">{message.email || '-'}</p>
                            <p className="text-gray-700">{message.phone || '-'}</p>
                          </div>
                          <p className="font-semibold text-gray-900 mb-2">Message</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === 'admins' && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Admin Management</h2>
                  <p className="text-gray-600">Total admins: {admins.length}</p>
                </div>
                {!isAddingAdmin && (
                  <button onClick={() => setIsAddingAdmin(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-5 h-5" /> Add Admin
                  </button>
                )}
              </div>
              {isAddingAdmin && (
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6 grid md:grid-cols-2 gap-3">
                  <input value={newDisplayName} onChange={(event) => setNewDisplayName(event.target.value)} placeholder="Display name" className="border px-3 py-2 rounded" />
                  <input value={newUsername} onChange={(event) => setNewUsername(event.target.value)} placeholder="Username" className="border px-3 py-2 rounded" />
                  <div className="md:col-span-2 flex gap-2">
                    <button onClick={handleCreateAdmin} className="px-4 py-2 bg-green-600 text-white rounded-lg">Create</button>
                    <button onClick={() => setIsAddingAdmin(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div key={admin.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-start gap-4">
                    {editingAdminId === admin.id ? (
                      <div className="grid md:grid-cols-2 gap-3 flex-1">
                        <input value={editingDisplayName} onChange={(event) => setEditingDisplayName(event.target.value)} className="border px-3 py-2 rounded" />
                        <input value={editingUsername} onChange={(event) => setEditingUsername(event.target.value)} className="border px-3 py-2 rounded" />
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-gray-900">{admin.displayName || admin.username}</p>
                        <p className="text-sm text-gray-600">{admin.username}</p>
                      </div>
                    )}
                    {editingAdminId === admin.id ? (
                      <button onClick={() => handleSaveAdmin(admin.id)} className="px-3 py-2 bg-green-600 text-white rounded inline-flex items-center gap-1"><Save className="w-4 h-4" /> Save</button>
                    ) : (
                      <button onClick={() => { setEditingAdminId(admin.id || null); setEditingDisplayName(admin.displayName || ''); setEditingUsername(admin.username || ''); }} className="px-3 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-1"><Edit className="w-4 h-4" /> Edit</button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'cityAdmins' && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">City Admins</h2>
                  <p className="text-gray-600">{selectedCity ? `${selectedCity.name} city admins` : 'Total city admins'}: {filteredCityAdmins.length}</p>
                </div>
                {!isAddingCityAdmin && (
                  <button onClick={() => setIsAddingCityAdmin(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5" /> Create City Admin</button>
                )}
              </div>
              {isAddingCityAdmin && (
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6 grid md:grid-cols-2 gap-3">
                  {['name', 'phone', 'email', 'address', 'username', 'password'].map((field) => (
                    <input key={field} value={cityAdminForm[field] || ''} type={field === 'password' ? 'password' : 'text'} onChange={(event) => setCityAdminForm({ ...cityAdminForm, [field]: event.target.value })} placeholder={field} className="border px-3 py-2 rounded" />
                  ))}
                  <select value={cityAdminForm.city_id} onChange={(event) => setCityAdminForm({ ...cityAdminForm, city_id: event.target.value })} className="border px-3 py-2 rounded">
                    <option value="">Select city</option>
                    {cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.state}</option>)}
                  </select>
                  <select value={cityAdminForm.status} onChange={(event) => setCityAdminForm({ ...cityAdminForm, status: event.target.value })} className="border px-3 py-2 rounded">
                    <option value="on wait for approval">on wait for approval</option>
                    <option value="active">active</option>
                    <option value="unactive">unactive</option>
                    <option value="suspended">suspended</option>
                  </select>
                  <div className="md:col-span-2 flex gap-2">
                    <button onClick={handleCreateCityAdmin} className="px-4 py-2 bg-green-600 text-white rounded-lg">Save City Admin</button>
                    <button onClick={() => setIsAddingCityAdmin(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {filteredCityAdmins.map((admin) => (
                  <div key={admin.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-start gap-4">
                    {editingCityAdminId === admin.id ? (
                      <div className="grid md:grid-cols-2 gap-3 flex-1">
                        {['name', 'phone', 'email', 'address', 'username', 'password'].map((field) => (
                          <input key={field} value={editingCityAdmin?.[field] || ''} type={field === 'password' ? 'password' : 'text'} onChange={(event) => setEditingCityAdmin({ ...editingCityAdmin, [field]: event.target.value })} className="border px-3 py-2 rounded" />
                        ))}
                        <select value={editingCityAdmin?.city_id || ''} onChange={(event) => setEditingCityAdmin({ ...editingCityAdmin, city_id: event.target.value })} className="border px-3 py-2 rounded">
                          <option value="">Unassigned</option>
                          {cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.state}</option>)}
                        </select>
                        <select value={editingCityAdmin?.status || 'on wait for approval'} onChange={(event) => setEditingCityAdmin({ ...editingCityAdmin, status: event.target.value })} className="border px-3 py-2 rounded">
                          <option value="on wait for approval">on wait for approval</option>
                          <option value="active">active</option>
                          <option value="unactive">unactive</option>
                          <option value="suspended">suspended</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-gray-900">{admin.name}</p>
                        <p className="text-sm text-gray-600">{admin.username} - {admin.phone}</p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                        <p className="text-sm text-gray-500">City: {cities.find((city) => city.id === admin.city_id)?.name || '-'}</p>
                        <p className="text-xs text-gray-500 mt-1">Status: {admin.status}</p>
                      </div>
                    )}
                    {editingCityAdminId === admin.id ? (
                      <button onClick={() => handleSaveCityAdmin(editingCityAdmin)} className="px-3 py-2 bg-green-600 text-white rounded inline-flex items-center gap-1"><Save className="w-4 h-4" /> Save</button>
                    ) : (
                      <button onClick={() => { setEditingCityAdminId(admin.id); setEditingCityAdmin({ ...admin }); }} className="px-3 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-1"><Edit className="w-4 h-4" /> Edit</button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'metropoles' && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Metropole Management</h2>
                  <p className="text-gray-600">Total metropoles: {metropoles.length}</p>
                </div>
                {!isAddingMetropole && (
                  <button onClick={() => setIsAddingMetropole(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5" /> Add Metropole</button>
                )}
              </div>
              {isAddingMetropole && (
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6 grid md:grid-cols-2 gap-3">
                  <input value={newMetropole.name} onChange={(event) => setNewMetropole({ ...newMetropole, name: event.target.value })} placeholder="Metropole name, e.g. Mecklenburg" className="border px-3 py-2 rounded" />
                  <input value={newMetropole.state} onChange={(event) => setNewMetropole({ ...newMetropole, state: event.target.value })} placeholder="State, e.g. NC" className="border px-3 py-2 rounded" />
                  <div className="md:col-span-2 flex gap-2">
                    <button onClick={handleCreateMetropole} className="px-4 py-2 bg-green-600 text-white rounded-lg">Save</button>
                    <button onClick={() => setIsAddingMetropole(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {metropoles.map((metropole) => (
                  <div key={metropole.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {editingMetropoleId === metropole.id ? (
                      <div className="grid md:grid-cols-2 gap-3">
                        <input value={editingMetropole?.name || ''} onChange={(event) => setEditingMetropole({ ...editingMetropole, name: event.target.value })} className="border px-3 py-2 rounded" />
                        <input value={editingMetropole?.state || ''} onChange={(event) => setEditingMetropole({ ...editingMetropole, state: event.target.value })} className="border px-3 py-2 rounded" />
                        <div className="md:col-span-2 flex gap-2">
                          <button onClick={() => handleSaveMetropole(editingMetropole)} className="px-4 py-2 bg-green-600 text-white rounded-lg">Save</button>
                          <button onClick={() => { setEditingMetropoleId(null); setEditingMetropole(null); }} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{metropole.name}{metropole.state ? `, ${metropole.state}` : ''}</h3>
                          <p className="text-sm text-gray-600">{cities.filter((city) => city.metropole_id === metropole.id).length} cities assigned</p>
                        </div>
                        <button onClick={() => { setEditingMetropoleId(metropole.id); setEditingMetropole({ ...metropole }); }} className="px-3 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-1"><Edit className="w-4 h-4" /> Edit</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'cities' && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">City Management</h2>
                  <p className="text-gray-600">Total cities: {cities.length}</p>
                </div>
                {!isAddingCity && (
                  <button onClick={() => setIsAddingCity(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5" /> Add New City</button>
                )}
              </div>
              {isAddingCity && (
                <CityForm city={newCity} setCity={setNewCity} metropoles={metropoles} onSave={handleCreateCity} onCancel={() => setIsAddingCity(false)} />
              )}
              <div className="space-y-4">
                {cities.map((city) => (
                  <div key={city.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {editingCityId === city.id ? (
                      <CityForm city={editingCity} setCity={setEditingCity} metropoles={metropoles} onSave={() => handleSaveCity(editingCity)} onCancel={() => { setEditingCityId(null); setEditingCity(null); }} />
                    ) : (
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{city.name}, {city.state}</h3>
                          <p className="text-sm text-gray-700 mt-1">Metropole: {city.metropole_name || metropoles.find((item) => item.id === city.metropole_id)?.name || '-'}</p>
                          <p className="text-sm text-gray-600 mt-1">{city.pickup_address}</p>
                          <p className="text-xs text-gray-500 mt-2">Coordinates: {city.latitude}, {city.longitude}</p>
                          <p className="text-xs text-gray-500">Pickup available: {String(city.pickup_available !== false)}</p>
                        </div>
                        <button onClick={() => { setEditingCityId(city.id); setEditingCity({ ...city }); }} className="px-3 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-1"><Edit className="w-4 h-4" /> Edit</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'sellers' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Sellers</h2>
                <p className="text-gray-600">{selectedCity ? `${selectedCity.name} sellers` : 'Total sellers'}: {filteredSellers.length}</p>
              </div>
              {filteredSellers.length === 0 ? <EmptyState text="No sellers" /> : (
                <div className="space-y-4">
                  {filteredSellers.map((seller) => (
                    <div key={seller.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{seller.name} <span className="text-xs text-gray-500">({seller.seller_id})</span></p>
                        <p className="text-sm text-gray-600">{seller.address}</p>
                        <p className="text-sm text-gray-500">City: {cities.find((city) => city.id === seller.city_id)?.name || '-'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${seller.status === 'activated' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{seller.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CityForm({ city, setCity, metropoles, onSave, onCancel }: { city: any; setCity: (city: any) => void; metropoles: any[]; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
      <div className="grid md:grid-cols-2 gap-4">
        <input value={city?.name || ''} onChange={(event) => setCity({ ...city, name: event.target.value })} placeholder="City name" className="border px-3 py-2 rounded" />
        <input value={city?.state || ''} onChange={(event) => setCity({ ...city, state: event.target.value })} placeholder="State" className="border px-3 py-2 rounded" />
        <select value={city?.metropole_id || ''} onChange={(event) => {
          const metropole = metropoles.find((item) => item.id === event.target.value);
          setCity({ ...city, metropole_id: event.target.value, metropole_name: metropole?.name || '' });
        }} className="border px-3 py-2 rounded md:col-span-2">
          <option value="">Select metropole</option>
          {metropoles.map((metropole) => (
            <option key={metropole.id} value={metropole.id}>{metropole.name}{metropole.state ? `, ${metropole.state}` : ''}</option>
          ))}
        </select>
        <input value={city?.pickup_address || ''} onChange={(event) => setCity({ ...city, pickup_address: event.target.value })} placeholder="Pickup address" className="border px-3 py-2 rounded md:col-span-2" />
        <input value={city?.latitude ?? ''} onChange={(event) => setCity({ ...city, latitude: event.target.value })} placeholder="Latitude" className="border px-3 py-2 rounded" />
        <input value={city?.longitude ?? ''} onChange={(event) => setCity({ ...city, longitude: event.target.value })} placeholder="Longitude" className="border px-3 py-2 rounded" />
        <input type="number" value={city?.advance_days ?? 0} onChange={(event) => setCity({ ...city, advance_days: Number(event.target.value) })} placeholder="Advance days" className="border px-3 py-2 rounded" />
        <select value={String(city?.pickup_available ?? true)} onChange={(event) => setCity({ ...city, pickup_available: event.target.value === 'true' })} className="border px-3 py-2 rounded">
          <option value="true">Pickup available</option>
          <option value="false">Pickup unavailable</option>
        </select>
        <select value={String(city?.showable ?? true)} onChange={(event) => setCity({ ...city, showable: event.target.value === 'true' })} className="border px-3 py-2 rounded">
          <option value="true">Showable</option>
          <option value="false">Hidden</option>
        </select>
        <input type="number" value={city?.delivery_rates?.under_4_miles ?? 0} onChange={(event) => setCity({ ...city, delivery_rates: { ...(city.delivery_rates || {}), under_4_miles: Number(event.target.value) } })} placeholder="Rate under 4 miles" className="border px-3 py-2 rounded" />
        <input type="number" value={city?.delivery_rates?.from_5_to_10_miles ?? 0} onChange={(event) => setCity({ ...city, delivery_rates: { ...(city.delivery_rates || {}), from_5_to_10_miles: Number(event.target.value) } })} placeholder="Rate 5-10 miles" className="border px-3 py-2 rounded" />
        <input type="number" value={city?.delivery_rates?.from_11_to_30_miles ?? 0} onChange={(event) => setCity({ ...city, delivery_rates: { ...(city.delivery_rates || {}), from_11_to_30_miles: Number(event.target.value) } })} placeholder="Rate 11-30 miles" className="border px-3 py-2 rounded" />
        <textarea value={city?.notes || ''} onChange={(event) => setCity({ ...city, notes: event.target.value })} placeholder="Notes" className="border px-3 py-2 rounded md:col-span-2" />
        <div className="md:col-span-2 flex gap-2">
          <button onClick={onSave} className="px-4 py-2 bg-green-600 text-white rounded-lg">Save</button>
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  );
}
