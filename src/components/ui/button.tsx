import React from 'react';

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  type = 'button',
  className = '',
  children,
  onClick,
  disabled = false
}) => {
  return (
    <button
      type={type}
      className={`px-4 py-2 font-medium rounded-md transition-colors ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}; 