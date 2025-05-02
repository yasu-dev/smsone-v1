import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  withText = true,
  className = '' 
}) => {
  const { tenant } = useAuthStore();
  const [imageError, setImageError] = useState(false);
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl'
  };

  const heightClasses = {
    sm: 'h-5',
    md: 'h-8',
    lg: 'h-10'
  };

  // テナント名
  const tenantName = tenant?.name || 'SMSOne';
  
  // デフォルトロゴ（logo.svg）
  const defaultLogoUrl = './logo.svg';
  
  // テナントロゴがある場合はそれを使用、ない場合はデフォルトロゴを使用
  const logoUrl = (tenant?.logoUrl && tenant.logoUrl.trim() !== '' && !imageError) 
    ? tenant.logoUrl 
    : defaultLogoUrl;
  
  // logo.svgの場合は非表示にする
  const isDefaultLogo = logoUrl === defaultLogoUrl;

  // テキストのみ表示する場合
  if (!withText) {
    return (
      <div className={`flex items-center ${className}`}>
        {!isDefaultLogo && (
          <img 
            src={logoUrl} 
            alt={tenantName} 
            className={heightClasses[size]}
            onError={() => setImageError(true)}
          />
        )}
      </div>
    );
  }
  
  // ロゴとテキストを表示
  return (
    <div className={`flex items-center ${className}`}>
      {!isDefaultLogo && (
        <img 
          src={logoUrl} 
          alt={tenantName} 
          className={`mr-2 ${heightClasses[size]}`}
          onError={() => setImageError(true)}
        />
      )}
      <span 
        className={`font-black ${textSizeClasses[size]}`}
        style={{
          ...(tenant?.primaryColor ? { color: tenant.primaryColor } : {}),
          fontFamily: '"Arial Black", "Helvetica Black", Gotham, sans-serif',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: '#222222'
        }}
      >
        {tenantName}
      </span>
    </div>
  );
};

export default Logo;