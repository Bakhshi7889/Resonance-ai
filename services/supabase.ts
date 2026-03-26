import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'resonance_supabase_auth_token'
      }
    }) 
  : null;

export const isSupabaseConfigured = () => !!supabase;

/**
 * DATABASE SCHEMA (Run this in Supabase SQL Editor):
 * 
 * -- Create a table for user profiles
 * create table profiles (
 *   id uuid references auth.users on delete cascade primary key,
 *   name text,
 *   avatar_url text,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Enable RLS for profiles
 * alter table profiles enable row level security;
 * create policy "Public profiles are viewable by everyone." on profiles for select using (true);
 * create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
 * create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
 * 
 * -- Create a trigger to automatically create a profile for new users
 * create or replace function public.handle_new_user()
 * returns trigger as $$
 * begin
 *   insert into public.profiles (id, name, avatar_url)
 *   values (new.id, new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'avatar_url');
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 * 
 * create trigger on_auth_user_created
 *   after insert on auth.users
 *   for each row execute procedure public.handle_new_user();
 * 
 * -- Create a table for messages (Contact Developer)
 * create table messages (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users on delete cascade,
 *   user_email text not null,
 *   content text not null,
 *   is_read boolean default false,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Enable RLS for messages
 * alter table messages enable row level security;
 * create policy "Users can insert their own messages." on messages for insert with check (auth.uid() = user_id);
 * create policy "Developer can view all messages." on messages for select using (auth.jwt()->>'email' = 'herobakhshi@gmail.com');
 * create policy "Developer can update all messages." on messages for update using (auth.jwt()->>'email' = 'herobakhshi@gmail.com');
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
 *   visual_audit_passed boolean default false,
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

/**
 * RPC FUNCTIONS (Run this in Supabase SQL Editor):
 * 
 * -- Increment likes_count
 * create or replace function increment_likes(row_id uuid)
 * returns void as $$
 * begin
 *   update generations
 *   set likes_count = likes_count + 1
 *   where id = row_id;
 * end;
 * $$ language plpgsql security definer;
 * 
 * -- Decrement likes_count
 * create or replace function decrement_likes(row_id uuid)
 * returns void as $$
 * begin
 *   update generations
 *   set likes_count = greatest(0, likes_count - 1)
 *   where id = row_id;
 * end;
 * $$ language plpgsql security definer;
 */
