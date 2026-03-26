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
    // Flux Styles
    {
        id: 'flux-art-deco',
        label: 'Art Deco',
        category: 'Flux Optimized',
        suffix: 'Art Deco, geometric shapes, luxury, 1920s elegance, bold lines, metallic accents',
        image: 'https://picsum.photos/seed/flux-art-deco/200/200',
        modelId: 'flux',
        order: 1
    },
    {
        id: 'flux-watercolor',
        label: 'Watercolor',
        category: 'Flux Optimized',
        suffix: 'Convert to watercolor painting with visible brushstrokes, soft edges, translucent layers, delicate washes',
        image: 'https://picsum.photos/seed/flux-watercolor/200/200',
        modelId: 'flux',
        order: 2
    },
    {
        id: 'flux-oil-el-greco',
        label: 'Oil (El Greco)',
        category: 'Flux Optimized',
        suffix: 'by El Greco, El Greco art style, dramatic chiaroscuro lighting, elongated figures, rich earthy tones',
        image: 'https://picsum.photos/seed/flux-oil-el-greco/200/200',
        modelId: 'flux',
        order: 3
    },
    {
        id: 'flux-cyberpunk',
        label: 'Cyberpunk',
        category: 'Flux Optimized',
        suffix: 'cyberpunk style, neon lights, rainy futuristic city, holographic reflections, high-tech low-life atmosphere',
        image: 'https://picsum.photos/seed/flux-cyberpunk/200/200',
        modelId: 'flux',
        order: 4
    },
    {
        id: 'flux-pixar-3d',
        label: 'Pixar-Style 3D',
        category: 'Flux Optimized',
        suffix: 'Pixar-style 3D animation, vibrant colors, expressive characters, cinematic lighting, polished render',
        image: 'https://picsum.photos/seed/flux-pixar-3d/200/200',
        modelId: 'flux',
        order: 5
    },
    {
        id: 'flux-vintage-anime',
        label: 'Vintage Anime',
        category: 'Flux Optimized',
        suffix: 'vintage 80s anime style, thick outlines, bold shadows, grainy texture, saturated colors, cel-shaded',
        image: 'https://picsum.photos/seed/flux-vintage-anime/200/200',
        modelId: 'flux',
        order: 6
    },
    {
        id: 'flux-abstract',
        label: 'Abstract',
        category: 'Flux Optimized',
        suffix: 'abstract painting, non-representational shapes, vibrant color fields, dynamic composition',
        image: 'https://picsum.photos/seed/flux-abstract/200/200',
        modelId: 'flux',
        order: 7
    },
    {
        id: 'flux-photorealistic',
        label: 'Photorealistic',
        category: 'Flux Optimized',
        suffix: 'professional studio photography, sharp focus, natural skin texture, soft diffused lighting, 85mm lens',
        image: 'https://picsum.photos/seed/flux-photorealistic/200/200',
        modelId: 'flux',
        order: 8
    },
    {
        id: 'flux-bauhaus',
        label: 'Bauhaus',
        category: 'Flux Optimized',
        suffix: 'Transform to Bauhaus art style, geometric forms, primary colors, minimalist composition',
        image: 'https://picsum.photos/seed/flux-bauhaus/200/200',
        modelId: 'flux',
        order: 9
    },
    {
        id: 'flux-pencil-sketch',
        label: 'Pencil Sketch',
        category: 'Flux Optimized',
        suffix: 'Convert to pencil sketch with natural graphite lines, cross-hatching, visible paper texture',
        image: 'https://picsum.photos/seed/flux-pencil-sketch/200/200',
        modelId: 'flux',
        order: 10
    },
    {
        id: 'flux-album-cover',
        label: 'Album Cover',
        category: 'Flux Optimized',
        suffix: 'album cover art, iconic music branding, bold typography, atmospheric mood',
        image: 'https://picsum.photos/seed/flux-album-cover/200/200',
        modelId: 'flux',
        order: 11
    },
    {
        id: 'flux-3d-animation',
        label: '3D Animation',
        category: 'Flux Optimized',
        suffix: '3D animation, computer-generated imagery, dynamic virtual cinematography, smooth shading',
        image: 'https://picsum.photos/seed/flux-3d-animation/200/200',
        modelId: 'flux',
        order: 12
    },
    {
        id: 'flux-american-tattoo',
        label: 'American Tattoo',
        category: 'Flux Optimized',
        suffix: 'classic American traditional tattoo style, bold lines, nautical elements, retro flair',
        image: 'https://picsum.photos/seed/flux-american-tattoo/200/200',
        modelId: 'flux',
        order: 13
    },
    {
        id: 'flux-analytical-cubism',
        label: 'Analytical Cubism',
        category: 'Flux Optimized',
        suffix: 'analytical cubism, geometric deconstruction, fragmented forms, monochromatic palette',
        image: 'https://picsum.photos/seed/flux-analytical-cubism/200/200',
        modelId: 'flux',
        order: 14
    },
    {
        id: 'flux-fashion-editorial',
        label: 'Fashion Editorial',
        category: 'Flux Optimized',
        suffix: 'high fashion editorial style, trendy, stylish magazine layout, professional lighting',
        image: 'https://picsum.photos/seed/flux-fashion-editorial/200/200',
        modelId: 'flux',
        order: 15
    },
    {
        id: 'flux-quality-booster',
        label: 'Quality Booster',
        category: 'Flux Optimized',
        suffix: ', enhanced for maximum quality: ultra-detailed textures, realistic lighting with soft shadows and specular highlights, sharp focus, intricate details, perfect anatomy and composition, high dynamic range, professional studio photography, 8K resolution equivalent, no artifacts, cinematic depth',
        image: 'https://picsum.photos/seed/flux-quality-booster/200/200',
        modelId: 'flux',
        order: 16
    },
    // Z-Image Styles
    {
        id: 'zimage-photorealistic',
        label: 'Photorealistic',
        category: 'Z-Image Optimized',
        suffix: 'photorealistic, extreme details, 16K, hyper-realistic, sharp focus, natural skin pores',
        image: 'https://picsum.photos/seed/zimage-photorealistic/200/200',
        modelId: 'zimage',
        order: 17
    },
    {
        id: 'zimage-fashion-editorial',
        label: 'Fashion Editorial',
        category: 'Z-Image Optimized',
        suffix: 'fashion editorial photography, high-end magazine style, cinematic sepia grading, dramatic lighting',
        image: 'https://picsum.photos/seed/zimage-fashion-editorial/200/200',
        modelId: 'zimage',
        order: 18
    },
    {
        id: 'zimage-cinematic',
        label: 'Cinematic',
        category: 'Z-Image Optimized',
        suffix: 'cinematic lighting, volumetric rays, anamorphic lens flare, filmic color grading, movie still',
        image: 'https://picsum.photos/seed/zimage-cinematic/200/200',
        modelId: 'zimage',
        order: 19
    },
    {
        id: 'zimage-illustration-anime',
        label: 'Illustration/Anime',
        category: 'Z-Image Optimized',
        suffix: 'detailed comic book art, vibrant colors, stylized characters, dynamic pose',
        image: 'https://picsum.photos/seed/zimage-illustration-anime/200/200',
        modelId: 'zimage',
        order: 20
    },
    {
        id: 'zimage-oil-van-gogh',
        label: 'Oil (Van Gogh)',
        category: 'Z-Image Optimized',
        suffix: 'in the style of Vincent van Gogh, thick swirling impasto brushstrokes, vibrant contrasting colors',
        image: 'https://picsum.photos/seed/zimage-oil-van-gogh/200/200',
        modelId: 'zimage',
        order: 21
    },
    {
        id: 'zimage-studio-portrait',
        label: 'Studio Portrait',
        category: 'Z-Image Optimized',
        suffix: 'professional studio portrait, softbox lighting, catchlights in eyes, neutral background, ultra-sharp',
        image: 'https://picsum.photos/seed/zimage-studio-portrait/200/200',
        modelId: 'zimage',
        order: 22
    },
    {
        id: 'zimage-street-art',
        label: 'Street Art / Lo-Fi',
        category: 'Z-Image Optimized',
        suffix: 'street art aesthetic, lo-fi 2015s-era, low-quality iPhone photo feel, grainy texture',
        image: 'https://picsum.photos/seed/zimage-street-art/200/200',
        modelId: 'zimage',
        order: 23
    },
    {
        id: 'zimage-dynamic-action',
        label: 'Dynamic Action',
        category: 'Z-Image Optimized',
        suffix: 'action shot, dynamic pose, motion blur, accurate anatomy, physics-based rendering',
        image: 'https://picsum.photos/seed/zimage-dynamic-action/200/200',
        modelId: 'zimage',
        order: 24
    },
    {
        id: 'zimage-retro-pinup',
        label: 'Retro Pin-Up',
        category: 'Z-Image Optimized',
        suffix: 'retro 1960s pin-up, soft natural light, black and white studio lighting, intricate artwork',
        image: 'https://picsum.photos/seed/zimage-retro-pinup/200/200',
        modelId: 'zimage',
        order: 25
    },
    {
        id: 'zimage-minimalist',
        label: 'Minimalist',
        category: 'Z-Image Optimized',
        suffix: 'minimalist composition, clean lines, negative space, high-key lighting',
        image: 'https://picsum.photos/seed/zimage-minimalist/200/200',
        modelId: 'zimage',
        order: 26
    },
    {
        id: 'zimage-y2k-glam',
        label: 'Y2K Glam',
        category: 'Z-Image Optimized',
        suffix: 'Y2K editorial, bold glam, pop surrealism, saturated colors, glossy textures',
        image: 'https://picsum.photos/seed/zimage-y2k-glam/200/200',
        modelId: 'zimage',
        order: 27
    },
    {
        id: 'zimage-hyper-realistic',
        label: 'Hyper-Realistic',
        category: 'Z-Image Optimized',
        suffix: 'ultra-realistic portrait headshots, porcelain skin with subtle freckles, soft natural lighting',
        image: 'https://picsum.photos/seed/zimage-hyper-realistic/200/200',
        modelId: 'zimage',
        order: 28
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
        
        let fetchedStyles: CustomStyle[] = [];
        if (!error && data && data.length > 0) {
            fetchedStyles = data.map(s => ({
                id: s.id,
                label: s.label,
                category: s.category,
                suffix: s.suffix,
                image: s.image,
                modelId: s.model_id,
                isFeatured: s.is_featured,
                order: s.order
            }));
        }

        // Merge with DEFAULT_STYLES to ensure new defaults are always available
        const mergedStyles = [...fetchedStyles];
        DEFAULT_STYLES.forEach(defaultStyle => {
            if (!mergedStyles.some(s => s.id === defaultStyle.id)) {
                mergedStyles.push(defaultStyle);
            }
        });

        // Sort by order
        return mergedStyles.sort((a, b) => (a.order || 0) - (b.order || 0));
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

    async updateStyle(id: string, style: Partial<CustomStyle>): Promise<boolean> {
        if (!supabase) return false;
        const { error } = await supabase
            .from('styles')
            .update({
                label: style.label,
                category: style.category,
                suffix: style.suffix,
                image: style.image,
                model_id: style.modelId,
                is_featured: style.isFeatured,
                order: style.order
            })
            .eq('id', id);

        if (error) {
            console.error('Resonance: Error updating style', error);
            return false;
        }
        return true;
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
    },

    async restoreDefaults(userId: string): Promise<CustomStyle[]> {
        if (!supabase) return DEFAULT_STYLES;
        
        // Insert all default styles
        const stylesToInsert = DEFAULT_STYLES.map(s => ({
            user_id: userId,
            label: s.label,
            category: s.category,
            suffix: s.suffix,
            image: s.image,
            model_id: s.modelId,
            is_featured: s.isFeatured,
            order: s.order
        }));

        const { data, error } = await supabase
            .from('styles')
            .insert(stylesToInsert)
            .select();

        if (error) {
            console.error('Resonance: Error restoring default styles', error);
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
    }
};
