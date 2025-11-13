import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import MainLayout from './layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Authors from './pages/Authors';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Coupons from './pages/Coupons';
import UserManagement from './pages/UserManagement';
import Subscribers from './pages/Subscribers';
import PriceInquiries from './pages/PriceInquiries';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Admin Routes */}
          <Route path="/" element={
            <ProtectedAdminRoute>
              <MainLayout />
            </ProtectedAdminRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="authors" element={<Authors />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="subscribers" element={<Subscribers/>} />
            <Route path="price-inquiries" element={<PriceInquiries/>} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;