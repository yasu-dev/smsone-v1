import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input: React.FC<InputProps> = ({ 
  className = '', 
  ...props 
}) => {
  return (
    <input
      className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm ${className}`}
      {...props}
    />
  );
}; 