import React, { createContext, useContext } from 'react';

// タブのコンテキスト
interface TabsContextProps<T extends string> {
  selectedTab: T;
  setSelectedTab: (id: T) => void;
}

const TabsContext = createContext<TabsContextProps<any> | undefined>(undefined);

// タブの使用時のエラーハンドリング
const useTabContext = <T extends string>() => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs コンポーネントのコンテキスト外で使用されています');
  }
  return context as TabsContextProps<T>;
};

// タブコンテナ
interface TabsProps<T extends string> {
  defaultValue: T;
  value?: T;
  onValueChange?: (value: T) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs<T extends string>({ 
  defaultValue, 
  value, 
  onValueChange, 
  children, 
  className = '' 
}: TabsProps<T>) {
  const [internalValue, setInternalValue] = React.useState<T>(defaultValue);
  const selectedTab = value ?? internalValue;
  const setSelectedTab = (newValue: T) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ selectedTab, setSelectedTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// タブリスト
interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex space-x-2 overflow-x-auto ${className}`}>
      {children}
    </div>
  );
};

// タブトリガー
interface TabsTriggerProps<T extends string> {
  value: T;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger<T extends string>({ value, children, className = '' }: TabsTriggerProps<T>) {
  const { selectedTab, setSelectedTab } = useTabContext<T>();
  const isSelected = selectedTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={() => setSelectedTab(value)}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        isSelected 
          ? 'bg-primary-100 text-primary-700 shadow-sm' 
          : 'text-grey-600 hover:text-grey-900 hover:bg-grey-100'
      } flex items-center ${className}`}
    >
      {children}
    </button>
  );
}

// タブコンテンツ
interface TabsContentProps<T extends string> {
  value: T;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent<T extends string>({ value, children, className = '' }: TabsContentProps<T>) {
  const { selectedTab } = useTabContext<T>();
  
  if (selectedTab !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      className={className}
    >
      {children}
    </div>
  );
} 