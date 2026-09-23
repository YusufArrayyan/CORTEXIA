/**
 * Authentication Context
 * Provides authentication state and methods with Supabase integration
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, auth, db } from '../config/supabase';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';
  gradeLevel?: number;
  schoolName?: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check current session on mount
  useEffect(() => {
    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data } = await auth.getUser();
      if (data.user) {
        await loadUserData(data.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      const { data, error } = await db.users.getById(userId);
      if (error) throw error;
      
      if (data) {
        setUser({
          id: data.id,
          username: data.username,
          email: data.email,
          fullName: data.full_name,
          role: data.role as any,
          gradeLevel: data.grade_level,
          schoolName: data.school_name,
          profilePicture: data.profile_picture,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await auth.signUp(
        data.email,
        data.password,
        {
          username: data.username,
          full_name: data.fullName,
          role: data.role,
        }
      );

      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      // 2. Create user record in users table
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          username: data.username,
          full_name: data.fullName,
          role: data.role,
        });

      if (dbError) throw dbError;

      // 3. Create progress record for students
      if (data.role === 'STUDENT') {
        await supabase
          .from('user_progress')
          .insert({
            user_id: authData.user.id,
            current_level: 'EASY',
            total_assessments: 0,
            average_score: 0,
          });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registrasi gagal');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await auth.signIn(email, password);
      if (error) throw error;
      
      if (data.user) {
        await loadUserData(data.user.id);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login gagal');
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Logout gagal');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
