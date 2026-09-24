import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { signUp, getProfile } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Seo } from "../components/Seo";
import { ACCOUNT_LINK, FILL_VIEWPORT, FormAlert, PasswordField, RECOVERY_TITLE, TextField, safeRedirect } from "../components/AccountForm";
import { Dialog, useDialogTitleId } from "../v3/Dialog";
import { Button, ButtonLink } from "../v3/ui";

// Figma « Inscription · Desktop · Vue complète » (2110:24374) et « Mobile » (2174:22129) ;
// confirmation « Inscription · Confirmation » (2093:12275 / 2093:12284).
export function Inscription() {
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirect"));
  const loginPath = redirectTo ? `/connexion?redirect=${encodeURIComponent(redirectTo)}` : "/connexion";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Confirmation par e-mail exigée par Supabase : dialogue « Vérifie ta boîte mail. »
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const navigate = useNavigate();
  const { primeAuth } = useAuth();
  const titleId = useDialogTitleId("inscription-confirmation");

  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  // Même convention qu’à la connexion : admin → /admin, coach → /coach/dashboard,
  // sinon ?redirect=… puis l’espace personnel.
  const redirectAfterAuth = (profile: any, user: any) => {
    const isAdminEmail = import.meta.env.VITE_ADMIN_EMAIL && user?.email === import.meta.env.VITE_ADMIN_EMAIL;
    if (profile?.role === "super_admin" || profile?.role === "admin" || isAdminEmail) {
      navigate("/admin");
    } else if (profile?.role === "coach") {
      navigate("/coach/dashboard");
    } else {
      navigate(redirectTo || "/mes-formations");
    }
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError(null);

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
        // Pas de session immédiate : le compte s’active depuis le lien reçu par e-mail.
        setPassword("");
        setPasswordConfirm("");
        setAwaitingConfirmation(true);
        setConfirmOpen(true);
      } else {
        const profile = data.user ? await getProfile(data.user.id, data.session.access_token) : null;
        // Contexte alimenté avant la navigation (gardes des espaces protégés).
        primeAuth(data.user, profile);
        redirectAfterAuth(profile, data.user);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo
        title="Créer un compte — MMA IQ"
        description="Crée ton compte MMA IQ pour retrouver tes formations dans ton espace personnel."
        canonicalPath="/inscription"
      />

      {/* Inscription */}
      <section className={`v3-gutter w-full bg-v3-clair py-6 text-v3-navy lg:py-10 ${FILL_VIEWPORT}`}>
        <div className="mx-auto flex w-full max-w-[576px] flex-col items-start gap-4">
          <p className="v3-label text-v3-ink-muted">MMA IQ · COMPTE</p>
          <h1 className={RECOVERY_TITLE}>Crée ton compte MMA IQ.</h1>
          <p className="v3-small text-v3-ink-muted">Retrouve tes formations dans ton espace personnel.</p>

          <form onSubmit={handleSignUp} className="flex w-full flex-col items-start gap-4">
            {error && <FormAlert ref={errorRef}>{error}</FormAlert>}
            {awaitingConfirmation && !confirmOpen && !error && (
              <FormAlert tone="info">Vérifie ta boîte mail : ouvre le lien de confirmation reçu pour activer ton compte.</FormAlert>
            )}
            <TextField
              id="inscription-email"
              label="Adresse e-mail"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="toi@exemple.fr"
            />
            <PasswordField
              id="inscription-password"
              label="Mot de passe"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-describedby="inscription-password-help"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8 caractères minimum"
            />
            <span id="inscription-password-help" className="sr-only">8 caractères minimum.</span>
            <PasswordField
              id="inscription-password-confirm"
              label="Confirmer le mot de passe"
              name="password-confirmation"
              autoComplete="new-password"
              required
              minLength={8}
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="Saisir à nouveau le mot de passe"
            />
            <p className="v3-small text-v3-ink-muted">
              En créant un compte, tu acceptes les{" "}
              <Link to="/cgv" className={`underline decoration-v3-ink-muted/40 ${ACCOUNT_LINK}`}>conditions d’utilisation</Link>. Consulte aussi la{" "}
              <Link to="/confidentialite" className={`underline decoration-v3-ink-muted/40 ${ACCOUNT_LINK}`}>politique de confidentialité</Link>.
            </p>
            <Button type="submit" block disabled={loading} aria-busy={loading}>
              {loading ? "Création…" : "Créer mon compte"}
            </Button>
            <p className="v3-label text-v3-ink-muted">
              Déjà un compte ? <Link to={loginPath} className={`inline-flex items-center gap-1 align-top ${ACCOUNT_LINK}`}>Se connecter<ArrowRight aria-hidden="true" strokeWidth={1.7} className="size-3.5" /></Link>
            </p>
          </form>
        </div>
      </section>

      {/* Inscription · Confirmation */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        labelledBy={titleId}
        panelClassName="max-w-[560px] rounded-[16px] bg-v3-paper p-6 text-v3-navy lg:bg-v3-clair lg:p-10"
      >
        <div className="flex flex-col items-start gap-6">
          <h2 id={titleId} className="text-[32px] font-medium leading-9 tracking-[-0.96px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]">
            Vérifie ta<br />boîte mail.
          </h2>
          <p className="v3-body text-v3-ink-muted">Ouvre le lien de confirmation reçu par e-mail pour activer ton compte.</p>
          <ButtonLink to={loginPath}>Retour à la connexion</ButtonLink>
          <button type="button" onClick={() => setConfirmOpen(false)} className={`v3-label text-v3-ink-muted ${ACCOUNT_LINK}`}>
            Fermer
          </button>
        </div>
      </Dialog>
    </>
  );
}
