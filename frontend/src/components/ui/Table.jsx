import React from "react";

import { createContext, useContext } from 'react';

const TableContext = createContext({});

const Table = ({ children, className = '', ...props }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

const TableHead = ({ children, className = '', ...props }) => {
  return (
    <thead className={`bg-gray-50 dark:bg-gray-800/50 ${className}`} {...props}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={`divide-y divide-gray-100 dark:divide-gray-800 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

const TableFoot = ({ children, className = '', ...props }) => {
  return (
    <tfoot className={`bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 ${className}`} {...props}>
      {children}
    </tfoot>
  );
};

const TableRow = ({ children, className = '', clickable = false, ...props }) => {
  return (
    <tr 
      className={`
        ${clickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
        transition-colors duration-150
        ${className}
      `} 
      {...props}
    >
      {children}
    </tr>
  );
};

const TableHeader = ({ children, className = '', align = 'left', sortable = false, sorted, sortDirection, onSort, ...props }) => {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  return (
    <th
      className={`
        px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider
        ${alignments[align]}
        ${sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''}
        ${className}
      `}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {children}
        {sortable && (
          <span className="text-gray-400">
            {sorted ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
          </span>
        )}
      </div>
    </th>
  );
};

const TableCell = ({ children, className = '', align = 'left', ...props }) => {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  return (
    <td
      className={`
        px-4 py-4 text-sm text-gray-700 dark:text-gray-300
        ${alignments[align]}
        ${className}
      `}
      {...props}
    >
      {children}
    </td>
  );
};

const EmptyState = ({ message = 'No data available', icon, className = '', colSpan = 1 }) => {
  return (
    <tr>
      <td colSpan={colSpan} className={`px-4 py-12 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          {icon || (
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          )}
          <span className="text-sm">{message}</span>
        </div>
      </td>
    </tr>
  );
};

Table.Head = TableHead;
Table.Body = TableBody;
Table.Foot = TableFoot;
Table.Row = TableRow;
Table.Header = TableHeader;
Table.Cell = TableCell;
Table.EmptyState = EmptyState;

export default Table;