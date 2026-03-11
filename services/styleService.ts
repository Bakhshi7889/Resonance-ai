import { supabase } from './supabase';
import { CustomStyle } from '../types';

export const styleService = {
    async getStyles(): Promise<CustomStyle[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('styles')
            .select('*')
            .order('order', { ascending: true })
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('Resonance: Error fetching styles', error);
            return [];
        }

        return (data || []).map(s => ({
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
