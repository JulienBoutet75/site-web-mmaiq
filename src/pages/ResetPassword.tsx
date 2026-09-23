import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Seo } from '../components/Seo';
import { ACCOUNT_LINK, FormAlert, PasswordField, RECOVERY_COLUMN, RECOVERY_SECTION, RECOVERY_TITLE } from '../components/AccountForm';
import { Button, ButtonLink } from '../v3/ui';

// Nouveau mot de passe (retour du lien reçu par e-mail). Pas de maquette dédiée :
// même mise en page que « Mot de passe oublié » (Figma 2114:20731 / 2174:22864),
// état final sur fond accent comme « E-mail envoyé » (2114:20819).

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const successTitleRef = useRef<HTMLHeadingElement>(null);

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
    if (error) feedbackRef.current?.focus();
  }, [error]);
  useEffect(() => {
    if (success) successTitleRef.current?.focus();
  }, [success]);

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

  const seo = (
    <Seo
      title="Nouveau mot de passe — MMA IQ"
      description="Choisis un nouveau mot de passe pour ton compte MMA IQ."
      canonicalPath="/connexion/nouveau-mot-de-passe"
    />
  );

  // Mot de passe enregistré
  if (success) {
    return (
      <>
        {seo}
        <section className={`${RECOVERY_SECTION} bg-v3-accent text-white`}>
          <div className={RECOVERY_COLUMN}>
            <p className="v3-label">MMA IQ · COMPTE</p>
            <h1 ref={successTitleRef} tabIndex={-1} className={`${RECOVERY_TITLE} focus:outline-none!`}>Mot de passe enregistré.</h1>
            <p role="status" className="text-[16px] leading-6 lg:text-[18px] lg:leading-7">
              Ton mot de passe a été modifié. Tu peux continuer vers ton espace.
            </p>
            <ButtonLink to="/mes-formations">Continuer vers mes formations</ButtonLink>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {seo}
      <section className={`${RECOVERY_SECTION} bg-v3-clair text-v3-navy`}>
        <div className={RECOVERY_COLUMN}>
          <Link to="/connexion" className={`v3-label inline-flex items-center gap-1 text-v3-ink-muted ${ACCOUNT_LINK}`}>
            <ArrowLeft aria-hidden="true" strokeWidth={1.7} className="size-3.5" />
            Retour à la connexion
          </Link>
          <h1 className={RECOVERY_TITLE}>Ton nouveau mot de passe</h1>

          {authLoading || initializing ? (
            <p role="status" className="flex items-center gap-3 text-[16px] leading-6 text-v3-ink-muted lg:text-[18px] lg:leading-7">
              <Loader2 aria-hidden="true" className="size-5 animate-spin" /> Vérification de ton lien…
            </p>
          ) : !canReset ? (
            <>
              <p role="alert" className="text-[16px] leading-6 text-v3-ink-muted lg:text-[18px] lg:leading-7">
                Ce lien est invalide ou a expiré. Demande un nouveau lien de réinitialisation pour choisir ton mot de passe.
              </p>
              <ButtonLink to="/connexion/mot-de-passe-oublie">Demander un nouveau lien</ButtonLink>
            </>
          ) : (
            <>
              <p className="break-words text-[16px] leading-6 text-v3-ink-muted lg:text-[18px] lg:leading-7">
                Choisis un nouveau mot de passe pour {user?.email || 'ton compte'}.
              </p>
              <form onSubmit={handleSubmit} noValidate className="w-full">
                <fieldset disabled={submitting} className="flex w-full flex-col items-start gap-6 disabled:opacity-70 lg:gap-10">
                  {error && <FormAlert ref={feedbackRef} id="password-error">{error}</FormAlert>}
                  <div className="flex w-full flex-col gap-4">
                    <PasswordField
                      id="new-password"
                      label="Nouveau mot de passe"
                      name="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      hint="Au moins 8 caractères."
                      aria-describedby={error ? 'password-error' : undefined}
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                    />
                    <PasswordField
                      id="confirm-password"
                      label="Confirmer le nouveau mot de passe"
                      name="password_confirmation"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      aria-describedby={error ? 'password-error' : undefined}
                      value={confirmation}
                      onChange={event => setConfirmation(event.target.value)}
                    />
                  </div>
                  <Button type="submit" aria-busy={submitting}>
                    {submitting && <Loader2 aria-hidden="true" className="size-[18px] animate-spin" />}
                    {submitting ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}
                  </Button>
                </fieldset>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  );
}
