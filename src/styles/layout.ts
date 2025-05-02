import { Variants } from 'framer-motion';

export const sidebarVariants: Variants = {
  expanded: { width: '100%' },
  collapsed: { width: '4rem' }
};

export const navLinkStyles = {
  base: 'flex items-center px-3 py-2 text-sm font-medium rounded-md',
  active: 'bg-primary-100 text-primary-700',
  inactive: 'text-grey-600 hover:bg-grey-100 hover:text-grey-900'
}; 