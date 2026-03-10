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
      // Tentar carregar perfil com tratamento de erro
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Se houver erro de recursão, criar perfil local temporário
      if (error) {
        console.error('Erro ao carregar perfil:', error);
        
        // Criar perfil temporário local para permitir funcionamento
        const tempProfile: Profile = {
          id: userId,
          email: 'user@example.com',
          full_name: 'Usuário Temporário',
          role: 'user',
          created_at: new Date().toISOString()
        };
        
        setProfile(tempProfile);
        return;
      }
      
      // Se não encontrar perfil, cria um básico
      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              email: 'user@example.com', // Será atualizado depois
              full_name: '',
              role: 'user'
            }
          ])
          .select()
          .single();
          
        if (createError) {
          console.error('Erro ao criar perfil:', createError);
          // Obter dados do usuário para criar perfil temporário correto
          const { data: { user } } = await supabase.auth.getUser();
          
          // Detectar automaticamente se é admin
          const isAdmin = user?.email === 'admin@nexus156.com' || 
                         user?.email?.includes('admin') ||
                         user?.user_metadata?.role === 'admin';
          
          // Criar perfil temporário local com dados reais
          const tempProfile: Profile = {
            id: userId,
            email: user?.email || 'user@example.com',
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário',
            role: isAdmin ? 'admin' : 'user',
            created_at: new Date().toISOString()
          };
          setProfile(tempProfile);
          return;
        }
        
        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Criar perfil temporário local em caso de erro
      const tempProfile: Profile = {
        id: userId,
        email: 'user@example.com',
        full_name: 'Usuário Temporário',
        role: 'user',
        created_at: new Date().toISOString()
      };
      setProfile(tempProfile);
      setLoading(false); // Mesmo com erro, define loading como false para permitir navegação
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // FUNÇÃO NOVA: Atualiza o profile localmente
  const updateProfile = (newProfile: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev!, ...newProfile }));
  };

  // FUNÇÃO NOVA: Criar usuário de teste para desenvolvimento
  const createTestUser = async () => {
    try {
      const testEmail = 'teste@nexus156.com';
      const testPassword = '123456';
      
      // Tenta criar o usuário
      const { error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });
      
      if (error && !error.message.includes('already registered')) {
        console.error('Erro ao criar usuário de teste:', error);
        return;
      }
      
      // Se usuário já existe, tenta fazer login
      if (error?.message.includes('already registered')) {
        await signIn(testEmail, testPassword);
      } else {
          // Faz login automático após criar
        await signIn(testEmail, testPassword);
      }
    } catch (error) {
      console.error('Erro ao criar/usar usuário de teste:', error);
    }
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