import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Seo } from "../components/Seo";
import { EQUIPEMENT_CATEGORIES } from "../data/equipement";
import { ButtonLink, Eyebrow, Section, buttonClass } from "../v3/ui";

// Figma « Équipement · Desktop · Vue complète » (2190:22213) et « Mobile » (2190:22341).

const QUESTIONS = [
  {
    title: "Tailles & choix du modèle",
    text: "Écris-nous en précisant la pièce qui t’intéresse et ton usage. Nous pourrons t’orienter dans la collection.",
  },
  {
    title: "Disponibilité & commande",
    text: "Retrouve les informations propres à chaque pièce sur sa fiche, ou contacte-nous pour préparer ta demande.",
  },
];

/** Titre de section clair : 36/40 Medium −1,08 px sur mobile, 48/54 SemiBold −1 px sur desktop. */
const SECTION_TITLE = "text-[36px] font-medium leading-[40px] tracking-[-1.08px] text-v3-navy lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";

export function Equipement() {
  // Filtre de la collection : « Tout » ou le slug d’une catégorie.
  const [filter, setFilter] = useState<string>("tout");
  const visible = filter === "tout" ? EQUIPEMENT_CATEGORIES : EQUIPEMENT_CATEGORIES.filter((categorie) => categorie.slug === filter);
  const filters = [{ slug: "tout", name: "Tout" }, ...EQUIPEMENT_CATEGORIES];

  return (
    <>
      <Seo
        title="Équipement Bar Tack × MMA IQ — L’esprit MMA IQ sur toi"
        description="Vêtements, protections et accessoires Bar Tack × MMA IQ. Découvre la collection et contacte-nous pour connaître les modèles, les tailles et les disponibilités."
        canonicalPath="/equipement"
      />

      {/* 01 · Introduction */}
      <section className="v3-first-screen v3-gutter flex w-full flex-col justify-center bg-v3-fond py-6 text-white lg:py-10">
        <div className="v3-container flex flex-col items-start gap-4 lg:gap-6">
          <Eyebrow>BAR TACK × MMA IQ</Eyebrow>
          <h1 className="font-['Bebas_Neue'] text-[48px] font-normal uppercase leading-[52px] text-white lg:text-[72px] lg:leading-[76px]">
            L’esprit MMA IQ.<br />Sur toi.
          </h1>
          <div className="flex w-full flex-col items-start gap-10 lg:flex-row">
            <p className="text-[16px] leading-6 text-v3-muted lg:w-[720px] lg:shrink lg:text-[18px] lg:leading-7">
              Découvre l’univers de la collection et contacte-nous pour connaître les modèles disponibles.
            </p>
            <ButtonLink to="/equipement#collection">Découvrir la collection</ButtonLink>
          </div>

          {/* V3 · Bar Tack × MMA IQ — manifeste */}
          <div className="flex w-full flex-col gap-6 p-6 lg:flex-row lg:items-center lg:gap-16 lg:p-10">
            <div className="flex w-full flex-col gap-4 lg:w-[720px] lg:shrink lg:gap-6">
              <p className="v3-label text-v3-lavender">LA COLLECTION</p>
              <p className="font-['Bebas_Neue'] text-[48px] leading-[52px] text-white lg:text-[104px] lg:leading-[100px]">
                BAR TACK<br />× MMA IQ
              </p>
              <div aria-hidden="true" className="h-px w-full rounded-[16px] bg-v3-lavender opacity-40" />
            </div>
            <div className="flex w-full flex-col gap-4 lg:w-[416px] lg:shrink-0">
              <ul className="text-[18px] leading-7 text-white">
                {EQUIPEMENT_CATEGORIES.map((categorie) => (
                  <li key={categorie.slug}>{categorie.name}</li>
                ))}
              </ul>
              <p className="v3-small text-v3-muted">Les modèles, les tailles et les disponibilités sont précisés avant ta commande.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 02 · Collection et catégories */}
      <Section
        tone="clair"
        id="collection"
        className="scroll-mt-[72px] py-12 lg:scroll-mt-[104px] lg:py-[72px]"
        innerClassName="flex flex-col items-start gap-6 lg:gap-10"
      >
        <Eyebrow tone="light">LA COLLECTION</Eyebrow>
        <h2 className={SECTION_TITLE}>Trouve ta prochaine pièce.</h2>
        <p className="v3-body text-v3-ink-muted lg:max-w-[900px]">
          Vêtements, protections, accessoires : trois façons de prolonger l’esprit MMA IQ.
        </p>
        <div role="group" aria-label="Filtrer la collection par catégorie" className="flex flex-wrap gap-4">
          {filters.map((item) => {
            const active = filter === item.slug;
            return (
              <button
                key={item.slug}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item.slug)}
                className={buttonClass(active ? "primary" : "light")}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        <ul className="flex w-full flex-col gap-6 lg:gap-10" aria-live="polite">
          {visible.map((categorie) => (
            <li key={categorie.slug} className="flex flex-col gap-6 lg:gap-10">
              <div aria-hidden="true" className="h-px w-full bg-v3-border" />
              <div className="flex flex-col items-start gap-6 lg:flex-row">
                <p className="v3-label shrink-0 text-v3-ink-muted">{categorie.number}</p>
                <div className="flex w-full flex-col gap-4 lg:max-w-[850px] lg:flex-1">
                  <h3 className="v3-heading text-v3-navy">{categorie.name}</h3>
                  <p className="v3-body text-v3-ink-muted lg:max-w-[800px]">{categorie.text}</p>
                </div>
                <Link
                  to={`/equipement/${categorie.slug}`}
                  aria-label={`Découvrir la collection ${categorie.name}`}
                  className={buttonClass("light")}
                >
                  Découvrir
                  {/* Glyphe « ↗ » de la maquette : tracé visible d’environ 9 px, à 8 px du texte */}
                  <ArrowUpRight aria-hidden="true" strokeWidth={2.4} className="-mx-[6px] size-5 shrink-0" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* 03 · La collaboration */}
      <Section tone="accent" className="py-12 lg:py-[72px]" innerClassName="flex flex-col gap-20 lg:flex-row">
        <div className="flex flex-col gap-8 lg:max-w-[600px] lg:flex-1">
          <p className="v3-label text-white">UNE MÊME CULTURE DU COMBAT</p>
          <h2 className="v3-heading text-white">Bar Tack<br />× MMA IQ</h2>
        </div>
        <div className="flex flex-col items-start gap-6 lg:max-w-[600px] lg:flex-1">
          <p className="v3-body text-white">
            Une collaboration qui relie notre univers à ce que tu portes. Découvre la collection et échange avec nous pour trouver une pièce adaptée à ta pratique.
          </p>
          <ButtonLink to="/equipement#collection">Découvrir une pièce</ButtonLink>
          <ButtonLink to="/equipement/demande" variant="light">Une question sur la collection ?</ButtonLink>
        </div>
      </Section>

      {/* 04 · Bien choisir sa pièce */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <h2 className={SECTION_TITLE}>Une question avant de choisir ?</h2>
        {QUESTIONS.map((question) => (
          <div key={question.title} className="contents">
            <div aria-hidden="true" className="h-px w-full bg-v3-border" />
            <h3 className="v3-subheading text-v3-navy">{question.title}</h3>
            <p className="v3-body text-v3-ink-muted lg:max-w-[1000px]">{question.text}</p>
          </div>
        ))}
        <ButtonLink to="/contact">Contacter MMA IQ</ButtonLink>
      </Section>
    </>
  );
}
