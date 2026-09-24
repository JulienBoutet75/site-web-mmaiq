/**
 * Gabarit commun des documents légaux (Figma « 09 · Informations légales » :
 * Mentions légales 2114:6870 / 2174:22615, Confidentialité 2114:20335 / 2174:22684,
 * CGV 2114:20512 / 2174:22765). Seule la mise en page vient de la maquette :
 * le texte juridique reste celui des pages (source : src/data/legal.ts).
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import { SITE_URL } from "../../data/site";
import { ButtonLink, Section, type ButtonVariant } from "../../v3/ui";

export type LegalSection = { id: string; title: string };

const ARTICLE_TITLE = "text-[32px] font-semibold leading-[38px] text-v3-navy lg:text-[40px] lg:leading-[46px]";
const LINK = "underline decoration-1 underline-offset-4 transition-colors hover:text-v3-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-brand";

export function LegalDocument({
  title,
  preamble,
  sections,
  related,
  children,
}: {
  title: string;
  preamble: ReactNode;
  sections: LegalSection[];
  related: Array<{ label: string; to: string; variant?: ButtonVariant }>;
  children: ReactNode;
}) {
  const summary = (
    <ol className="flex flex-col gap-3">
      {sections.map((section) => (
        <li key={section.id}>
          <a href={`#${section.id}`} className="underline-offset-4 transition-colors hover:text-v3-navy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-brand">{section.title}</a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      {/* 01 · En-tête du document */}
      <Section tone="clair" className="py-8 lg:py-12" innerClassName="flex flex-col gap-4">
        <p className="v3-small text-v3-ink-muted">INFORMATIONS LÉGALES</p>
        <h1 className="text-[32px] font-semibold leading-[38px] text-v3-navy lg:max-w-[880px] lg:text-[40px] lg:leading-[46px]">{title}</h1>
        <p className="v3-body text-v3-ink-muted">MMA IQ · {SITE_URL}</p>
        <p className="v3-small text-v3-ink-muted lg:max-w-[880px]">{preamble}</p>
      </Section>

      {/* 02 · Lecture du document : sommaire + articles */}
      <Section tone="clair" className="pb-10 lg:pb-14" innerClassName="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
        <nav aria-label="Dans ce document" className="v3-small text-v3-ink-muted lg:sticky lg:top-[128px] lg:w-[280px] lg:shrink-0">
          {/* Mobile : sommaire replié sur une ligne */}
          <details className="group lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-1 marker:content-none [&::-webkit-details-marker]:hidden">
              DANS CE DOCUMENT · {sections.length} SECTIONS
              <ArrowDown aria-hidden="true" strokeWidth={1.7} className="size-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3">{summary}</div>
          </details>
          <div className="hidden flex-col gap-3 lg:flex">
            <p>DANS CE DOCUMENT</p>
            {summary}
          </div>
        </nav>

        <div className="flex min-w-0 flex-col gap-8 lg:max-w-[880px] lg:flex-1 lg:gap-10">{children}</div>
      </Section>

      {/* 03 · Autres documents */}
      <Section tone="clair" className="pb-12 lg:pb-[72px]" innerClassName="flex flex-col gap-4">
        <hr className="h-px border-0 bg-v3-border" />
        <p className="v3-label text-v3-ink-muted">POUR POURSUIVRE</p>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap">
          {related.map((link) => (
            <ButtonLink key={link.to} to={link.to} variant={link.variant ?? "primary"}>{link.label}</ButtonLink>
          ))}
        </div>
      </Section>
    </>
  );
}

/** Article numéroté : titre 40/46 (32/38 mobile), paragraphes 18/28 séparés d’une ligne. */
export function LegalArticle({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titre`} className="flex scroll-mt-[88px] flex-col gap-4 lg:scroll-mt-[128px]">
      <h2 id={`${id}-titre`} className={ARTICLE_TITLE}>{title}</h2>
      <div className="v3-body flex flex-col gap-7 text-v3-ink-muted [overflow-wrap:anywhere]">{children}</div>
    </section>
  );
}

/** Liste à puces « • » de la maquette, une ligne vide entre chaque entrée. */
export function Bullets({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-7 [&>li]:before:content-['•_']">{children}</ul>;
}

/** Lien dans le corps du texte (interne ou mailto). */
export function TextLink({ to, href, children }: { to?: string; href?: string; children: ReactNode }) {
  if (to) return <Link to={to} className={LINK}>{children}</Link>;
  return <a href={href} className={LINK}>{children}</a>;
}

/** Champ à compléter avant mise en ligne : surligné pour ne pas passer inaperçu. */
export function Todo({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[4px] bg-[#fff1c2] px-1 font-medium text-[#6b4e00] [box-decoration-break:clone]">
      [À COMPLÉTER : {children}]
    </span>
  );
}
