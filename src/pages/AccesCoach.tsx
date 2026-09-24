import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Seo } from "../components/Seo";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Button, Section } from "../v3/ui";

// Figma « Accès coach · Desktop · Vue complète » (2114:20895) et « Mobile » (2174:22940).
// Accès par clé : session coach locale, hors Supabase Auth (logique reprise de l’ancienne page de connexion).

const SMALL_LINK = "-my-3 inline-flex min-h-11 items-center gap-1 text-[14px] font-medium leading-5 text-v3-ink-muted underline-offset-4 hover:text-v3-navy hover:underline";

export function AccesCoach() {
  const navigate = useNavigate();
  const { coachSession, setCoachSession } = useAuth();
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Session coach déjà ouverte sur cet appareil : direction l’espace coach.
  useEffect(() => {
    if (coachSession) navigate("/coach/dashboard", { replace: true });
  }, [coachSession, navigate]);

  // Le message d’erreur reçoit le focus pour être annoncé par les lecteurs d’écran.
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const key = accessKey.trim().toUpperCase();
    if (!key) {
      setError("Saisis ta clé d’accès.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from("coaches")
        .select("id, profile_id, name, slug")
        .eq("access_key", key)
        .single();

      if (queryError || !data) throw new Error("invalid-key");

      setCoachSession({
        coachId: data.id,
        profileId: data.profile_id,
        name: data.name,
        slug: data.slug,
        role: "coach",
      });
      navigate("/coach/dashboard");
    } catch {
      setError("Clé d’accès invalide. Vérifie la clé remise par l’équipe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo
        title="Accès coach — MMA IQ"
        description="Saisis la clé d’accès remise par l’équipe MMA IQ pour retrouver ton espace coach."
        canonicalPath="/acces-coach"
      />

      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex max-w-[576px] flex-col items-start gap-6 lg:gap-10">
        <Link to="/connexion" className={SMALL_LINK}>
          <ArrowLeft aria-hidden="true" strokeWidth={1.7} className="size-3.5 shrink-0" />
          Retour à la connexion
        </Link>

        <h1 className="text-[32px] font-semibold leading-[38px] text-v3-navy lg:text-[40px] lg:leading-[46px]">Accéder à mon espace coach.</h1>
        <p className="text-[16px] leading-6 text-v3-ink-muted lg:text-[18px] lg:leading-7">
          Saisis la clé d’accès remise par l’équipe pour retrouver ton espace coach.
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col items-start gap-6 lg:gap-10">
          <div className="w-full">
            <label htmlFor="coach-access-key" className="v3-field-label">Clé d’accès</label>
            <input
              id="coach-access-key"
              name="access-key"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
              value={accessKey}
              onChange={(event) => setAccessKey(event.target.value.toUpperCase())}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "coach-access-key-error" : undefined}
              placeholder="Saisir ma clé"
              className="v3-input"
            />
            {error && (
              <p id="coach-access-key-error" ref={errorRef} tabIndex={-1} role="alert" className="mt-2 text-[14px] leading-5 text-[#c0392b] focus:outline-none">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Accéder à mon espace"}
          </Button>
        </form>

        <Link to="/contact" className={SMALL_LINK}>
          Tu n’as pas de clé ? Contacter l’équipe
          <ArrowRight aria-hidden="true" strokeWidth={1.7} className="size-3.5 shrink-0" />
        </Link>
      </Section>
    </>
  );
}
