import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-background-dark overflow-hidden">
      {/* Optimized background blobs with will-change and reduced blur radius for performance */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen z-0 will-change-transform opacity-60" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[90px] pointer-events-none mix-blend-screen z-0 will-change-transform opacity-50" />
      
      <main className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden w-full h-full">
        <AnimatePresence mode="wait">
           {children}
        </AnimatePresence>
      </main>
    </div>
  );
};