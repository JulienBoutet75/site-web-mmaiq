import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { resetPassword } from "../lib/supabase";
import { Seo } from "../components/Seo";
import { ACCOUNT_LINK, FormAlert, RECOVERY_COLUMN, RECOVERY_SECTION, RECOVERY_TITLE, TextField } from "../components/AccountForm";
import { Button, ButtonLink } from "../v3/ui";

// Figma « Mot de passe oublié · Desktop · Vue complète » (2114:20731) et « Mobile » (2174:22864) ;
// état « E-mail envoyé » (2114:20819 / 2174:22905).

export function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const errorRef = useRef<HTMLDivElement>(null);
  const sentTitleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  useEffect(() => {
    if (sent) sentTitleRef.current?.focus();
  }, [sent]);

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      // Lien de retour : /connexion/nouveau-mot-de-passe (voir resetPassword).
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l’envoi du lien.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo
        title="Mot de passe oublié — MMA IQ"
        description="Reçois par e-mail un lien pour choisir un nouveau mot de passe pour ton compte MMA IQ."
        canonicalPath="/connexion/mot-de-passe-oublie"
      />

      {sent ? (
        /* E-mail envoyé */
        <section className={`${RECOVERY_SECTION} bg-v3-accent text-white`}>
          <div className={RECOVERY_COLUMN}>
            <p className="v3-label">01 / VÉRIFIE TA BOÎTE MAIL</p>
            <h1 ref={sentTitleRef} tabIndex={-1} className={`${RECOVERY_TITLE} focus:outline-none!`}>Vérifie ta boîte mail.</h1>
            <p role="status" className="text-[16px] leading-6 lg:text-[18px] lg:leading-7">
              Si un compte est associé à cette adresse, tu recevras un lien pour choisir un nouveau mot de passe.
            </p>
            <ButtonLink to="/connexion">Retour à la connexion</ButtonLink>
          </div>
        </section>
      ) : (
        /* Récupération du compte */
        <section className={`${RECOVERY_SECTION} bg-v3-clair text-v3-navy`}>
          <div className={RECOVERY_COLUMN}>
            <Link to="/connexion" className={`v3-label inline-flex items-center gap-1 text-v3-ink-muted ${ACCOUNT_LINK}`}>
              <ArrowLeft aria-hidden="true" strokeWidth={1.7} className="size-3.5" />
              Retour à la connexion
            </Link>
            <h1 className={RECOVERY_TITLE}>Mot de passe oublié ?</h1>
            <p className="text-[16px] leading-6 text-v3-ink-muted lg:text-[18px] lg:leading-7">
              Indique l’adresse e-mail de ton compte. Nous t’enverrons un lien pour choisir un nouveau mot de passe.
            </p>
            <form onSubmit={handleResetPassword} className="flex w-full flex-col items-start gap-6 lg:gap-10">
              {error && <FormAlert ref={errorRef}>{error}</FormAlert>}
              <TextField
                id="reset-email"
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
              <Button type="submit" disabled={loading} aria-busy={loading}>
                {loading ? "Envoi en cours…" : "Recevoir le lien"}
              </Button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
