import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-[#000000] overflow-hidden text-slate-200">
      {/* Background set to Pure Black as per iOS 27 Liquid Framework specs */}
      <div className="fixed inset-0 bg-[#000000] z-0" />
      
      <main className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden w-full h-full">
        <AnimatePresence mode="wait">
           {children}
        </AnimatePresence>
      </main>
    </div>
  );
};