export const handleLinkClick = (isMobile: boolean, onToggle?: () => void) => {
  if (isMobile && onToggle) {
    onToggle();
  }
};

export const toggleSidebar = (onToggle?: () => void) => {
  if (onToggle) {
    onToggle();
  }
}; 