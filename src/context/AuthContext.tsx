import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, getSession, getProfile, signOut as supabaseSignOut } from '../lib/supabase';

// Profil issu de la table profiles (id, email, role).
// null pour un élève sans ligne profiles : c'est un état normal.
interface Profile {
  id: string;
  email: string | null;
  role: string | null;
  [key: string]: any;
}

// Session locale « coach par clé d'accès » : stockée dans localStorage,
// indépendante de Supabase Auth (le coach n'a pas forcément de compte).
interface CoachSession {
  coachId: string;
  profileId: string | null;
  name: string;
  slug: string;
  role: 'coach';
}

interface AuthContextType {
  user: any | null;
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // Pose user+profile immédiatement après une connexion réussie (voir primeAuth).
  primeAuth: (user: any, profile: Profile | null) => void;
  // Champs de compatibilité pour les écrans existants (admin, coach, éditeur inline).
  accessToken: string | null;
  coachSession: CoachSession | null;
  setCoachSession: (session: CoachSession | null) => void;
  isAdmin: boolean;
  isCoach: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readCoachSession(): CoachSession | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('coach_session') || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [coachSession, setCoachSessionState] = useState<CoachSession | null>(readCoachSession);

  useEffect(() => {
    let cancelled = false;

    // Applique une session Supabase (ou son absence) et charge le profil associé.
    // Invariant : tant qu'une session a un user, le profil n'est écrasé qu'une fois
    // getProfile résolu — jamais remis à null pendant le fetch. Un profil posé par
    // primeAuth reste donc valable jusqu'à l'arrivée de la session complète.
    const applySession = async (nextSession: any | null) => {
      if (cancelled) return;
      setSession(nextSession);
      if (nextSession?.user) {
        const profileData = await getProfile(nextSession.user.id, nextSession.access_token);
        if (!cancelled) setProfile(profileData ?? null);
      } else {
        setProfile(null);
      }
      if (!cancelled) setLoading(false);
    };

    // Session initiale puis écoute des changements (connexion, refresh, déconnexion).
    getSession().then(applySession);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // setTimeout : évite le blocage connu de supabase-js quand on requête
      // la base directement depuis le callback d'auth.
      setTimeout(() => applySession(nextSession), 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Session coach par clé d'accès : persistée hors Supabase Auth.
  const setCoachSession = (next: CoachSession | null) => {
    if (typeof localStorage !== 'undefined') {
      if (next) {
        localStorage.setItem('coach_session', JSON.stringify(next));
      } else {
        localStorage.removeItem('coach_session');
      }
    }
    setCoachSessionState(next);
  };

  // Pose user+profile immédiatement après une connexion réussie, sans attendre
  // le tour réseau de onAuthStateChange : au montage de /admin ou /coach/dashboard,
  // les gardes de route voient un profil déjà chargé et n'éjectent pas l'utilisateur.
  // La session complète (access_token) arrive ensuite via applySession, qui ne
  // remplace le profil qu'une fois son propre getProfile résolu.
  const primeAuth = (nextUser: any, nextProfile: Profile | null) => {
    setSession((prev: any) =>
      prev?.user?.id === nextUser?.id ? prev : { user: nextUser }
    );
    setProfile(nextProfile);
    setLoading(false);
  };

  const signOut = async () => {
    await supabaseSignOut().catch(() => {});
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('coach_session');
      // Clé héritée de l'ancienne gestion de session, nettoyée par sécurité.
      localStorage.removeItem('sb_access_token');
    }
    setCoachSessionState(null);
    setSession(null);
    setProfile(null);
  };

  const user = session?.user ?? null;
  const accessToken = session?.access_token ?? null;

  const isAdmin =
    profile?.role === 'super_admin' ||
    profile?.role === 'admin' ||
    user?.email === 'stanlamoureux@gmail.com' ||
    Boolean(import.meta.env.VITE_ADMIN_EMAIL && user?.email === import.meta.env.VITE_ADMIN_EMAIL);
  const isCoach = profile?.role === 'coach' || !!coachSession;
  const isLoggedIn = !!user || !!coachSession;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signOut,
        primeAuth,
        accessToken,
        coachSession,
        setCoachSession,
        isAdmin,
        isCoach,
        isLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
