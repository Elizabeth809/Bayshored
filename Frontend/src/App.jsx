import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
// import ProtectedRoute from './components/others/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Register from './pages/auth/Register';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import VerifyOtp from './pages/VerifyOtp';
// import ForgotPassword from './pages/ForgotPassword';
// import ResetPassword from './pages/ResetPassword';
// import Profile from './pages/Profile';
// import Store from './pages/Store';
// import Cart from './pages/Cart';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            {/* <Route path="/login" element={<Login />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/store" element={<Store />} />
            <Route path="/cart" element={<Cart />} /> */}

            {/* Protected Routes */}
            {/* <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            /> */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;