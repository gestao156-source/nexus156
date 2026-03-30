import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/index';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (newProfile: Partial<Profile>) => void;
  createTestUser: () => Promise<void>; // Função para criar usuário de teste
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      if (!data) {
        console.warn('Perfil não encontrado para usuário:', userId);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Erro de autenticação:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro completo no signIn:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      // Ignora erro se a sessão já não existe (usuário já está deslogado)
      if (error.name === 'AuthSessionMissingError' || 
          error.message?.includes('session')) {
        console.warn('Sessão já expirada, limpando estado local');
      } else {
        console.error('Erro no logout:', error);
      }
    } finally {
      // Sempre limpa o estado local mesmo se o logout no servidor falhar
      setUser(null);
      setProfile(null);
    }
  };

  // FUNÇÃO NOVA: Atualiza o profile localmente
  const updateProfile = (newProfile: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev!, ...newProfile }));
  };

  // FUNÇÃO NOVA: Criar usuário de teste para desenvolvimento
  const createTestUser = async () => {
    console.warn('createTestUser depreciado - usar fluxo de convite formal');
    throw new Error('Função createTestUser foi removida por razões de segurança');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile, createTestUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
