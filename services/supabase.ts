import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = () => !!supabase;

/**
 * DATABASE SCHEMA (Run this in Supabase SQL Editor):
 * 
 * -- Create a table for image generations
 * create table generations (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users on delete cascade,
 *   prompt text not null,
 *   url text not null,
 *   model text,
 *   width integer,
 *   height integer,
 *   seed bigint,
 *   style_suffix text,
 *   is_public boolean default false,
 *   likes_count integer default 0,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Enable RLS
 * alter table generations enable row level security;
 * 
 * -- Policies
 * create policy "Users can view their own generations." on generations for select using (auth.uid() = user_id);
 * create policy "Users can insert their own generations." on generations for insert with check (auth.uid() = user_id);
 * create policy "Public generations are viewable by everyone." on generations for select using (is_public = true);
 * 
 * -- Update for existing tables:
 * -- ALTER TABLE generations ADD COLUMN IF NOT EXISTS likes_count integer default 0;
 * 
 * -- Optional: Create a table for likes to prevent duplicate likes
 * create table likes (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users on delete cascade,
 *   generation_id uuid references generations on delete cascade,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   unique(user_id, generation_id)
 * );
 * 
 * alter table likes enable row level security;
 * create policy "Users can like once." on likes for insert with check (auth.uid() = user_id);
 * create policy "Users can unlike." on likes for delete using (auth.uid() = user_id);
 * create policy "Likes are public." on likes for select using (true);
 */
