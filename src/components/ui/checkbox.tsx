import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  className = '', 
  ...props 
}) => {
  return (
    <input
      type="checkbox"
      className={`h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 ${className}`}
      {...props}
    />
  );
}; 