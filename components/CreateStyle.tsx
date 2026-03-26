import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute, AppSettings, CustomStyle, ModelInfo } from '../types';
import { Header } from './Header';
import { generateImageUrl, getRandomSeed } from '../services/pollinations';
import { Check, Wand2, Image as ImageIcon, Save, RefreshCw, Star, Hash } from 'lucide-react';
import { styleService } from '../services/styleService';

interface CreateStyleProps {
  onNavigate: (route: AppRoute) => void;
  settings: AppSettings;
  styles: CustomStyle[];
  setStyles: React.Dispatch<React.SetStateAction<CustomStyle[]>>;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  user: any;
  models: ModelInfo[];
}

const PREVIEW_SUBJECTS = [
    "A futuristic city",
    "A mysterious portrait",
    "A sports car",
    "A magical forest"
];

export const CreateStyle: React.FC<CreateStyleProps> = memo(({ onNavigate, settings, styles, setStyles, updateSettings, user, models }) => {
  const [name, setName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux');
  const [isFeatured, setIsFeatured] = useState(false);
  const [order, setOrder] = useState(0);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isDeveloper = user?.email === 'herobakhshi@gmail.com';
  
  const handleGenerate = async () => {
    if (!suffix.trim()) return;
    setIsGenerating(true);
    setGeneratedImages([]);
    setCoverImage(null);
    
    // Generate 4 unique variations
    const promises = PREVIEW_SUBJECTS.map(async (subject, index) => {
        const seed = getRandomSeed() + index; 
        const prompt = `${subject}${suffix}`;
        
        const url = await generateImageUrl({
            prompt,
            model: selectedModel,
            width: 512, 
            height: 768, 
            seed,
            enhance: true, 
            nologo: true,
            safe: true,
            private: true,
            apiKey: settings.apiKey
        });
        
        return new Promise<string>((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(url);
            img.onerror = () => resolve(url); 
        });
    });

    try {
        const results = await Promise.all(promises);
        setGeneratedImages(results);
        if (results.length > 0) {
            setCoverImage(results[0]);
        }
    } catch (e) {
        console.error("Failed to generate previews", e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!name || !suffix || !coverImage || isSaving || !user) return;
    
    setIsSaving(true);
    try {
        const newStyle = await styleService.addStyle({
            label: name,
            category: 'Custom',
            suffix: suffix,
            image: coverImage,
            modelId: selectedModel,
            isFeatured: isFeatured,
            order: order
        }, user.id);

        if (newStyle) {
            setStyles(prev => [newStyle, ...prev]);
            onNavigate(AppRoute.STYLE_LIBRARY);
        }
    } catch (error) {
        console.error("Failed to save style:", error);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <motion.div 
      className="flex flex-col h-full bg-black w-full"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="w-full max-w-3xl mx-auto flex flex-col h-full">
        <Header 
            leftIcon="arrow_back"
            onLeftClick={() => onNavigate(AppRoute.PREFERENCES)}
            title="Create Style"
            rightIcon="check"
            onRightClick={handleSave}
        />

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-32">
            
            {/* Top Space: Cover Image Selection */}
            <div className={`w-full aspect-[2/3] md:aspect-[16/9] rounded-[2.5rem] bg-white/5 backdrop-blur-xl border overflow-hidden relative group shadow-2xl flex items-center justify-center transition-all ${isFeatured ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-white/10'}`}>
                {coverImage ? (
                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover animate-in fade-in duration-500" />
                ) : (
                    <div className="flex flex-col items-center gap-4 text-white/20">
                        <ImageIcon size={48} strokeWidth={1} />
                        <span className="text-xs font-black uppercase tracking-widest">No Cover Selected</span>
                    </div>
                )}
                {isFeatured && (
                    <div className="absolute top-6 left-6 z-10 bg-yellow-400 text-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                        <Star size={12} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Featured</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                    <h2 className="text-3xl font-black text-white tracking-tighter">{name || 'Untitled Style'}</h2>
                    <p className="text-sm font-medium text-white/60 line-clamp-2 mt-2">{suffix || 'No prompt instructions...'}</p>
                </div>
            </div>

            {/* Middle Row: 4 Generated Images */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Generation Matrix</span>
                    <span className="text-[10px] font-bold text-white/20">{generatedImages.length}/4</span>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                    {isGenerating ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                        ))
                    ) : generatedImages.length > 0 ? (
                        generatedImages.map((url, i) => (
                            <button 
                                key={i} 
                                onClick={() => setCoverImage(url)}
                                className={`aspect-[2/3] rounded-2xl overflow-hidden border relative transition-all ${coverImage === url ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-black scale-105 z-10' : 'border-white/10 hover:border-white/40'}`}
                            >
                                <img src={url} className="w-full h-full object-cover" loading="lazy" />
                                {coverImage === url && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))
                    ) : (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-[2/3] rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                <span className="text-white/5 text-xs font-black">{i + 1}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Bottom Inputs */}
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Style Identity</label>
                    <input 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Neon Noir" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:ring-1 focus:ring-primary/50 text-lg font-bold"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Prompt Addon (Suffix)</label>
                    <textarea 
                        value={suffix}
                        onChange={(e) => setSuffix(e.target.value)}
                        placeholder=", cyberpunk aesthetic, neon rain, high contrast..." 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:ring-1 focus:ring-primary/50 min-h-[100px] text-sm leading-relaxed resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Target Model</label>
                        <select 
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-bold appearance-none focus:ring-1 focus:ring-primary/50"
                        >
                            {models.map(m => (
                                <option key={m.id} value={m.id} className="bg-black">{m.name}</option>
                            ))}
                        </select>
                    </div>
                    {isDeveloper && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Priority Order</label>
                            <input 
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(parseInt(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-bold focus:ring-1 focus:ring-primary/50"
                            />
                        </div>
                    )}
                </div>

                {isDeveloper && (
                    <button 
                        onClick={() => setIsFeatured(!isFeatured)}
                        className={`w-full h-14 rounded-2xl border transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] ${isFeatured ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-glow' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
                    >
                        <Star size={16} fill={isFeatured ? 'currentColor' : 'none'} />
                        {isFeatured ? 'Featured Style Active' : 'Mark as Featured'}
                    </button>
                )}

                <div className="pt-2 flex gap-4">
                     <button 
                        onClick={handleGenerate}
                        disabled={!suffix || isGenerating}
                        className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${!suffix ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-primary text-white shadow-glow hover:scale-[1.02] active:scale-95'}`}
                    >
                        {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
                        {isGenerating ? 'Synthesizing...' : 'Generate Previews'}
                    </button>
                    
                    <button 
                        onClick={handleSave}
                        disabled={!name || !suffix || !coverImage}
                        className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${(!name || !suffix || !coverImage) ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-white text-black hover:bg-white/90 hover:scale-[1.02] active:scale-95'}`}
                    >
                        <Save size={16} />
                        Save Style
                    </button>
                </div>
            </div>

        </div>
      </div>
    </motion.div>
  );
});

CreateStyle.displayName = 'CreateStyle';