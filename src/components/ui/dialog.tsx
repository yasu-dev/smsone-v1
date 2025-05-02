import React from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ 
  open, 
  onClose, 
  children,
  className = '' 
}) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full ${className}`}>
        {children}
      </div>
    </div>
  );
};

export const DialogContent: React.FC<{children: React.ReactNode; className?: string}> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<{children: React.ReactNode; className?: string}> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export const DialogTitle: React.FC<{children: React.ReactNode; className?: string}> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <h3 className={`text-lg font-medium text-gray-900 ${className}`}>
      {children}
    </h3>
  );
};

export const DialogFooter: React.FC<{children: React.ReactNode; className?: string}> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 flex justify-end gap-2 ${className}`}>
      {children}
    </div>
  );
}; 