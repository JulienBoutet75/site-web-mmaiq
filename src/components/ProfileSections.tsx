import type { ReactNode } from "react";
import { Photo, Section, cx } from "../v3/ui";

// Briques communes des pages profil V3 (Figma « 02 · Choisir son profil » :
// Pratiquant, Combattant, Coach, Partenaire). Les quatre maquettes partagent
// le même premier écran, les mêmes titres de section et la même bande d’action.

/** Titre de section : 36/40 Medium −1,08 px sur mobile → MMA IQ V2/Heading (48/54 SemiBold −1 px) sur desktop. */
export const PROFILE_HEADING =
  "text-[36px] font-medium leading-10 tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";

/** Chiffre clé des cartes (ex. « 10 % ») : DM Sans 32/38 sur mobile, Bebas Neue 104/100 (MMA IQ V2/Display) sur desktop. */
export const KEY_FIGURE =
  "text-[32px] font-semibold leading-[38px] lg:font-['Bebas_Neue',sans-serif] lg:text-[104px] lg:font-normal lg:leading-[100px]";

/**
 * 01 · Premier écran : promesse Bebas 48/52 → 96/94 à gauche, photographie à droite.
 * Mobile : la photo occupe la hauteur restante sous le texte (comme la maquette 390).
 */
export function ProfileHero({
  eyebrow,
  title,
  intro,
  action,
  note,
  image,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  action: ReactNode;
  note: ReactNode;
  image: { src: string; alt: string; width: number; height: number; position?: string };
}) {
  return (
    <section className="v3-first-screen v3-gutter flex w-full flex-col bg-v3-fond py-6 text-white lg:py-[72px]">
      <div className="v3-container flex flex-1 flex-col justify-center gap-6 lg:flex-row lg:justify-start lg:gap-10">
        <div className="flex min-w-0 flex-col items-start gap-4 lg:flex-[0_1_608px] lg:justify-center lg:gap-6">
          <p className="v3-label text-v3-lavender">{eyebrow}</p>
          <h1 className="v3-display text-[48px] leading-[52px] text-v3-paper lg:text-[96px] lg:leading-[94px]">{title}</h1>
          <p className="text-[16px] leading-6 text-v3-muted lg:max-w-[550px] lg:text-[18px] lg:leading-7">{intro}</p>
          {action}
          <p className="v3-small text-v3-muted">{note}</p>
        </div>
        <Photo
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          position={image.position}
          eager
          className="min-h-[120px] w-full flex-1 lg:w-auto lg:flex-[0_1_592px]"
        />
      </div>
    </section>
  );
}

/** Trois colonnes titre (26/32) + texte (18/28), 400 px chacune sur desktop, empilées sur mobile. */
export function ProfileFeatures({ items, tone }: { items: Array<{ title: string; text: string }>; tone: "light" | "dark" }) {
  return (
    <ul className="grid gap-10 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.title} className="flex flex-col gap-4">
          <h3 className={cx("v3-subheading", tone === "light" ? "text-v3-navy" : "text-v3-paper")}>{item.title}</h3>
          <p className={cx("v3-body lg:max-w-[380px]", tone === "light" ? "text-v3-ink-muted" : "text-v3-muted")}>{item.text}</p>
        </li>
      ))}
    </ul>
  );
}

/** 04 · Passer à l’action : bande Accent, titre, phrase et deux boutons (empilés sur mobile). */
export function ProfileActionBand({ title, intro, children }: { title: ReactNode; intro: ReactNode; children: ReactNode }) {
  return (
    <Section tone="accent" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
      <h2 className={cx(PROFILE_HEADING, "text-white")}>{title}</h2>
      <p className="v3-body text-white lg:max-w-[760px]">{intro}</p>
      <div className="flex flex-col items-start gap-4 sm:flex-row">{children}</div>
    </Section>
  );
}
