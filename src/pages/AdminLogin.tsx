import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { db } from '../lib/firebase.ts';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const cityAdminRef = collection(db, 'cityadministrator');
      const adminQuery = query(cityAdminRef, where('username', '==', username));
      const adminSnap = await getDocs(adminQuery);
      if (!adminSnap.empty) {
        const docSnap = adminSnap.docs[0];
        const data = docSnap.data() as any;
        if (data.password === password) {
          if (data.status === 'active') {
            localStorage.removeItem('isAdminAuthenticated');
            localStorage.removeItem('sellerSession');
            localStorage.setItem('cityAdminSession', JSON.stringify({ id: docSnap.id, ...data }));
            navigate('/admin/dashboard');
            return;
          } else {
            setError('City admin account is not active');
            return;
          }
        } else {
          setError('Invalid username or password');
          return;
        }
      }
      setError('Invalid username or password');
    } catch (err) {
      console.error('Login error (cityadministrator)', err);
      setError('Login error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 mt-2">Access the admin dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Enter username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Need Super Admin access?</p>
          <button onClick={() => navigate('/admin/super-login')} className="mt-2 text-sm text-indigo-600 hover:underline">Super Admin Login</button>
        </div>
      </div>
    </div>
  );
}
