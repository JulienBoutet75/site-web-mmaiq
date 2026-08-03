import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSite } from "../context/SiteContext";
import { EditableText } from "./admin/Editable";

interface TrustLogo {
  name: string;
  slug: string;
  logo_url: string;
}

/**
 * Bandeau « Ils nous font confiance » : les logos des salles partenaires
 * RÉELLES (vue partners_public — salles actives uniquement). Pas de fond,
 * logos passés en blanc monochrome pour tenir sur le thème sombre.
 * Zéro logo en base → rien n'est rendu pour le public (pas de fausse
 * preuve sociale) ; l'admin voit un rappel pour remplir la médiathèque.
 */
export function TrustBar({
  path = "home.trust.title",
  defaultTitle = "Ils nous font confiance",
  className = "",
}: {
  path?: string;
  defaultTitle?: string;
  className?: string;
}) {
  const { isAdmin } = useSite();
  const [logos, setLogos] = useState<TrustLogo[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("partners_public")
        .select("name, slug, logo_url")
        .not("logo_url", "is", null)
        .order("name");
      if (!cancelled) setLogos((data as TrustLogo[]) || []);
    })();
    return () => { cancelled = true; };
  }, []);

  if (logos.length === 0 && !isAdmin) return null;

  // Au-delà de 5 logos la rangée défile en continu (marquee CSS pur,
  // coupé par prefers-reduced-motion) ; en dessous, rangée centrée statique.
  const marquee = logos.length > 5;
  const items = (list: TrustLogo[], ariaHidden = false) =>
    list.map((p, i) => (
      <Link
        key={`${p.slug}-${ariaHidden ? "b" : "a"}-${i}`}
        to={`/s/${p.slug}`}
        aria-hidden={ariaHidden || undefined}
        tabIndex={ariaHidden ? -1 : undefined}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-300"
        title={p.name}
      >
        <img
          src={p.logo_url}
          alt={ariaHidden ? "" : p.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-12 md:h-14 w-auto max-w-[180px] object-contain brightness-0 invert"
        />
      </Link>
    ));

  return (
    <section className={`py-12 md:py-16 px-6 ${className}`} aria-label="Salles partenaires">
      <EditableText
        as="p"
        path={path}
        defaultText={defaultTitle}
        className="block text-center font-ui text-[11px] md:text-xs font-bold tracking-[0.25em] uppercase text-[var(--color-text-secondary)] mb-8 md:mb-10"
      />
      {logos.length === 0 ? (
        // Visible uniquement par l'admin (cf. garde plus haut)
        <p className="text-center text-xs text-[var(--color-text-secondary)]/60 border border-dashed border-white/15 rounded-xl max-w-md mx-auto py-6 px-4">
          Aucun logo de salle partenaire en base. Ajoute les logos dans
          Admin → Partenaires (champ « Logo ») : ils apparaîtront ici automatiquement.
        </p>
      ) : marquee ? (
        <div className="relative overflow-hidden max-w-6xl mx-auto trust-marquee-mask">
          {/* Deux moitiés identiques, chacune avec son gap de fin (pr-*) :
              translateX(-50%) reboucle alors sans couture visible. */}
          <div className="flex w-max trust-marquee">
            <div className="flex items-center gap-14 md:gap-20 pr-14 md:pr-20">{items(logos)}</div>
            <div className="flex items-center gap-14 md:gap-20 pr-14 md:pr-20">{items(logos, true)}</div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 md:gap-x-20 max-w-5xl mx-auto">
          {items(logos)}
        </div>
      )}
    </section>
  );
}
