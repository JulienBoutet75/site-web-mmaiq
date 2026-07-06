import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSession, getProfile, signOut as supabaseSignOut } from '../lib/supabase';

interface AuthState {
  user: any | null;
  profile: any | null;
  accessToken: string | null;
  coachSession: any | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isCoach: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    accessToken: typeof localStorage !== 'undefined' ? localStorage.getItem('sb_access_token') : null,
    coachSession: typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('coach_session') || 'null') : null,
    loading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sb_access_token') : null;
      const coachSession = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('coach_session') || 'null') : null;
      
      if (token) {
        try {
          const userData = await getSession();
          if (userData && userData.user) {
            const profileData = await getProfile(userData.user.id, token);
            setAuthState({
              user: userData.user,
              profile: profileData,
              accessToken: token,
              coachSession: null,
              loading: false,
            });
          } else {
            // Token invalid or expired
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('sb_access_token');
              // Clear Supabase internal storage keys
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                  localStorage.removeItem(key);
                }
              });
            }
            setAuthState(prev => ({ ...prev, user: null, profile: null, accessToken: null, loading: false }));
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('sb_access_token');
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                localStorage.removeItem(key);
              }
            });
          }
          setAuthState(prev => ({ ...prev, user: null, profile: null, accessToken: null, loading: false }));
        }
      } else if (coachSession) {
        setAuthState(prev => ({ ...prev, coachSession, loading: false }));
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    initAuth();

    // Listen for Supabase auth changes (e.g., token refresh, sign out)
    import('../lib/supabase').then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('sb_access_token');
          }
          setAuthState(prev => ({ ...prev, user: null, profile: null, accessToken: null }));
        } else if (event === 'TOKEN_REFRESHED' && session) {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('sb_access_token', session.access_token);
          }
          setAuthState(prev => ({ ...prev, accessToken: session.access_token }));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    });
  }, []);

  const signOut = async () => {
    await supabaseSignOut().catch(() => {});
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('sb_access_token');
      localStorage.removeItem('coach_session');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    }
    setAuthState({
      user: null,
      profile: null,
      accessToken: null,
      coachSession: null,
      loading: false,
    });
  };

  const isAdmin = authState.profile?.role === 'super_admin' || 
    authState.user?.email === 'stanlamoureux@gmail.com' ||
    (import.meta.env.VITE_ADMIN_EMAIL && authState.user?.email === import.meta.env.VITE_ADMIN_EMAIL);
  const isCoach = authState.profile?.role === 'coach' || !!authState.coachSession;
  const isLoggedIn = !!authState.user || !!authState.coachSession;

  return (
    <AuthContext.Provider value={{ ...authState, setAuthState, signOut, isAdmin, isCoach, isLoggedIn }}>
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
