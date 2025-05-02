import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SidebarProps } from '../../types/layout';
import { sidebarVariants } from '../../styles/layout';
import { NavLink } from './NavLink';
import { SIDEBAR_ROUTES, RouteItem } from '../../constants/routes';
import useAuthStore from '../../store/authStore';
import { handleLinkClick } from '../../utils/layout';
import { ChevronDown, ChevronRight } from 'lucide-react';

const Sidebar: React.FC<SidebarProps> = ({ onToggle, isCollapsed, isMobile = false }) => {
  const { user } = useAuthStore();
  const hasPermission = useAuthStore(state => state.hasPermission);
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});

  const checkRouteAccess = (route: RouteItem) => {
    if (route.requiredPermissions?.length) {
      return route.requiredPermissions.some(permission => hasPermission(permission));
    }
    if (route.requiredRoles?.length) {
      return route.requiredRoles.includes(user?.role || '');
    }
    return true;
  };

  const toggleSubmenu = (path: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const renderMenuItems = (routes: RouteItem[], level = 0) => {
    return routes.map((route) => {
      if (!checkRouteAccess(route)) return null;
      
      const hasChildren = route.children && route.children.length > 0;
      const isExpanded = expandedMenus[route.path] || false;
      
      return (
        <div key={route.path} className={`ml-${level * 3}`}>
          {hasChildren ? (
            <div>
              <div 
                className={`flex items-center px-4 py-2 rounded-md cursor-pointer hover:bg-grey-100 text-grey-800 ${isExpanded ? 'bg-grey-100' : ''}`}
                onClick={() => toggleSubmenu(route.path)}
              >
                <span className="mr-3">{route.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{route.label}</span>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </>
                )}
              </div>
              
              {isExpanded && !isCollapsed && (
                <div className="ml-4 mt-1 mb-1 border-l-2 border-grey-200 pl-2">
                  {renderMenuItems(route.children!, level + 1)}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to={route.path}
              label={route.label}
              icon={route.icon}
              isCollapsed={isCollapsed}
              onClick={() => handleLinkClick(isMobile, onToggle)}
              isMobile={isMobile}
              onToggle={onToggle}
            />
          )}
        </div>
      );
    });
  };

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto bg-white relative"
      initial={isCollapsed ? "collapsed" : "expanded"}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div 
        className="flex-1 space-y-1 p-3"
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {renderMenuItems(SIDEBAR_ROUTES)}
      </motion.div>
    </motion.div>
  );
};

export default Sidebar;