import React from 'react';

interface HeaderProps {
  title?: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  leftIcon, 
  rightIcon, 
  onLeftClick, 
  onRightClick,
  transparent = false
}) => {
  return (
    <header className={`sticky top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 ${!transparent ? 'bg-white/5 backdrop-blur-[40px] border-b-[0.5px] border-white/12' : ''}`}>
      {leftIcon ? (
        <button 
          onClick={onLeftClick}
          className="flex size-10 items-center justify-center rounded-full bg-white/5 backdrop-blur-[40px] border-[0.5px] border-white/12 text-white hover:bg-white/10 transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">{leftIcon}</span>
        </button>
      ) : <div className="size-10" />}

      {title && (
        <h1 className="text-white text-lg font-bold tracking-tight uppercase tracking-tighter">{title}</h1>
      )}

      {rightIcon ? (
        <button 
          onClick={onRightClick}
          className="flex size-10 items-center justify-center rounded-full bg-white/5 backdrop-blur-[40px] border-[0.5px] border-white/12 text-white hover:bg-white/10 transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">{rightIcon}</span>
        </button>
      ) : <div className="size-10" />}
    </header>
  );
};