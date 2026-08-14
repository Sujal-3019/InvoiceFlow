import React from "react";

const Skeleton = ({ className = '', variant = 'rectangular', ...props }) => {
  const baseStyles = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  
  const variants = {
    rectangular: `rounded-lg ${className}`,
    circular: `rounded-full ${className}`,
    text: `rounded ${className}`,
  };
  
  return (
    <div className={`${baseStyles} ${variants[variant]}`} {...props} />
  );
};

const SkeletonCard = ({ className = '', ...props }) => {
  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
      <Skeleton className="h-4 w-1/3 mb-4" variant="text" />
      <Skeleton className="h-8 w-3/4 mb-2" variant="text" />
      <Skeleton className="h-4 w-1/2" variant="text" />
    </div>
  );
};

const SkeletonTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <Skeleton className="h-4 w-1/4" variant="text" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" variant="text" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

Skeleton.Card = SkeletonCard;
Skeleton.Table = SkeletonTable;

export default Skeleton;