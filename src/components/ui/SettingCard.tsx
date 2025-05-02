import React from 'react';

interface SettingCardProps {
  title?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SettingCard: React.FC<SettingCardProps> & {
  Header: React.FC<{ children: React.ReactNode }>;
  Title: React.FC<{ children: React.ReactNode }>;
  Description: React.FC<{ children: React.ReactNode }>;
  Content: React.FC<{ children: React.ReactNode }>;
} = ({
  title,
  description,
  icon,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg border border-grey-200 overflow-hidden ${className}`}>
      {(title || description) && (
        <div className="px-6 py-4 border-b border-grey-200">
          <div className="flex items-center">
            {icon && <div className="mr-3 text-primary-500">{icon}</div>}
            {title && <h3 className="text-lg font-medium text-grey-900">{title}</h3>}
          </div>
          {description && <div className="mt-1 text-sm text-grey-500">{description}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

SettingCard.Header = ({ children }) => {
  return <div className="px-6 py-4 border-b border-grey-200">{children}</div>;
};

SettingCard.Title = ({ children }) => {
  return <h3 className="text-lg font-medium text-grey-900">{children}</h3>;
};

SettingCard.Description = ({ children }) => {
  return <div className="mt-1 text-sm text-grey-500">{children}</div>;
};

SettingCard.Content = ({ children }) => {
  return <div className="p-6">{children}</div>;
};

export default SettingCard; 