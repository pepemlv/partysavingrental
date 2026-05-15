import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import AdminLogin from './pages/AdminLogin.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import SuperAdminLogin from './pages/SuperAdminLogin.tsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.tsx';
import ContactPage from './pages/ContactPage.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/contact-us" element={<ContactPage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/super-login" element={<SuperAdminLogin />} />
        <Route path="/admin/super" element={<SuperAdminDashboard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
