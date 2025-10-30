import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Categories', href: '/categories', icon: '📁' },
    { name: 'Authors', href: '/authors', icon: '👨‍🎨' },
    { name: 'Products', href: '/products', icon: '🖼️' },
    { name: 'Orders', href: '/orders', icon: '📦' },
    { name: 'Coupons', href: '/coupons', icon: '🎫' },
    { name: 'Users', href: '/users', icon: '👥' },
    { name: 'Subscribers', href: '/subscribers', icon: '🔔' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 text-white transition-all duration-300`}>
        <div className="!p-4">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold">MERN Art Admin</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="!p-2 rounded-md hover:bg-gray-700 cursor-pointer"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>
        </div>

        <nav className="!mt-8">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center !px-4 !py-3 text-left transition duration-200 cursor-pointer ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-lg !mr-3">{item.icon}</span>
              {sidebarOpen && <span>{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between !px-6 !py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center !space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white !px-4 !py-2 rounded-lg hover:bg-red-700 transition duration-200 text-sm cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto !p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;