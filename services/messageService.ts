import { supabase } from './supabase';
import { DirectMessage } from '../types';

export const messageService = {
  async sendMessage(userId: string, email: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        { 
          user_id: userId, 
          user_email: email, 
          content: content 
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as DirectMessage;
  },

  async getMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DirectMessage[];
  },

  async markAsRead(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) throw error;
  }
};
