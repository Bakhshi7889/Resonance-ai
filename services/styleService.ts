import { supabase } from './supabase';
import { CustomStyle } from '../types';

const DEFAULT_STYLES: CustomStyle[] = [
    {
        id: 'none',
        label: 'Raw',
        category: 'Base',
        suffix: '',
        image: 'https://picsum.photos/seed/raw/200/200',
        order: 0
    },
    {
        id: 'cinematic',
        label: 'Cinematic',
        category: 'Photography',
        suffix: 'cinematic lighting, 35mm lens, 8k resolution, photorealistic, highly detailed, dramatic lighting, film grain',
        image: 'https://picsum.photos/seed/cinematic/200/200',
        order: 1
    },
    {
        id: 'anime',
        label: 'Anime',
        category: 'Illustration',
        suffix: 'anime style, studio ghibli, makoto shinkai, highly detailed, vibrant colors, 2d animation',
        image: 'https://picsum.photos/seed/anime/200/200',
        order: 2
    },
    {
        id: 'cyberpunk',
        label: 'Cyberpunk',
        category: 'Sci-Fi',
        suffix: 'cyberpunk, neon lights, futuristic city, dark atmosphere, high tech, low life, highly detailed',
        image: 'https://picsum.photos/seed/cyberpunk/200/200',
        order: 3
    },
    {
        id: 'watercolor',
        label: 'Watercolor',
        category: 'Art',
        suffix: 'watercolor painting, loose brushstrokes, vibrant colors, artistic, paper texture',
        image: 'https://picsum.photos/seed/watercolor/200/200',
        order: 4
    },
    {
        id: '3d-render',
        label: '3D Render',
        category: 'Digital Art',
        suffix: '3d render, octane render, unreal engine 5, ray tracing, highly detailed, smooth lighting',
        image: 'https://picsum.photos/seed/3d/200/200',
        order: 5
    },
    {
        id: 'pixel-art',
        label: 'Pixel Art',
        category: 'Retro',
        suffix: 'pixel art, 16-bit, retro gaming style, crisp pixels, limited color palette',
        image: 'https://picsum.photos/seed/pixel/200/200',
        order: 6
    },
    {
        id: 'origami',
        label: 'Origami',
        category: 'Craft',
        suffix: 'origami paper craft, folded paper, clean lines, studio lighting, macro photography',
        image: 'https://picsum.photos/seed/origami/200/200',
        order: 7
    },
    {
        id: 'neon-mecha',
        label: 'Neon Mecha',
        category: 'Sci-Fi',
        suffix: 'mecha robot, glowing neon lines, dark background, highly detailed mechanical parts, cinematic lighting',
        image: 'https://picsum.photos/seed/mecha/200/200',
        order: 8
    },
    {
        id: 'synthwave',
        label: 'Synthwave',
        category: 'Retro',
        suffix: 'synthwave, retrowave, 80s aesthetic, neon grid, glowing sun, vibrant magenta and cyan',
        image: 'https://picsum.photos/seed/synthwave/200/200',
        order: 9
    }
];

export const styleService = {
    async getStyles(): Promise<CustomStyle[]> {
        if (!supabase) return DEFAULT_STYLES;
        const { data, error } = await supabase
            .from('styles')
            .select('*')
            .order('order', { ascending: true })
            .order('created_at', { ascending: true });
        
        if (error || !data || data.length === 0) {
            if (error) console.error('Resonance: Error fetching styles', error);
            return DEFAULT_STYLES;
        }

        return data.map(s => ({
            id: s.id,
            label: s.label,
            category: s.category,
            suffix: s.suffix,
            image: s.image,
            modelId: s.model_id,
            isFeatured: s.is_featured,
            order: s.order
        }));
    },

    async addStyle(style: Omit<CustomStyle, 'id'>, userId: string): Promise<CustomStyle | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('styles')
            .insert([{
                user_id: userId,
                label: style.label,
                category: style.category,
                suffix: style.suffix,
                image: style.image,
                model_id: style.modelId,
                is_featured: style.isFeatured,
                order: style.order
            }])
            .select()
            .single();

        if (error) {
            console.error('Resonance: Error adding style', error);
            return null;
        }

        return {
            id: data.id,
            label: data.label,
            category: data.category,
            suffix: data.suffix,
            image: data.image,
            modelId: data.model_id,
            isFeatured: data.is_featured,
            order: data.order
        };
    },

    async deleteStyle(id: string): Promise<boolean> {
        if (!supabase) return false;
        const { error } = await supabase
            .from('styles')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('Resonance: Error deleting style', error);
            return false;
        }
        return true;
    }
};
