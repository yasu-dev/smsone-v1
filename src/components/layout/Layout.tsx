import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  // Navbarからのトグル操作を処理する関数
  const handleNavbarToggle = () => {
    // サイドバーの開閉状態を切り替える
    setIsSidebarCollapsed(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-grey-50">
      <Navbar 
        onMobileMenuToggle={handleMobileMenuToggle}
        onSidebarToggle={handleNavbarToggle}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      
      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <div className={`hidden md:block fixed top-16 bottom-0 left-0 border-r border-grey-200 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:w-16' : 'md:w-64 lg:w-72'
        }`}>
          <Sidebar onToggle={handleSidebarToggle} isCollapsed={isSidebarCollapsed} />
        </div>
        
        {/* Mobile Sidebar - Show when mobile menu is open */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden fixed top-16 bottom-0 left-0 z-20 w-64 border-r border-grey-200 bg-white"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ 
                type: "spring", 
                stiffness: 350, 
                damping: 30 
              }}
            >
              <Sidebar onToggle={handleMobileMenuToggle} isCollapsed={false} isMobile={true} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Black overlay when mobile menu is open */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden fixed inset-0 bg-black z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleMobileMenuToggle}
            />
          )}
        </AnimatePresence>
        
        <main className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full transition-all duration-300 ${
          isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64 lg:ml-72'
        }`}>
          <Outlet />
        </main>
      </div>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#111827',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </div>
  );
};

export default Layout;