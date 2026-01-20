import React from 'react';
import { AppRoute } from '../types';

interface NavigationDockProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({ currentRoute, onNavigate }) => {
  /* Fix: Bottom bar must hover 20px above the bottom as a centered Liquid Pill */
  return (
    <nav className="fixed bottom-[20px] left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-[40px] border-[0.5px] border-white/12 rounded-full px-2 py-2 flex gap-1 shadow-2xl z-[60] shadow-white/5">
        <button 
            onClick={() => onNavigate(AppRoute.GENERATOR)}
            className={`p-3 rounded-full transition-all duration-300 ${currentRoute === AppRoute.GENERATOR 
                ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border-[0.5px] border-white/20 scale-110' 
                : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
            <span className="material-symbols-outlined block text-[24px]">home</span>
        </button>
        <button 
            onClick={() => onNavigate(AppRoute.HISTORY)}
            className={`p-3 rounded-full transition-all duration-300 ${currentRoute === AppRoute.HISTORY 
                ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border-[0.5px] border-white/20 scale-110' 
                : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
            <span className="material-symbols-outlined block text-[24px]">grid_view</span>
        </button>
        <div className="w-[0.5px] h-6 bg-white/12 my-auto mx-1"></div>
        <button 
            onClick={() => onNavigate(AppRoute.PREFERENCES)}
            className={`p-3 rounded-full transition-all duration-300 ${currentRoute === AppRoute.PREFERENCES 
                ? 'bg-primary/20 text-primary shadow-[0_0_20px_rgba(59,130,246,0.1)] border-[0.5px] border-primary/30 scale-110' 
                : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
            <span className="material-symbols-outlined block text-[24px]">settings</span>
        </button>
    </nav>
  );
};