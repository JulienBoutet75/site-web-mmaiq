import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { signIn, getProfile } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Seo } from "../components/Seo";
import { ACCOUNT_LINK, ACCOUNT_TITLE, FILL_VIEWPORT, FormAlert, PasswordField, TextField, safeRedirect } from "../components/AccountForm";
import { Button, ButtonLink } from "../v3/ui";

// Figma « Connexion · Desktop · Vue complète » (2110:24246) et « Mobile » (2174:22068).
// Connexion par e-mail uniquement : l’inscription (/inscription), le mot de passe oublié
// (/connexion/mot-de-passe-oublie) et l’accès coach par clé (/acces-coach) ont leur page.
export function Connexion() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const redirectTo = safeRedirect(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { primeAuth } = useAuth();

  // A11y : le message d’erreur reçoit le focus pour être annoncé.
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  // Anciens liens /connexion?mode=signup|reset|coach : chaque parcours a désormais sa page.
  if (mode === "signup") {
    return <Navigate to={redirectTo ? `/inscription?redirect=${encodeURIComponent(redirectTo)}` : "/inscription"} replace />;
  }
  if (mode === "reset") return <Navigate to="/connexion/mot-de-passe-oublie" replace />;
  if (mode === "coach") return <Navigate to="/acces-coach" replace />;

  // Convention de redirection : admin/super_admin → /admin, coach → /coach/dashboard,
  // sinon ?redirect=… puis l’espace personnel par défaut.
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

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

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
      setError(err.message || "E-mail ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const signupPath = redirectTo ? `/inscription?redirect=${encodeURIComponent(redirectTo)}` : "/inscription";

  return (
    <>
      <Seo
        title="Connexion — MMA IQ"
        description="Connecte-toi à ton espace MMA IQ pour retrouver tes formations et ton espace personnel."
        canonicalPath="/connexion"
      />

      {/* Accéder à mon espace */}
      <section className={`v3-gutter flex w-full flex-col justify-center bg-v3-clair py-8 text-v3-navy lg:py-14 ${FILL_VIEWPORT}`}>
        <div className="mx-auto flex w-full max-w-[1152px] flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,512fr)_minmax(0,576fr)] lg:items-center lg:gap-10 xl:gap-16">
          {/* Formulaire de connexion — en premier dans le DOM (ordre mobile), à droite sur desktop */}
          <div className="flex w-full flex-col items-start gap-4 rounded-[16px] bg-white p-6 lg:order-last lg:bg-v3-clair lg:p-10">
            <h1 className={ACCOUNT_TITLE}>Bon retour.</h1>
            <p className="text-[16px] leading-6 text-v3-ink-muted lg:text-[18px] lg:leading-7">
              Connecte-toi avec l’adresse utilisée lors de ton achat.
            </p>

            <form onSubmit={handleSignIn} className="flex w-full flex-col items-start gap-4">
              {error && <FormAlert ref={errorRef}>{error}</FormAlert>}
              <TextField
                id="connexion-email"
                label="Adresse e-mail"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="toi@exemple.fr"
              />
              <PasswordField
                id="connexion-password"
                label="Mot de passe"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Saisir ton mot de passe"
              />
              <Link to="/connexion/mot-de-passe-oublie" className={`v3-label text-v3-ink-muted ${ACCOUNT_LINK}`}>
                Mot de passe oublié ?
              </Link>
              <Button type="submit" block disabled={loading} aria-busy={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
            </form>

            <ButtonLink to={signupPath} variant="light">Créer un compte</ButtonLink>
            <p className="v3-label text-v3-ink-muted">
              Tu es coach ? <Link to="/acces-coach" className={`inline-flex items-center gap-1 align-top ${ACCOUNT_LINK}`}>Accéder avec ma clé<ArrowRight aria-hidden="true" strokeWidth={1.7} className="size-3.5" /></Link>
            </p>
          </div>

          {/* Bienvenue */}
          <div className="flex w-full flex-col items-start gap-6">
            <p className="v3-label text-v3-ink-muted">TON ESPACE MMA IQ</p>
            <h2 className={ACCOUNT_TITLE}>La suite<br />se joue ici.</h2>
            <figure className="flex w-full flex-col items-center gap-4 p-4 lg:p-6">
              <img
                src="/v3/photo-wrapping-hands.webp"
                alt="Un combattant assis dans la salle ajuste ses bandes avant la séance"
                width={640}
                height={800}
                decoding="async"
                className="h-[300px] w-[240px] rounded-[16px] object-cover lg:h-[350px] lg:w-[280px]"
              />
              <figcaption className="v3-small w-full text-center text-v3-ink-muted">
                La suite se prépare, dans l’app comme à la salle.
              </figcaption>
            </figure>
            <p className="text-[16px] leading-6 text-v3-ink-muted lg:text-[18px] lg:leading-7">
              Retrouve tes formations et ton espace personnel. Pour t’entraîner, ouvre l’application sur iOS ou Android.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
