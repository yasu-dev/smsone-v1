import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLinkProps } from '../../types/layout';
import { navLinkStyles } from '../../styles/layout';

export const NavLink: React.FC<NavLinkProps> = ({ 
  to, 
  label, 
  icon, 
  isCollapsed, 
  onClick, 
  isMobile, 
  onToggle 
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={to}
        className={`${navLinkStyles.base} ${
          isActive ? navLinkStyles.active : navLinkStyles.inactive
        }`}
        title={isCollapsed ? label : ''}
        onClick={onClick}
      >
        <span className={isCollapsed ? 'mx-auto' : 'mr-3'}>
          <motion.div
            animate={{ scale: isActive ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        </span>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
}; 