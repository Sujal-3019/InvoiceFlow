import { FiChevronLeft, FiChevronRight, FiMoreHorizontal } from 'react-icons/fi';
import React from "react";

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  siblingCount = 1, 
  className = '', 
  ...props 
}) => {
  if (totalPages <= 1) return null;
  
  const generatePageNumbers = () => {
    const pages = [];
    const startPage = Math.max(2, currentPage - siblingCount);
    const endPage = Math.min(totalPages - 1, currentPage + siblingCount);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  const pageNumbers = generatePageNumbers();
  const showLeftEllipsis = currentPage > siblingCount + 2;
  const showRightEllipsis = currentPage < totalPages - siblingCount - 1;
  
  return (
    <nav className={`flex items-center justify-between ${className}`} {...props}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <FiChevronLeft size={16} />
        Previous
      </button>
      
      <div className="flex items-center gap-1">
        <PageButton 
          page={1} 
          isActive={currentPage === 1} 
          onClick={() => onPageChange(1)} 
        />
        
        {showLeftEllipsis && (
          <span className="px-3 py-2 text-gray-400">
            <FiMoreHorizontal />
          </span>
        )}
        
        {pageNumbers.map((page) => (
          <PageButton
            key={page}
            page={page}
            isActive={currentPage === page}
            onClick={() => onPageChange(page)}
          />
        ))}
        
        {showRightEllipsis && (
          <span className="px-3 py-2 text-gray-400">
            <FiMoreHorizontal />
          </span>
        )}
        
        {totalPages > 1 && (
          <PageButton
            page={totalPages}
            isActive={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
          />
        )}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
        <FiChevronRight size={16} />
      </button>
    </nav>
  );
};

const PageButton = ({ page, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg transition-colors
        ${isActive 
          ? 'bg-primary text-white' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      {page}
    </button>
  );
};

export default Pagination;