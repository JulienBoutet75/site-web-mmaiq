/**
 * Composants partagés de la direction V3 (Figma « 2026 · Proposition 03 — The next round »).
 * Chaque page les compose ; les valeurs (couleurs, rayons, typographies) viennent de v3.css.
 */
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useV3UI } from "./V3UIContext";

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/* Boutons                                                              */
/* ------------------------------------------------------------------ */

export type ButtonVariant =
  /** Violet #7B2FFF, texte blanc (CTA principal Figma). */
  | "primary"
  /** Blanc, texte encre : boutons secondaires sur fond clair (« Créer un compte », onglets). */
  | "light"
  /** Contour blanc translucide sur fond sombre (« Fermer »). */
  | "outline"
  /** Contour encre sur fond clair. */
  | "outline-dark";

const BUTTON_BASE =
  "inline-flex min-h-14 items-center justify-center gap-2 rounded-[12px] border px-6 py-[15px] text-center text-[16px] font-semibold leading-6 whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-v3-brand bg-v3-brand text-white hover:border-v3-brand-hover hover:bg-v3-brand-hover focus-visible:outline-v3-lavender",
  light: "border-white bg-white text-v3-navy hover:bg-v3-paper focus-visible:outline-v3-brand",
  outline: "border-white/60 bg-transparent text-white hover:bg-white/10 focus-visible:outline-v3-lavender",
  "outline-dark": "border-v3-navy/30 bg-transparent text-v3-navy hover:bg-v3-navy/5 focus-visible:outline-v3-brand",
};

export function buttonClass(variant: ButtonVariant = "primary", options: { block?: boolean; compact?: boolean } = {}) {
  return cx(
    BUTTON_BASE,
    BUTTON_VARIANTS[variant],
    options.block && "w-full",
    options.compact && "min-h-12 px-5 py-[11px]",
  );
}

type CommonButtonProps = { variant?: ButtonVariant; block?: boolean; compact?: boolean; className?: string; children: ReactNode };

/** Bouton d’action (élément <button>). */
export function Button({ variant = "primary", block, compact, className, children, type = "button", ...rest }: CommonButtonProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button type={type} className={cx(buttonClass(variant, { block, compact }), className)} {...rest}>
      {children}
    </button>
  );
}

/** Lien interne stylé en bouton (react-router). */
export function ButtonLink({ to, variant = "primary", block, compact, className, children, ...rest }: CommonButtonProps & { to: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "to" | "className" | "children">) {
  return (
    <Link to={to} className={cx(buttonClass(variant, { block, compact }), className)} {...rest}>
      {children}
    </Link>
  );
}

/** Lien texte avec flèche « ↗ » (ex. « Voir l’application en action ↗ »). */
export function ArrowLink({ to, children, className, tone = "light" }: { to: string; children: ReactNode; className?: string; tone?: "light" | "dark" }) {
  return (
    <Link
      to={to}
      className={cx(
        "-my-3 inline-flex min-h-11 items-center gap-2 text-[14px] font-medium leading-5 underline-offset-4 hover:underline",
        tone === "light" ? "text-v3-paper" : "text-v3-navy",
        className,
      )}
    >
      {children}
      <ArrowUpRight aria-hidden="true" strokeWidth={2.2} className="size-3.5 shrink-0" />
    </Link>
  );
}

/** « Télécharger l’app » : ouvre le choix iOS / Android. */
export function DownloadButton({ label = "Télécharger l’app", variant = "primary", block, compact, className }: { label?: string; variant?: ButtonVariant; block?: boolean; compact?: boolean; className?: string }) {
  const { openStores } = useV3UI();
  return (
    <Button variant={variant} block={block} compact={compact} className={className} onClick={openStores} aria-haspopup="dialog">
      {label}
    </Button>
  );
}

/**
 * Paire de boutons « App Store » / « Google Play ».
 * `stacked` : toujours empilés pleine largeur ; `stackOnMobile` : empilés sous 640 px, en ligne au-delà.
 */
export function StoreButtons({ className, stacked = false, stackOnMobile = false }: { className?: string; stacked?: boolean; stackOnMobile?: boolean }) {
  const { openStore } = useV3UI();
  const layout = stacked
    ? "flex-col items-stretch gap-3"
    : stackOnMobile
      ? "flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:gap-4"
      : "flex-wrap items-start gap-4";
  const buttonWidth = stacked ? "w-full" : stackOnMobile ? "w-full sm:w-auto" : undefined;
  return (
    <div className={cx("flex", layout, className)}>
      <Button className={buttonWidth} onClick={() => openStore("ios")}>App Store</Button>
      <Button className={buttonWidth} onClick={() => openStore("android")}>Google Play</Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mise en page                                                         */
/* ------------------------------------------------------------------ */

export type SectionTone = "fond" | "nav" | "surface" | "accent" | "clair";

const SECTION_TONES: Record<SectionTone, string> = {
  fond: "bg-v3-fond text-white",
  nav: "bg-v3-nav text-white",
  surface: "bg-v3-surface text-white",
  accent: "bg-v3-accent text-white",
  clair: "bg-v3-clair text-v3-navy",
};

/**
 * Bande pleine largeur avec gouttières Figma (24 / 40 / 80 px) et contenu
 * plafonné à 1 280 px. `className` s’applique à la bande, `innerClassName` au conteneur.
 */
export function Section({
  tone = "fond",
  as: Tag = "section",
  className,
  innerClassName,
  children,
  id,
  ...rest
}: {
  tone?: SectionTone;
  as?: "section" | "div" | "header" | "aside";
  className?: string;
  innerClassName?: string;
  children: ReactNode;
  id?: string;
} & Omit<ComponentPropsWithoutRef<"section">, "className" | "children" | "id">) {
  return (
    <Tag id={id} className={cx("v3-gutter relative w-full", SECTION_TONES[tone], className)} {...rest}>
      <div className={cx("v3-container relative", innerClassName)}>{children}</div>
    </Tag>
  );
}

/** Sur-titre (14/20 Medium). Lavande sur fond sombre, encre atténuée sur fond clair. */
export function Eyebrow({ children, tone = "dark", className, as: Tag = "p" }: { children: ReactNode; tone?: "dark" | "light"; className?: string; as?: "p" | "span" }) {
  return (
    <Tag className={cx("v3-label", tone === "dark" ? "text-v3-lavender" : "text-v3-ink-muted", className)}>
      {children}
    </Tag>
  );
}

/** Fil d’Ariane en sur-titre : « MMA IQ  /  L’INTELLIGENCE DU COMBAT ». */
export function Breadcrumb({ items, tone = "dark", className }: { items: Array<{ label: string; to?: string }>; tone?: "dark" | "light"; className?: string }) {
  return (
    <nav aria-label="Fil d’Ariane" className={cx("v3-label", tone === "dark" ? "text-v3-lavender" : "text-v3-ink-muted", className)}>
      <ol className="flex flex-wrap items-center gap-x-2">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-x-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.to ? <Link to={item.to} className="hover:underline underline-offset-4">{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Médias                                                               */
/* ------------------------------------------------------------------ */

/**
 * Cadre iPhone titane (composant Figma « MMA IQ V3 / iPhone / Capture réelle »).
 * La capture occupe tout l’écran sans recadrage ; la largeur se règle via `className` (ex. w-[272px]).
 */
export function IPhone({
  src,
  alt,
  caption,
  className,
  captionClassName,
  eager = false,
  width = 1206,
  height = 2622,
}: {
  src: string;
  alt: string;
  caption?: ReactNode;
  className?: string;
  captionClassName?: string;
  eager?: boolean;
  width?: number;
  height?: number;
}) {
  const device = (
    <div className="v3-iphone">
      <span className="v3-iphone__btn v3-iphone__btn--action" aria-hidden="true" />
      <span className="v3-iphone__btn v3-iphone__btn--vol-up" aria-hidden="true" />
      <span className="v3-iphone__btn v3-iphone__btn--vol-down" aria-hidden="true" />
      <span className="v3-iphone__btn v3-iphone__btn--side" aria-hidden="true" />
      <div className="v3-iphone__glass">
        <img
          className="v3-iphone__screen"
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={{ aspectRatio: `${width} / ${height}` }}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
      <span className="v3-iphone__island" aria-hidden="true" />
      <span className="v3-iphone__lens" aria-hidden="true" />
      <span className="v3-iphone__home" aria-hidden="true" />
    </div>
  );
  if (!caption) return <div className={cx("shrink-0", className)}>{device}</div>;
  return (
    <figure className={cx("flex shrink-0 flex-col items-center gap-4", className)}>
      {device}
      <figcaption className={cx("v3-small w-full text-center text-v3-muted", captionClassName)}>{caption}</figcaption>
    </figure>
  );
}

/** Photographie arrondie (rayon carte 16 px par défaut), recadrée en object-cover. */
export function Photo({
  src,
  alt,
  className,
  imgClassName,
  eager = false,
  position,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  /** object-position CSS, ex. "70% 40%". */
  position?: string;
  width?: number;
  height?: number;
}) {
  return (
    <div className={cx("relative overflow-hidden rounded-[16px]", className)}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={cx("absolute inset-0 h-full w-full object-cover", imgClassName)}
        style={position ? { objectPosition: position } : undefined}
      />
    </div>
  );
}

/** Texte sur plusieurs lignes imposées par la maquette ; les retours sont ignorés sur mobile si `desktopOnly`. */
export function Lines({ lines, breakOn = "always" }: { lines: string[]; breakOn?: "always" | "lg" }) {
  return (
    <>
      {lines.map((line, index) => (
        <span key={index}>
          {line}
          {index < lines.length - 1 && (breakOn === "always" ? <br /> : <><br className="hidden lg:block" /><span className="lg:hidden"> </span></>)}
        </span>
      ))}
    </>
  );
}

export { cx };
