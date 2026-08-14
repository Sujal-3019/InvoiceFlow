import { forwardRef } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import React from "react";

const Select = forwardRef(({ 
  label, 
  error, 
  hint, 
  options = [], 
  placeholder = 'Select an option',
  className = '', 
  containerClassName = '',
  required = false,
  leftIcon,
  ...props 
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full px-4 py-3 bg-white dark:bg-dark-card 
            border border-gray-200 dark:border-gray-700 rounded-xl
            text-gray-900 dark:text-gray-100
            appearance-none cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? 'border-danger focus:ring-danger' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <FiChevronDown size={18} />
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
      
      {hint && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;