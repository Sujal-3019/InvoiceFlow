import { FiUser } from 'react-icons/fi';
import React from "react";

const Avatar = ({ src, alt = '', name = '', size = 'md', className = '', ...props }) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl',
  };
  
  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const baseStyles = 'inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0';
  const sizeStyles = sizes[size];
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={`${baseStyles} ${sizeStyles} object-cover ${className}`}
        {...props}
      />
    );
  }
  
  if (name) {
    return (
      <div
        className={`${baseStyles} ${sizeStyles} bg-primary text-white font-medium ${className}`}
        {...props}
      >
        {getInitials(name)}
      </div>
    );
  }
  
  return (
    <div
      className={`${baseStyles} ${sizeStyles} bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 ${className}`}
      {...props}
    >
      <FiUser size={size === 'xs' || size === 'sm' ? 12 : size === 'lg' || size === 'xl' ? 20 : 16} />
    </div>
  );
};

const AvatarGroup = ({ children, max = 4, className = '', ...props }) => {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleAvatars = max ? childArray.slice(0, max) : childArray;
  const remainingCount = max && childArray.length > max ? childArray.length - max : 0;
  
  return (
    <div className={`flex -space-x-2 ${className}`} {...props}>
      {visibleAvatars}
      {remainingCount > 0 && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 border-2 border-white dark:border-dark-card">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

Avatar.Group = AvatarGroup;

export default Avatar;