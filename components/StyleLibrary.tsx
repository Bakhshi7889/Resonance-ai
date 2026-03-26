
import React, { useState, memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute, AppSettings, CustomStyle } from '../types';
import { Header } from './Header';
import { Trash2, Eye, EyeOff, Check, Heart, ChevronUp, ChevronDown, Star, Edit2, RotateCcw, Save, X } from 'lucide-react';
import { styleService } from '../services/styleService';
import { supabase } from '../services/supabase';

interface StyleLibraryProps {
  onNavigate: (route: AppRoute) => void;
  settings: AppSettings;
  styles: CustomStyle[];
  setStyles: React.Dispatch<React.SetStateAction<CustomStyle[]>>;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

// Memoized Style Card Component for Performance
const StyleCard = memo(({ 
    style, 
    onToggleVisibility,
    onToggleFavorite,
    onMove,
    onDelete,
    onEdit,
    isHidden,
    isCustom,
    isActive,
    isFavorite,
    isFirst,
    isLast
}: {
    style: CustomStyle,
    onToggleVisibility: (id: string) => void,
    onToggleFavorite: (id: string) => void,
    onMove: (id: string, direction: -1 | 1) => void,
    onDelete?: (id: string) => void,
    onEdit?: (style: CustomStyle) => void,
    isHidden: boolean,
    isCustom?: boolean,
    isActive: boolean,
    isFavorite: boolean,
    isFirst: boolean,
    isLast: boolean
}) => {
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`bg-surface-dark/80 backdrop-blur-xl rounded-3xl border overflow-hidden group relative flex flex-col transition-all duration-500 will-change-transform ${
                isActive ? 'border-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 
                style.isFeatured ? 'golden-outline' :
                isHidden ? 'border-red-500/20 opacity-50 grayscale' : 
                'border-white/5 hover:border-white/20 hover:shadow-2xl'
            }`}
        >
            {/* Image Container */}
            <div className="aspect-[2/3] relative bg-surface-highlight/30 overflow-hidden">
                <img 
                    src={style.image} 
                    alt={style.label} 
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                    loading="lazy"
                />
                
                {/* Featured Badge */}
                {style.isFeatured && (
                    <div className="absolute top-3 left-3 z-10 pointer-events-none">
                         <div className="featured-badge flex items-center gap-1">
                            <Star size={10} fill="currentColor" />
                            Featured
                         </div>
                    </div>
                )}

                {/* Active Badge */}
                {isActive && (
                    <div className={`absolute z-10 pointer-events-none ${style.isFeatured ? 'top-10 left-3' : 'top-3 left-3'}`}>
                         <div className="bg-primary/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5 border border-white/20">
                            <Check size={10} className="text-white stroke-[4]" />
                            <span className="text-[9px] font-black text-white uppercase tracking-wider">Active</span>
                         </div>
                    </div>
                )}

                {/* Favorite Toggle (Always Visible) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(style.id); }}
                    className={`absolute top-3 right-3 z-30 size-8 rounded-full flex items-center justify-center transition-all ${isFavorite ? 'bg-red-500 text-white shadow-glow' : 'bg-black/30 backdrop-blur-md text-white/40 hover:bg-white hover:text-red-500 hover:scale-110'}`}
                >
                    <Heart size={14} fill={isFavorite ? "currentColor" : "none"} strokeWidth={isFavorite ? 0 : 2} />
                </button>

                {/* Hidden Overlay Indicator */}
                {isHidden && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none bg-black/40 backdrop-blur-[2px]">
                        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-red-500/30 flex items-center gap-2">
                             <EyeOff size={16} className="text-red-400" />
                             <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Hidden</span>
                        </div>
                    </div>
                )}

                {/* Custom Badge */}
                {isCustom && !isFavorite && (
                    <div className="absolute top-12 right-3 z-10 pointer-events-none">
                         <div className="bg-blue-500/20 backdrop-blur-md px-2 py-1 rounded-lg border border-blue-500/30">
                            <span className="text-[8px] font-black text-blue-300 uppercase tracking-wider">Custom</span>
                         </div>
                    </div>
                )}

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4 z-20">
                     <div className="flex items-center gap-4">
                        <button 
                            onClick={() => onToggleVisibility(style.id)}
                            className="size-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-lg active:scale-90"
                            title={isHidden ? "Unhide" : "Hide"}
                        >
                            {isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        
                        {isCustom && onEdit && (
                            <button 
                                onClick={() => onEdit(style)}
                                className="size-10 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-90"
                                title="Edit Style"
                            >
                                <Edit2 size={18} />
                            </button>
                        )}
                        
                        {isCustom && onDelete && (
                            <button 
                                onClick={() => onDelete(style.id)}
                                className="size-10 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                                title="Delete Style"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                     </div>

                     <div className="flex items-center gap-2 mt-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMove(style.id, -1); }}
                            disabled={isFirst}
                            className={`size-8 rounded-full flex items-center justify-center border transition-all ${isFirst ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed' : 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-black'}`}
                        >
                            <ChevronUp size={16} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMove(style.id, 1); }}
                            disabled={isLast}
                            className={`size-8 rounded-full flex items-center justify-center border transition-all ${isLast ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed' : 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-black'}`}
                        >
                            <ChevronDown size={16} />
                        </button>
                     </div>
                </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-bold truncate">{style.label}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-white/30 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{style.category}</span>
                </div>
            </div>
        </motion.div>
    );
});

export const StyleLibrary: React.FC<StyleLibraryProps> = memo(({ onNavigate, settings, styles, setStyles, updateSettings }) => {
  const [editingStyle, setEditingStyle] = useState<CustomStyle | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const toggleVisibility = useCallback((styleId: string) => {
      const currentHidden = settings.hiddenStyleIds || [];
      let newHidden;
      
      if (currentHidden.includes(styleId)) {
          // Unhide
          newHidden = currentHidden.filter(id => id !== styleId);
      } else {
          // Hide
          newHidden = [...currentHidden, styleId];
      }
      
      updateSettings({ hiddenStyleIds: newHidden });
      
      // If hiding the currently active style, reset active to 'none' if needed
      if (settings.activeStyles.includes(styleId) && newHidden.includes(styleId)) {
           const newActive = settings.activeStyles.filter(s => s !== styleId);
           updateSettings({ hiddenStyleIds: newHidden, activeStyles: newActive.length ? newActive : ['none'] });
      }
  }, [settings.hiddenStyleIds, settings.activeStyles, updateSettings]);

  const toggleFavorite = useCallback((styleId: string) => {
      const currentFavs = settings.favoriteStyleIds || [];
      let newFavs;
      
      if (currentFavs.includes(styleId)) {
          // Un-favorite
          newFavs = currentFavs.filter(id => id !== styleId);
      } else {
          // Favorite
          newFavs = [...currentFavs, styleId];
      }
      
      updateSettings({ favoriteStyleIds: newFavs });
  }, [settings.favoriteStyleIds, updateSettings]);

  const handleDeleteCustom = useCallback(async (styleId: string) => {
      try {
          const success = await styleService.deleteStyle(styleId);
          if (success) {
              setStyles(prev => prev.filter(s => s.id !== styleId));
              
              // Cleanup settings
              if (settings.activeStyles.includes(styleId)) {
                   const newActive = settings.activeStyles.filter(s => s !== styleId);
                   updateSettings({ activeStyles: newActive.length ? newActive : ['none'] });
              }
              if (settings.hiddenStyleIds.includes(styleId)) {
                  const newHidden = settings.hiddenStyleIds.filter(id => id !== styleId);
                  updateSettings({ hiddenStyleIds: newHidden });
              }
              if ((settings.favoriteStyleIds || []).includes(styleId)) {
                  const newFavs = (settings.favoriteStyleIds || []).filter(id => id !== styleId);
                  updateSettings({ favoriteStyleIds: newFavs });
              }
              if ((settings.styleOrder || []).includes(styleId)) {
                  const newOrder = (settings.styleOrder || []).filter(id => id !== styleId);
                  updateSettings({ styleOrder: newOrder });
              }
          }
      } catch (error) {
          console.error("Failed to delete style:", error);
      }
  }, [settings, updateSettings, setStyles]);

  const moveStyle = useCallback((styleId: string, direction: -1 | 1) => {
      const all = styles;
      // Get current effective order or default if empty
      let currentOrder = [...(settings.styleOrder && settings.styleOrder.length > 0 ? settings.styleOrder : all.map(s => s.id))];
      
      // Ensure all current styles are in the order list (handle new additions)
      const missing = all.filter(s => !currentOrder.includes(s.id)).map(s => s.id);
      currentOrder = [...currentOrder, ...missing];

      const index = currentOrder.indexOf(styleId);
      if (index === -1) return;

      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= currentOrder.length) return;

      // Swap
      const temp = currentOrder[newIndex];
      currentOrder[newIndex] = currentOrder[index];
      currentOrder[index] = temp;

      updateSettings({ styleOrder: currentOrder });
  }, [settings.styleOrder, styles, updateSettings]);

  const handleRestoreDefaults = useCallback(async () => {
      if (!confirm('Are you sure you want to restore all default styles? This will re-add any missing default styles.')) return;
      
      setIsRestoring(true);
      try {
          const { data: { user } } = await supabase!.auth.getUser();
          if (user) {
              const newStyles = await styleService.restoreDefaults(user.id);
              setStyles(newStyles);
          } else {
              alert("Please log in to restore styles.");
          }
      } catch (error) {
          console.error('Failed to restore defaults:', error);
          alert("Failed to restore defaults. Neural link unstable.");
      } finally {
          setIsRestoring(false);
      }
  }, [setStyles]);

  const handleUpdateStyle = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingStyle) return;

      try {
          const success = await styleService.updateStyle(editingStyle.id, editingStyle);
          if (success) {
              setStyles(prev => prev.map(s => s.id === editingStyle.id ? editingStyle : s));
              setEditingStyle(null);
          }
      } catch (error) {
          console.error("Failed to update style:", error);
      }
  }, [editingStyle, setStyles]);

  // MANUAL SORTING: Use styleOrder as the source of truth
  const sortedStyles = useMemo(() => {
      const all = [...styles];
      
      // If no custom order, return default
      if (!settings.styleOrder || settings.styleOrder.length === 0) return all;

      // Sort based on index in styleOrder
      return all.sort((a, b) => {
          let idxA = settings.styleOrder.indexOf(a.id);
          let idxB = settings.styleOrder.indexOf(b.id);
          
          // If not found in order list (newly added), push to end
          if (idxA === -1) idxA = 9999;
          if (idxB === -1) idxB = 9999;

          return idxA - idxB;
      });
  }, [styles, settings.styleOrder]);

  const hiddenCount = (settings.hiddenStyleIds || []).length;
  const favCount = (settings.favoriteStyleIds || []).length;

  return (
    <motion.div 
      className="flex flex-col h-full bg-background-dark w-full"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
        <Header 
            leftIcon="arrow_back"
            onLeftClick={() => onNavigate(AppRoute.PREFERENCES)}
            title="Style Manager"
        />

        <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
            
            {/* Control Bar */}
            <div className="mb-8 bg-surface-dark/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-glass flex flex-col md:flex-row items-center justify-between gap-6 sticky top-0 z-20">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-white tracking-tight">Library Matrix</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-white/40 font-medium">
                             {sortedStyles.length} Total Styles
                        </span>
                        {favCount > 0 && (
                            <span className="text-xs text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                                <Heart size={10} fill="currentColor" /> {favCount} Favorites
                            </span>
                        )}
                        {hiddenCount > 0 && (
                            <span className="text-xs text-white/30 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                {hiddenCount} Hidden
                            </span>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleRestoreDefaults}
                    disabled={isRestoring}
                    className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                >
                    <RotateCcw size={14} className={isRestoring ? 'animate-spin' : ''} />
                    {isRestoring ? 'Restoring...' : 'Restore Defaults'}
                </button>
            </div>

            {/* Grid */}
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-24">
                <AnimatePresence>
                    {sortedStyles.map((style, index) => {
                        const isActive = settings.activeStyles.includes(style.id);
                        const isFavorite = (settings.favoriteStyleIds || []).includes(style.id);
                        return (
                            <StyleCard
                                key={style.id}
                                style={style}
                                onToggleVisibility={toggleVisibility}
                                onToggleFavorite={toggleFavorite}
                                onMove={moveStyle}
                                onDelete={handleDeleteCustom}
                                onEdit={setEditingStyle}
                                isHidden={(settings.hiddenStyleIds || []).includes(style.id)}
                                isCustom={true} // Now all styles are custom/database-driven
                                isActive={isActive}
                                isFavorite={isFavorite}
                                isFirst={index === 0}
                                isLast={index === sortedStyles.length - 1}
                            />
                        );
                    })}
                </AnimatePresence>
            </motion.div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
            {editingStyle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEditingStyle(null)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-surface-dark border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                    >
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Edit Style</h3>
                                <button onClick={() => setEditingStyle(null)} className="text-white/40 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateStyle} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-2">Label</label>
                                    <input 
                                        type="text"
                                        value={editingStyle.label}
                                        onChange={(e) => setEditingStyle({...editingStyle, label: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-1 focus:ring-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-2">Suffix (Prompt Modifiers)</label>
                                    <textarea 
                                        value={editingStyle.suffix}
                                        onChange={(e) => setEditingStyle({...editingStyle, suffix: e.target.value})}
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-1 focus:ring-primary transition-all resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-2">Category</label>
                                        <input 
                                            type="text"
                                            value={editingStyle.category}
                                            onChange={(e) => setEditingStyle({...editingStyle, category: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-1 focus:ring-primary transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-2">Image URL</label>
                                        <input 
                                            type="text"
                                            value={editingStyle.image}
                                            onChange={(e) => setEditingStyle({...editingStyle, image: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-1 focus:ring-primary transition-all"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full py-5 rounded-3xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-glow flex items-center justify-center gap-2 active:scale-95 transition-all mt-4"
                                >
                                    <Save size={16} />
                                    Update Style Matrix
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

StyleLibrary.displayName = 'StyleLibrary';
