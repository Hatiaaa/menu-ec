import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const nodeEnv = typeof process !== 'undefined' ? process.env : {};
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || nodeEnv.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || nodeEnv.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing! Check your environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
