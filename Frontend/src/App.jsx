import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/others/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import VerifyOtp from './pages/auth/VerifyOtp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/Profile';
import Store from './pages/Store';
import Cart from './pages/Cart';
import { CartProvider } from './context/CartContext';
import ProductDetail from './pages/ProductDetail';
import Header from './components/Header/Header';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import VirtualGallery from './pages/VirtualGallery';
import Authors from './pages/author/Authors';
import AuthorDetail from './pages/author/AuthorDetail';
import Orders from './pages/Orders';
import { PaymentProvider } from './context/PaymentContext';
import OrderSuccess from './pages/ordersStatus/OrderSuccess';
import PaymentFailed from './pages/ordersStatus/PaymentFailed';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <PaymentProvider>
            <Header />
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/store" element={<Store />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/virtual-gallery" element={<VirtualGallery />} />
                <Route path="/artists" element={<Authors />} /> {/* <-- Add Authors Route */}
                <Route path="/artist/:authorId" element={<AuthorDetail />} /> {/* <-- Add Author Detail Route */}

                {/* Protected Routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-success"
                  element={
                    <ProtectedRoute>
                      <OrderSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-failed"
                  element={
                    <ProtectedRoute>
                      <PaymentFailed />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </PaymentProvider>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;