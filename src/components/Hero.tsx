import { useState, useEffect } from 'react';
import { DollarSign, MapPin, Package, Users, Phone, Calendar, Briefcase, Send, X } from 'lucide-react';
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ScheduleCallbackModal from './ScheduleCallbackModal';

// Import hero backgrounds
import coveredchair1 from '../images/heros/coveredchair1.jpg';
import partysavphoto from '../images/heros/partysavphoto.webp';
import parysavingphoto from '../images/heros/parysavingphoto.webp';
import patysavingphoto from '../images/heros/patysavingphoto.webp';

const heroImages = [
  coveredchair1,
  partysavphoto,
  parysavingphoto,
  patysavingphoto,
];

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white hover:shadow-lg transition-all h-full">
      <div className="flex flex-col sm:flex-row items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-text-gray mb-1">{title}</h3>
          <p className="text-xs sm:text-sm text-text-gray">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FranchiseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    hasDriverLicense: false,
    hasSuv: false,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  const updateForm = (field: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.hasDriverLicense || !form.hasSuv) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'franchiseapplications'), {
        ...form,
        status: 'new',
        createdAt: serverTimestamp(),
      });

      setSubmitSuccess(true);
      setForm({
        name: '',
        email: '',
        phone: '',
        city: '',
        hasDriverLicense: false,
        hasSuv: false,
        message: '',
      });
    } catch (error) {
      console.error('Error saving franchise application:', error);
      alert('There was an error sending your franchise request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Join Our Rental Partner Network</h2>
            <p className="text-sm text-gray-600 mt-1">Start your own local rental business with our support.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close franchise form">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 p-5">
          <div className="space-y-4">
            <div className="bg-green-900 text-white rounded-xl p-5">
              <h3 className="text-lg font-bold mb-2">How it works</h3>
              <p className="text-sm text-green-50">
                Already have rental equipment? Great, we help you get more customers through our platform. No equipment yet? No problem. If approved, we provide a startup package that can be stored in your garage so you can serve customers within 50 miles of your area.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">As a rental partner, you receive</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>Access to our online booking platform</li>
                <li>Marketing and customer leads</li>
                <li>Business support and guidance</li>
                <li>Flexible schedule and local opportunities</li>
                <li>Potential earnings of up to $1,000+ per week</li>
              </ul>
              <p className="text-sm font-semibold text-gray-900 mt-3">Build flexible income while serving your local community.</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Starter kit included</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>50 folding chairs</li>
                <li>50 chair cloths</li>
                <li>1 Cobizi 10x20 pop-up tent</li>
                <li>6 tables</li>
                <li>1 month of ads and Google Search support</li>
                <li>Dashboard credentials to manage orders, requests, and stock</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-1">Simple and flexible</p>
              <p>
                Equipment provided after the deposit belongs to the franchise partner. You can cancel after 6 months and sell the equipment, helping reduce your risk.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Requirements</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>Driver license</li>
                <li>SUV or vehicle for transportation and delivery requests</li>
                <li>Garage or storage space for the equipment</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
            {submitSuccess ? (
              <div className="text-center py-12">
                <div className="text-green-600 text-5xl mb-4">✓</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent</h3>
                <p className="text-gray-600">We received your franchise request and will contact you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input type="tel" value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City / Market *</label>
                  <input value={form.city} onChange={(event) => updateForm('city', event.target.value)} required placeholder="Where do you want to operate?" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input type="checkbox" checked={form.hasDriverLicense} onChange={(event) => updateForm('hasDriverLicense', event.target.checked)} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                  I have a driver license
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input type="checkbox" checked={form.hasSuv} onChange={(event) => updateForm('hasSuv', event.target.checked)} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                  I have an SUV or vehicle for deliveries
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea value={form.message} onChange={(event) => updateForm('message', event.target.value)} rows={4} placeholder="Tell us about your area and availability" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <button type="submit" disabled={isSubmitting || !form.hasDriverLicense || !form.hasSuv} className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'Sending...' : form.hasDriverLicense && form.hasSuv ? 'Send Franchise Request' : 'Check license and SUV to send'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showFranchiseModal, setShowFranchiseModal] = useState(false);
  const [serviceCities, setServiceCities] = useState<Array<{ id: string; name: string; state: string }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const cityQuery = query(collection(db, 'cities'), orderBy('name'));
        const citySnapshot = await getDocs(cityQuery);
        const cityData: Array<{ id: string; name: string; state: string }> = [];

        citySnapshot.forEach((cityDoc) => {
          const data = cityDoc.data();
          if (data.showable === false) return;
          cityData.push({
            id: cityDoc.id,
            name: data.name || '',
            state: data.state || '',
          });
        });

        setServiceCities(cityData.filter((city) => city.name));
      } catch (error) {
        console.error('Error loading hero cities:', error);
      }
    };

    loadCities();
  }, []);

  const cityNames = serviceCities.map((city) => city.name).join(', ');
  const locationTitle = `${serviceCities.length || 5} Locations`;
  const locationDescription = cityNames || 'Charlotte, Raleigh, Columbia, Atlanta, Miami';

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact-us');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-gray-900 text-white overflow-hidden h-[75vh]">
      {/* Background Image Carousel */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Hero ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Top Section - Text */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-2 leading-tight" style={{ textShadow: '3px 3px 0 #16a34a, 5px 5px 0 #15803d' }}>
            Party Saver Rentals
          </h1>
          <p className="text-lg sm:text-2xl text-white mb-2" style={{ textShadow: '2px 2px 0 #333333' }}>
            The # 1 choice for affordable party rentals.
          </p>
          
          <p className="text-xl sm:text-3xl font-semibold text-white mb-4" style={{ textShadow: '2px 2px 0 #16a34a' }}>
            Folding chairs, tables and tents for your small party
          </p>
          
         
          
          {/* Contact Info and Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <a 
              href="tel:7048311314"
              className="flex items-center justify-center gap-2 bg-white text-green-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-lg"
            >
              <Phone className="w-5 h-5" />
              <span>(704) 831-1314</span>
            </a>
            <a
              href="/contact-us"
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg"
            >
              <Calendar className="w-5 h-5" />
              Schedule Call Back
            </a>
            <button
              onClick={scrollToContact}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg"
            >
              Send us a message
            </button>
            <button
              onClick={() => setShowFranchiseModal(true)}
              className="flex items-center justify-center gap-2 bg-white text-green-800 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-lg"
            >
              <Briefcase className="w-5 h-5" />
              Get a Franchise
            </button>
          </div>

          
          <p className="text-sm text-white" style={{ textShadow: '1px 1px 0 #16a34a' }}>
            Open Sunday to Monday • 8:00 AM - 6:00 PM
          </p>
            <p className="text-lg sm:text-xl font-semibold text-white mb-4" style={{ textShadow: '2px 2px 0 #16a34a' }}>
            Good Vibes Shouldn't Cost a Fortune! 🎉
          </p>
        </div>
 
        {/* Bottom Section: Feature Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <FeatureCard
            icon={<DollarSign className="w-6 h-6 text-white" />}
            title="Affordable Pricing"
            description="From just $35 - rent 2 table or 16 chairs"
          />
          <FeatureCard
            icon={<MapPin className="w-6 h-6 text-white" />}
            title={locationTitle}
            description={locationDescription}
          />
          <FeatureCard
            icon={<Package className="w-6 h-6 text-white" />}
            title="Pickup or Delivery"
            description="Save money with free pickup (some Areas) or get fast delivery"
          />
          <FeatureCard
            icon={<Users className="w-6 h-6 text-white" />}
            title="Get a Franchise"
            description="Join with a startup kit and rent equipment near your community"

          />
        </div>

        <div className="max-w-4xl mx-auto mt-4 rounded-xl bg-green-900/90 border border-green-500/60 p-4 shadow-xl text-center">
          <p className="text-base sm:text-lg font-bold text-white mb-1">
            Join Our Rental Partner Network
          </p>
          <p className="text-xs sm:text-sm text-green-50 mb-3">
            Start your own local rental business with our support. Already have equipment? We help you get customers. No equipment yet? We provide a garage-friendly startup package so you can serve events within 50 miles. Get booking tools, marketing leads, support, flexible local opportunities, and potential earnings up to $1,000+ per week.
          </p>
          <button
            onClick={() => setShowFranchiseModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-white text-green-800 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-lg"
          >
            <Briefcase className="w-5 h-5" />
            Get Started Today
          </button>
        </div>
      
      </div>
      
      <ScheduleCallbackModal 
        isOpen={showCallbackModal} 
        onClose={() => setShowCallbackModal(false)} 
      />
      <FranchiseModal
        isOpen={showFranchiseModal}
        onClose={() => setShowFranchiseModal(false)}
      />
    </div>
  );
}
