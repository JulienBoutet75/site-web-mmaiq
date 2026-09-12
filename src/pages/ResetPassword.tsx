import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Supabase peut garder une session existante lorsque le lien reçu est invalide.
// Dans ce cas, ne pas proposer de modifier le compte déjà connecté.
function hasRecoveryUrlError() {
  const params = [new URLSearchParams(window.location.search), new URLSearchParams(window.location.hash.slice(1))];
  return params.some(values => ['error', 'error_code', 'error_description'].some(key => values.has(key)));
}

export function ResetPassword() {
  const { session, user, loading: authLoading } = useAuth();
  const [initializing, setInitializing] = useState(true);
  const [invalidLink, setInvalidLink] = useState(hasRecoveryUrlError);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // initialize() attend la promesse déjà lancée par createClient. Le SDK
    // échange lui-même les paramètres du lien puis AuthProvider expose la session.
    supabase.auth.initialize().then(({ error: initializationError }) => {
      if (!cancelled && initializationError) setInvalidLink(true);
    }).catch(() => {
      if (!cancelled) setInvalidLink(true);
    }).finally(() => {
      if (!cancelled) setInitializing(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (error || success) feedbackRef.current?.focus();
  }, [error, success]);

  const canReset = !invalidLink && Boolean(session?.access_token && user);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || initializing || authLoading || !canReset) return;
    setError(null);
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        if (updateError.status === 401 || updateError.status === 403 || ['session_not_found', 'user_not_found', 'refresh_token_not_found', 'refresh_token_already_used', 'reauthentication_needed'].includes(updateError.code || '') || updateError.name === 'AuthSessionMissingError') {
          setInvalidLink(true);
          return;
        }
        if (updateError.code === 'same_password') {
          setError("Choisis un mot de passe différent de l'ancien.");
        } else if (updateError.code === 'weak_password') {
          setError('Ce mot de passe est trop faible. Choisis-en un plus long et plus difficile à deviner.');
        } else {
          setError("Impossible d'enregistrer ton mot de passe pour le moment. Réessaie dans un instant.");
        }
        return;
      }
      setPassword('');
      setConfirmation('');
      setSuccess(true);
    } catch {
      setError("Impossible de joindre le service. Vérifie ta connexion et réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full min-h-12 bg-[var(--color-bg-base)] border border-white/15 rounded-xl py-3 pl-4 pr-14 text-white focus:outline-none focus:border-[var(--color-accent-primary)]';
  const buttonClass = 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent-primary)] px-5 py-3 font-semibold text-white hover:bg-[var(--color-violet-600)] transition-colors disabled:opacity-50 disabled:cursor-wait';

  return (
    <div className="min-h-svh bg-[var(--color-bg-base)] flex items-center justify-center px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--color-bg-surface)] p-6 sm:p-8">
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-white mb-5">
          <ArrowLeft size={16} aria-hidden="true" /> Retour à l'accueil
        </Link>
        <p className="font-days-one text-lg mb-3">MMA IQ <span className="text-[var(--color-accent-primary)]">ACADEMY</span></p>
        <h1 className="font-display text-3xl mb-3">{success ? 'Mot de passe enregistré' : 'Ton nouveau mot de passe'}</h1>

        {authLoading || initializing ? (
          <p role="status" className="flex items-center gap-3 py-8 text-[var(--color-text-secondary)]"><Loader2 size={20} className="animate-spin" aria-hidden="true" /> Vérification de ton lien…</p>
        ) : success ? (
          <>
            <div ref={feedbackRef} tabIndex={-1} role="status" className="my-6 rounded-xl border border-green-400/25 bg-green-400/10 p-4 text-green-300 focus:outline-none">
              <CheckCircle2 size={24} className="mb-3" aria-hidden="true" />
              Ton mot de passe a été modifié. Tu peux continuer vers ton espace.
            </div>
            <Link to="/mes-formations" className={buttonClass}>Continuer vers mes formations</Link>
          </>
        ) : !canReset ? (
          <>
            <div role="alert" className="my-6 rounded-xl border border-white/15 p-4 text-[var(--color-text-secondary)]">
              Ce lien est invalide ou a expiré. Demande un nouveau lien de réinitialisation pour choisir ton mot de passe.
            </div>
            <Link to="/connexion?mode=reset" className={buttonClass}>Demander un nouveau lien</Link>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 break-words">Choisis un nouveau mot de passe pour {user.email || 'ton compte'}.</p>
            {error && <div ref={feedbackRef} tabIndex={-1} role="alert" id="password-error" className="mb-5 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-300 focus:outline-none">{error}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <fieldset disabled={submitting} className="space-y-5 disabled:opacity-70">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium mb-2">Nouveau mot de passe</label>
                  <div className="relative">
                    <input id="new-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} aria-describedby={error ? 'password-help password-error' : 'password-help'} className={inputClass} />
                    <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Masquer le nouveau mot de passe' : 'Afficher le nouveau mot de passe'} aria-pressed={showPassword} className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-[var(--color-text-secondary)] hover:text-white">{showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button>
                  </div>
                  <p id="password-help" className="mt-2 text-sm text-[var(--color-text-secondary)]">Au moins 8 caractères.</p>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">Confirmer le nouveau mot de passe</label>
                  <div className="relative">
                    <input id="confirm-password" name="password_confirmation" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={confirmation} onChange={event => setConfirmation(event.target.value)} aria-describedby={error ? 'password-error' : undefined} className={inputClass} />
                    <button type="button" onClick={() => setShowConfirmation(value => !value)} aria-label={showConfirmation ? 'Masquer la confirmation' : 'Afficher la confirmation'} aria-pressed={showConfirmation} className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-[var(--color-text-secondary)] hover:text-white">{showConfirmation ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button>
                  </div>
                </div>
                <button type="submit" disabled={submitting} className={buttonClass}>{submitting && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}{submitting ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}</button>
              </fieldset>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
