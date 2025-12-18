import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
}

const Logo: React.FC<LogoProps> = ({ className = '', variant = 'full' }) => {
  // 默认使用 public/logo.png
  const logoSrc = '/logo.png'; 

  return (
    <img 
      src={logoSrc} 
      alt="Leke Tech Logo" 
      // 移除内联 style 中的 height: auto，防止覆盖外部传入的 Tailwind 高度类 (如 h-12)
      // 添加 max-w-full 防止宽度溢出
      className={`object-contain max-w-full ${className}`}
      style={{ 
        // 仅当 variant 为 icon 且外部未指定高度时，给一个默认高度兜底，
        // 但通常建议通过 className 控制
        maxHeight: '100%' 
      }}
    />
  );
};

export default Logo;
