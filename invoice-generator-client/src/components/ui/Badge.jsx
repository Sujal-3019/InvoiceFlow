import { FiCheck, FiAlertCircle, FiXCircle, FiClock, FiMinus } from 'react-icons/fi';
import React from "react";

const Badge = ({ children, variant = 'neutral', size = 'md', icon, className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center gap-1 rounded-full font-medium';
  
  const variants = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };
  
  const icons = {
    success: <FiCheck size={12} />,
    warning: <FiAlertCircle size={12} />,
    danger: <FiXCircle size={12} />,
    pending: <FiClock size={12} />,
    neutral: <FiMinus size={12} />,
  };
  
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <span className={classes} {...props}>
      {icon || icons[variant]}
      {children}
    </span>
  );
};

export default Badge;