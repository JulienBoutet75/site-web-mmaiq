import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { signIn, signUp, resetPassword, getProfile, supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

// Page d'authentification : connexion / création de compte (élèves),
// accès coach par clé et réinitialisation de mot de passe.
// Convention d'URL : /connexion?mode=signup|signin&redirect=<chemin>
export function Connexion() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const redirectTo = searchParams.get('redirect');

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isCoachMode, setIsCoachMode] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setCoachSession, primeAuth } = useAuth();

  // A11y : les messages de feedback reçoivent le focus à leur apparition
  // pour être annoncés par les lecteurs d'écran (comme sur Contact).
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);

  const inputClass = "w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/55 focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors";
  const submitClass = "w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(123,47,255,0.3)]";

  // Convention de redirection : admin/super_admin → /admin, coach → /coach/dashboard,
  // sinon ?redirect=… puis /instructional par défaut.
  const redirectAfterAuth = (profile: any, user: any) => {
    const isAdminEmail = import.meta.env.VITE_ADMIN_EMAIL && user?.email === import.meta.env.VITE_ADMIN_EMAIL;
    if (profile?.role === 'super_admin' || profile?.role === 'admin' || isAdminEmail) {
      navigate('/admin');
    } else if (profile?.role === 'coach') {
      navigate('/coach/dashboard');
    } else {
      navigate(redirectTo || '/instructional');
    }
  };

  const switchMode = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    setIsCoachMode(false);
    setError(null);
    setSuccess(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await signIn(email, password);
      if (data.session && data.user) {
        const profile = await getProfile(data.user.id, data.session.access_token);
        // Pousse user+profile dans le contexte AVANT la navigation : les gardes
        // de /admin et /coach/dashboard voient un profil déjà chargé au montage.
        primeAuth(data.user, profile);
        redirectAfterAuth(profile, data.user);
      }
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const data = await signUp(email, password);
      if (!data.session) {
        // Confirmation par email exigée par Supabase : pas de session immédiate.
        setSuccess("Vérifie ta boîte mail pour activer ton compte.");
      } else {
        const profile = data.user ? await getProfile(data.user.id, data.session.access_token) : null;
        // Même principe qu'à la connexion : contexte alimenté avant la navigation.
        primeAuth(data.user, profile);
        redirectAfterAuth(profile, data.user);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  // Accès coach par clé : session locale hors Supabase Auth (comportement conservé).
  const handleCoachLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!accessKey.trim()) {
        throw new Error("Veuillez entrer votre clé d'accès");
      }

      const { data, error } = await supabase
        .from('coaches')
        .select('id, profile_id, name, slug')
        .eq('access_key', accessKey.trim().toUpperCase())
        .single();

      if (error || !data) {
        throw new Error("Clé invalide ou inexistante");
      }

      setCoachSession({
        coachId: data.id,
        profileId: data.profile_id,
        name: data.name,
        slug: data.slug,
        role: 'coach',
      });

      navigate('/coach/dashboard');
    } catch (err: any) {
      setError("Clé d'accès invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await resetPassword(email);
      setSuccess("Un lien de réinitialisation a été envoyé à votre adresse email.");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi du lien");
    } finally {
      setLoading(false);
    }
  };

  const subtitle = isResetMode
    ? "Réinitialiser votre mot de passe"
    : isCoachMode
      ? "Accès coach par clé"
      : mode === 'signup'
        ? "Crée ton compte gratuit pour accéder aux teasers"
        : "Connecte-toi à ton espace";

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--color-bg-surface)] border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        <div className="relative text-center mb-8">
          <Link to="/" className="absolute left-0 top-0 text-[var(--color-text-secondary)] hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Link to="/" className="inline-block mb-4">
            <h1 className="font-display text-2xl text-white tracking-tighter">
              <span className="font-days-one tracking-normal">MMA IQ</span> <span className="text-[var(--color-accent-primary)]">ACADEMY</span>
            </h1>
          </Link>
          <p className="text-[var(--color-text-secondary)] font-ui">{subtitle}</p>
        </div>

        {error && (
          <div
            role="alert"
            ref={errorRef}
            tabIndex={-1}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[var(--color-accent-red)] text-sm text-center focus:outline-none"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            ref={successRef}
            tabIndex={-1}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm text-center focus:outline-none"
          >
            {success}
          </div>
        )}

        {isResetMode ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="votre@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={submitClass}
            >
              {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
            </button>
            <button
              type="button"
              onClick={() => { setIsResetMode(false); setError(null); setSuccess(null); }}
              className="w-full text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
            >
              ← Retour à la connexion
            </button>
          </form>
        ) : isCoachMode ? (
          <form onSubmit={handleCoachLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 ml-1">Clé d'accès Coach</label>
              <input
                type="text"
                required
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                className={`${inputClass} font-ui tracking-widest uppercase`}
                placeholder="EX: A7B9X2Y4"
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-2 ml-1">
                Entrez la clé d'accès fournie par l'administrateur.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={submitClass}
            >
              {loading ? "Connexion..." : "Accéder à mon espace"}
            </button>
            <button
              type="button"
              onClick={() => { setIsCoachMode(false); setError(null); }}
              className="w-full text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
            >
              ← Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={mode === 'signup' ? handleSignUp : handleSignIn} className="space-y-4">
            <div className="flex bg-[var(--color-bg-surface)] border border-white/10 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signin' ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-white'}`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signup' ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-white'}`}
              >
                Créer un compte
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 ml-1">Mot de passe</label>
              <input
                type="password"
                required
                minLength={mode === 'signup' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
              {mode === 'signup' && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-2 ml-1">
                  8 caractères minimum.
                </p>
              )}
            </div>
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 ml-1">Confirmer le mot de passe</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
            )}

            {mode === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setIsResetMode(true); setError(null); setSuccess(null); }}
                  className="text-sm text-[var(--color-accent-primary)] hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`${submitClass} mt-4`}
            >
              {loading
                ? (mode === 'signup' ? "Création..." : "Connexion...")
                : (mode === 'signup' ? "Créer mon compte" : "Se connecter")}
            </button>

            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => { setIsCoachMode(true); setError(null); setSuccess(null); }}
                className="w-full text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
              >
                Coach ? Utiliser une clé d'accès
              </button>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
}
