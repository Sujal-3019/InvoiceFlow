import { forwardRef } from 'react';
import React from "react";

const Textarea = forwardRef(({ 
  label, 
  error, 
  hint, 
  className = '', 
  containerClassName = '',
  required = false,
  rows = 4,
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
      
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-4 py-3 bg-white dark:bg-dark-card 
          border border-gray-200 dark:border-gray-700 rounded-xl
          text-gray-900 dark:text-gray-100
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 resize-none
          ${error ? 'border-danger focus:ring-danger' : ''}
          ${className}
        `}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
      
      {hint && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;