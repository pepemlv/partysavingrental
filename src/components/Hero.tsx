import { useState, useEffect } from 'react';
import { DollarSign, MapPin, Package, Users } from 'lucide-react';

// Import hero images
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
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/30 hover:bg-white/30 hover:shadow-md transition-all h-full">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-800">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-gray-900 text-white min-h-[70vh] flex items-center overflow-hidden">
      {/* Background image carousel */}
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 leading-tight" style={{ textShadow: '3px 3px 0 #16a34a, 5px 5px 0 #15803d' }}>
            Party Saving Rental
          </h1>
          <p className="text-xl sm:text-2xl text-white mb-3" style={{ textShadow: '2px 2px 0 #16a34a' }}>
            Folding chairs and tables for your small party.
          </p>
          <p className="text-2xl sm:text-3xl font-semibold text-white" style={{ textShadow: '2px 2px 0 #16a34a' }}>
            Everybody deserves a party!
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon={<DollarSign className="w-6 h-6 text-white" />}
            title="Affordable Pricing"
            description="From just $35 - rent 1 table or 5 chairs"
          />
          <FeatureCard
            icon={<MapPin className="w-6 h-6 text-white" />}
            title="5 Locations"
            description="Charlotte, Raleigh, Columbia, Atlanta, Miami"
          />
          <FeatureCard
            icon={<Package className="w-6 h-6 text-white" />}
            title="Pickup or Delivery"
            description="Save money with pickup or get fast delivery"
          />
          <FeatureCard
            icon={<Users className="w-6 h-6 text-white" />}
            title="Perfect for Small Parties"
            description="Ideal for backyard party, birthday, Meeting"
          />
        </div>
      </div>
    </div>
  );
}
