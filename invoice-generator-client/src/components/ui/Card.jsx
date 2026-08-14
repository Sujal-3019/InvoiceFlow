import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  hover = false,
  padding = true,
  ...props
}) => {

  const baseStyles = `
    bg-white 
    dark:bg-dark-card 
    rounded-2xl 
    border 
    border-gray-200 
    dark:border-dark-border
  `;

  const paddingStyles = padding ? 'p-6' : '';

  const hoverStyles = hover
    ? 'hover:shadow-medium transition-shadow duration-300'
    : 'shadow-sm';


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${baseStyles} ${paddingStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};


const CardHeader = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`flex items-center justify-between mb-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);


const CardTitle = ({
  children,
  className = '',
  as: Component = 'h3',
  ...props
}) => (
  <Component
    className={`
      text-card-title 
      text-gray-900 
      dark:text-gray-100 
      font-semibold 
      ${className}
    `}
    {...props}
  >
    {children}
  </Component>
);


const CardDescription = ({
  children,
  className = '',
  ...props
}) => (
  <p
    className={`
      text-sm 
      text-gray-500 
      dark:text-gray-400 
      ${className}
    `}
    {...props}
  >
    {children}
  </p>
);


const CardContent = ({
  children,
  className = '',
  ...props
}) => (
  <div className={className} {...props}>
    {children}
  </div>
);


const CardFooter = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`
      flex 
      items-center 
      gap-2 
      pt-4 
      border-t 
      border-gray-100 
      dark:border-gray-800 
      ${className}
    `}
    {...props}
  >
    {children}
  </div>
);


Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;


export default Card;