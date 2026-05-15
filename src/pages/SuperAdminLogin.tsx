import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { db } from '../lib/firebase.ts';
import { doc, getDoc } from 'firebase/firestore';

export default function SuperAdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Read the super admin document from Firestore
      const docRef = doc(db, 'superdaminlogin', 'WLVYMqxxvFFBYYPSvbCr');
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        setError('Super admin record not found');
        return;
      }
      const data = snap.data() as any;
      if (username === (data.username || '') && password === (data.password || '')) {
        localStorage.setItem('isSuperAdminAuthenticated', 'true');
        navigate('/admin/super');
      } else {
        setError('Invalid super admin credentials');
      }
    } catch (err) {
      console.error('Super admin login error', err);
      setError('Login error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Login</h1>
          <p className="text-gray-600 mt-2">Access the Super Admin dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="superadmin"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg">Login</button>
        </form>
      </div>
    </div>
  );
}
