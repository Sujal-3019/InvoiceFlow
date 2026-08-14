import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import React from "react";

const Dropdown = ({ 
  trigger, 
  children, 
  align = 'left', 
  width = 'auto',
  className = '',
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const widths = {
    auto: 'w-auto',
    sm: 'w-48',
    md: 'w-56',
    lg: 'w-64',
    full: 'w-full',
  };
  
  const alignments = {
    left: 'left-0',
    right: 'right-0',
  };
  
  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`} {...props}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 mt-2 ${alignments[align]} ${widths[width]} rounded-xl bg-white dark:bg-dark-card shadow-large border border-gray-100 dark:border-gray-800 py-2`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DropdownItem = ({ children, icon, onClick, className = '', disabled = false, ...props }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300
        hover:bg-gray-50 dark:hover:bg-gray-800
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-3 transition-colors
        ${className}
      `}
      {...props}
    >
      {icon && <span className="text-gray-400">{icon}</span>}
      {children}
    </button>
  );
};

const DropdownDivider = ({ className = '', ...props }) => {
  return (
    <div className={`my-2 border-t border-gray-100 dark:border-gray-800 ${className}`} {...props} />
  );
};

const DropdownHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className}`} {...props}>
      {children}
    </div>
  );
};

Dropdown.Item = DropdownItem;
Dropdown.Divider = DropdownDivider;
Dropdown.Header = DropdownHeader;

export default Dropdown;