import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import React from 'react';
import {
  FiGrid,
  FiFileText,
  FiPlusCircle,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiUser,
  FiLogOut,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
    { to: '/invoices/create', icon: FiPlusCircle, label: 'Create Invoice' },
    { to: '/invoices', icon: FiFileText, label: 'Invoice History' },
    { to: '/clients', icon: FiUsers, label: 'Clients' },
    { to: '/products', icon: FiUsers, label: 'Products' },
    { to: '/reports', icon: FiBarChart2, label: 'Reports' },
    { to: '/profile', icon: FiUser, label: 'Profile' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ 
          // बड़ी स्क्रीन पर हमेशा दिखेगा, मोबाइल पर isOpen के आधार पर तय होगा
          x: window.innerWidth >= 1024 ? 0 : (isOpen ? 0 : '-100%') 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 z-40 h-full w-64 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-800"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
            <NavLink
              to={user ? '/dashboard' : '/'}
              className="flex items-center gap-2"
              onClick={onClose}
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FiFileText className="text-white" size={18} />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                InvoiceFlow
              </span>
            </NavLink>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/invoices'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  }`
                }
                onClick={onClose}
              >
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-200"
            >
              <FiLogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
