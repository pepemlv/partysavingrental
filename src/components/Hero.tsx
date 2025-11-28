import { DollarSign, MapPin, Package, Users } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white min-h-[80vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 leading-tight">
            Party Saving Rental
          </h1>
          <p className="text-xl sm:text-2xl text-green-100 mb-3">
            Folding chairs and tables for your small party.
          </p>
          <p className="text-2xl sm:text-3xl font-semibold text-white">
            Everybody deserves a party!
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
