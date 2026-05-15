import { Link } from 'react-router-dom';
import { Shield, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold text-green-500 mb-4">Party Saver Rentals</h3>
            <p className="text-gray-400 text-sm mb-4">
              Affordable folding chairs and tables for your small party. Quality rentals at unbeatable prices.
            </p>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Shield className="w-4 h-4" />
              <Link to="/admin" className="hover:text-white transition-colors">
                Admin Portal
              </Link>
            </div>
            <div className="mt-2">
              <Link to="/admin/super-login" className="inline-block mt-1 text-xs text-indigo-300 hover:text-indigo-100">
                Super Admin Login
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <a href="tel:7048311314" className="text-gray-400 hover:text-white transition-colors block">
                    (704) 831-1314
                  </a>
                  <p className="text-xs text-gray-500">Sunday - Monday • 8AM - 6PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <a href="mailto:partysavingrentals@gmail.com" className="text-gray-400 hover:text-white transition-colors block text-sm">
                    partysavingrentals@gmail.com
                  </a>
                  <a href="mailto:admin@partysaverrentals.com" className="text-gray-400 hover:text-white transition-colors block text-sm">
                    admin@partysaverrentals.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Headquarters</h3>
            <div className="flex items-start gap-2 mb-4">
              <MapPin className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-gray-400 text-sm">
                <p>3244 Bamburgh Court</p>
                <p>Charlotte, NC  28216</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Service Areas</h3>
            <div className="text-gray-400 text-sm space-y-1">
              <p>Charlotte, NC</p>
              <p>Raleigh, NC</p>
              <p>Columbia, SC</p>
              <p>Atlanta, GA</p>
              <p>Miami, FL</p>
            </div>
            <Link 
              to="/contact-us"
              className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6">
          <p className="text-gray-400 text-sm text-center">
            © {new Date().getFullYear()} Party Saver Rentals. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
