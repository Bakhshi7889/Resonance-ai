import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
  leftIcon?: string;
  onLeftClick?: () => void;
  rightIcon?: string;
  onRightClick?: () => void;
}

export const Header: React.FC<HeaderProps> = memo(({ 
  title, 
  leftIcon, 
  onLeftClick, 
  rightIcon, 
  onRightClick 
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-6 pt-12 z-20 relative">
      <div className="flex-1 flex items-center">
        {leftIcon && (
          <button 
            onClick={onLeftClick}
            className="size-11 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[22px]">{leftIcon}</span>
          </button>
        )}
      </div>
      
      <div className="flex-[2] flex justify-center">
        <motion.h1 
          key={title}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-black uppercase tracking-[0.3em] text-white text-center"
        >
          {title}
        </motion.h1>
      </div>
      
      <div className="flex-1 flex items-center justify-end">
        {rightIcon && (
          <button 
            onClick={onRightClick}
            className="size-11 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[22px]">{rightIcon}</span>
          </button>
        )}
      </div>
    </header>
  );
});

Header.displayName = 'Header';
