import ContactForm from '../components/ContactForm';
import Footer from '../components/Footer';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-green-600">
              Party Saver Rentals
            </a>
            <a
              href="/"
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-green-50">
            We're here to help make your event perfect!
          </p>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-600">Sunday to Monday • 8:00 AM - 6:00 PM</p>
            <a
              href="tel:7048311314"
              className="text-green-600 font-semibold mt-2 inline-block hover:text-green-700"
            >
              (704) 831-1314
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600">Send us your questions</p>
            <a
              href="mailto:partysavingrentals@gmail.com"
              className="text-green-600 font-semibold mt-2 inline-block hover:text-green-700 block"
            >
              partysavingrentals@gmail.com
            </a>
            <a
              href="mailto:admin@partysaverrentals.com"
              className="text-green-600 font-semibold mt-1 inline-block hover:text-green-700 block"
            >
              admin@partysaverrentals.com
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Headquarters</h3>
            <p className="text-gray-600 text-sm">
              3244 Bamburgh Court<br />
              Charlotte, NC
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Areas</h3>
            <p className="text-gray-600 text-sm">Charlotte, Raleigh, Columbia, Atlanta, Miami</p>
            <p className="text-green-600 font-semibold mt-2 text-sm">
              Delivery & Pickup Available
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <ContactForm />

      {/* Why Choose Us Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Party Saver Rentals?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="text-green-600 text-xl font-bold">✓</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Affordable Pricing</h3>
                <p className="text-gray-600">Starting at just $35</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-600 text-xl font-bold">✓</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Quality Equipment</h3>
                <p className="text-gray-600">Premium folding chairs and tables</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-600 text-xl font-bold">✓</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Flexible Options</h3>
                <p className="text-gray-600">Pickup or delivery available</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-600 text-xl font-bold">✓</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Perfect for Small Parties</h3>
                <p className="text-gray-600">Ideal for intimate events</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-600 text-xl font-bold">✓</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Wide Service Area</h3>
                <p className="text-gray-600">Serving 5 major cities</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-600 text-xl font-bold">✓</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Reliable Service</h3>
                <p className="text-gray-600">Trusted by hundreds of customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
