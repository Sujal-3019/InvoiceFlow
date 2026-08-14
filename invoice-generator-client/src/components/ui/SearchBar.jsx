import { forwardRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import React from "react";

const SearchBar = forwardRef(({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  className = '', 
  containerClassName = '',
  clearable = true,
  ...props 
}, ref) => {
  return (
    <div className={`relative ${containerClassName}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        <FiSearch size={18} />
      </div>
      
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full pl-10 pr-10 py-2.5 bg-white dark:bg-dark-card 
          border border-gray-200 dark:border-gray-700 rounded-xl
          text-gray-900 dark:text-gray-100
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
      
      {clearable && value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <FiX size={16} />
        </button>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;