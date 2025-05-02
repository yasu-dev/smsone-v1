import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, X, User, LogOut, ChevronDown,
  PanelRightOpen, PanelRightClose
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import { useTenant } from '../../store/TenantContext';
import { NavbarProps } from '../../types/layout';
import { toggleSidebar } from '../../utils/layout';

const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle, onSidebarToggle, isSidebarCollapsed = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, logout, tenant } = useAuthStore();
  const navigate = useNavigate();
  const { logout: tenantLogout } = useTenant();
  
  // Refs for dropdown containers
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // テナントのスタイルを適用
  useEffect(() => {
    if (tenant?.primaryColor) {
      document.documentElement.style.setProperty('--color-primary-600', tenant.primaryColor);
      if (tenant.secondaryColor) {
        document.documentElement.style.setProperty('--color-primary-700', tenant.secondaryColor);
      }
    }
  }, [tenant]);

  // Handle clicks outside of dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close profile menu dropdown if click is outside
      if (profileMenuOpen && 
          profileMenuRef.current && 
          !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    // Add event listener when dropdowns are open
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    tenantLogout();
    navigate('/login');
  };

  // テナント名
  const tenantName = tenant?.name || 'SMSOne';
  const isSMSOne = tenantName === 'SMSOne';

  return (
    <nav className="bg-grey-50 text-grey-900 fixed top-0 w-full z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* テナント名とサイドバー開閉アイコンを表示 */}
          <div className="flex-1 flex items-center justify-start">
            <div className="flex-shrink-0 flex items-center">
              {isSMSOne ? (
                <span 
                  className="text-lg font-black"
                  style={{
                    fontFamily: '"Arial Black", "Helvetica Black", Gotham, sans-serif',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: '#222222',
                    display: 'inline-block'
                  }}
                >
                  {tenantName}
                </span>
              ) : (
                <span 
                  className="text-lg font-extrabold"
                  style={tenant?.primaryColor ? { color: tenant.primaryColor } : {}}
                >
                  {tenantName}
                </span>
              )}
              
              {/* サイドバー開閉アイコン */}
              <button
                type="button"
                className="hidden sm:flex ml-3 rounded-full p-1 text-grey-700 hover:text-grey-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-grey-50"
                onClick={() => toggleSidebar(onSidebarToggle)}
              >
                {isSidebarCollapsed ? (
                  <PanelRightOpen className="h-6 w-6" />
                ) : (
                  <PanelRightClose className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center">
            {/* Profile dropdown */}
            <div className="relative ml-3" ref={profileMenuRef}>
              <div>
                <button
                  type="button"
                  className="flex rounded-full bg-grey-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-grey-50"
                  onClick={toggleProfileMenu}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-grey-200 flex items-center justify-center text-grey-700">
                      <User className="h-5 w-5" />
                    </div>
                    <span className="ml-2 text-grey-700 text-sm hidden md:block">{user?.username}</span>
                    <ChevronDown className="ml-1 h-4 w-4 text-grey-500" />
                  </div>
                </button>
              </div>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <div className="border-b border-grey-200 px-4 py-2">
                      <p className="text-sm font-medium text-grey-900">{user?.username}</p>
                      <p className="text-xs text-grey-500">{user?.email}</p>
                      {tenant && (
                        <p className="text-xs text-primary-600 mt-1"
                          style={tenant?.primaryColor ? { color: tenant.primaryColor } : {}}
                        >
                          {tenant.name}
                        </p>
                      )}
                    </div>
                    <Link
                      to="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-grey-700 hover:bg-grey-50"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      プロフィール
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-grey-700 hover:bg-grey-50"
                    >
                      ログアウト
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-grey-700 hover:text-grey-900 hover:bg-grey-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">メインメニューを開く</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden"
          >
            <div className="border-t border-grey-200 pb-3 pt-4">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-grey-200 flex items-center justify-center text-grey-700">
                    <User className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-grey-900">{user?.username}</div>
                  <div className="text-sm font-medium text-grey-700">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to="/dashboard/profile"
                  className="block px-4 py-2 text-base font-medium text-grey-700 hover:bg-grey-100"
                  onClick={toggleMobileMenu}
                >
                  プロフィール
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-grey-700 hover:bg-grey-100"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;