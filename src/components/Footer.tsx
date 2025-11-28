import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Party Saving Rental. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <Link
              to="/admin"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
