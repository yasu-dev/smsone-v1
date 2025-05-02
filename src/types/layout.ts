export interface NavLinkProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  isCollapsed: boolean;
  onClick?: () => void;
  isMobile?: boolean;
  onToggle?: () => void;
}

export interface SidebarProps {
  onToggle?: () => void;
  isCollapsed: boolean;
  isMobile?: boolean;
}

export interface NavbarProps {
  onMobileMenuToggle?: () => void;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
} 