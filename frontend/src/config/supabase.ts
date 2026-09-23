/**
 * Supabase Configuration for Frontend
 * Cloud PostgreSQL Database + Auth
 */

import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  text_id: string;
  gaze_data: any;
  speech_data: any;
  ai_score: number;
  difficulty_level: string;
  recommendations: string[];
  created_at: string;
}

export interface ReadingText {
  id: string;
  title: string;
  content: string;
  difficulty_level: string;
  grade_level: number;
  language: string;
  created_at: string;
}

// Helper functions
export const auth = {
  signUp: async (email: string, password: string, metadata: any) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  },
  
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  getUser: async () => {
    return await supabase.auth.getUser();
  },
};

export const db = {
  users: {
    getById: async (id: string) => {
      return await supabase.from('users').select('*').eq('id', id).single();
    },
    
    update: async (id: string, updates: Partial<User>) => {
      return await supabase.from('users').update(updates).eq('id', id);
    },
  },
  
  assessments: {
    create: async (assessment: Partial<Assessment>) => {
      return await supabase.from('assessments').insert(assessment).select().single();
    },
    
    getByUserId: async (userId: string) => {
      return await supabase.from('assessments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    },
  },
  
  texts: {
    getAll: async () => {
      return await supabase.from('reading_texts').select('*').order('difficulty_level');
    },
    
    getByLevel: async (level: string) => {
      return await supabase.from('reading_texts').select('*').eq('difficulty_level', level);
    },
  },
};
