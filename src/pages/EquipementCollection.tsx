import { Navigate, useParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { findEquipementCategorie } from "../data/equipement";
import { CONTACT_EMAIL } from "../data/site";
import { Breadcrumb, ButtonLink, Eyebrow, Section } from "../v3/ui";

// Figma « Fiche collection · Desktop · Vue complète » (2190:22466) et « Mobile » (2190:22543).
// La maquette est commune aux trois catégories : seul le fil d’Ariane, le SEO
// et la catégorie transmise au formulaire de demande changent selon le slug.

const REPERES = [
  {
    title: "Choisir le modèle",
    text: "Précise ta discipline et l’usage prévu. Nous pourrons te renseigner sur les pièces de la collection.",
  },
  {
    title: "Trouver sa taille",
    text: "Indique ta taille habituelle et le modèle qui t’intéresse pour obtenir les repères adaptés.",
  },
  {
    title: "Connaître les conditions",
    text: "Les disponibilités, le prix et les conditions de commande te sont communiqués avant tout engagement.",
  },
];

/** Titre de section : 36/40 Medium −1,08 px sur mobile, 48/54 SemiBold −1 px sur desktop. */
const SECTION_TITLE = "text-[36px] font-medium leading-[40px] tracking-[-1.08px] text-white lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";

export function EquipementCollection() {
  const { slug } = useParams();
  const categorie = findEquipementCategorie(slug);

  // Slug inconnu : retour à la liste de la collection.
  if (!categorie) return <Navigate to="/equipement" replace />;

  return (
    <>
      <Seo
        title={`${categorie.name} Bar Tack × MMA IQ — Équipement MMA IQ`}
        description={categorie.seoDescription}
        canonicalPath={`/equipement/${categorie.slug}`}
      />

      {/* 01 · Pièce et sélection */}
      <section className="v3-first-screen v3-gutter flex w-full flex-col bg-v3-clair py-6 text-v3-navy lg:justify-center lg:py-12">
        <div className="v3-container flex flex-1 flex-col gap-4 lg:flex-none lg:gap-10">
          <Breadcrumb
            tone="light"
            items={[{ label: "ÉQUIPEMENT", to: "/equipement" }, { label: categorie.name.toLocaleUpperCase("fr-FR") }]}
          />
          <div className="flex flex-1 flex-col gap-6 lg:flex-none lg:flex-row lg:items-start lg:gap-16">
            {/* Détails et options (passe au-dessus de la composition sur mobile) */}
            <div className="flex flex-col items-start gap-4 lg:order-2 lg:w-[556px] lg:shrink lg:gap-6">
              <Eyebrow tone="light">BAR TACK × MMA IQ</Eyebrow>
              <h1 className="v3-heading text-v3-navy">Quel équipement<br />recherches-tu ?</h1>
              <p className="v3-body text-v3-ink-muted lg:max-w-[540px]">
                Précise ton besoin et tes coordonnées dans le formulaire de demande.
              </p>
              <ButtonLink to={`/equipement/demande?categorie=${categorie.slug}`}>Préparer ma demande</ButtonLink>
              <p className="v3-small text-v3-ink-muted">
                Une question ?{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline-offset-4 hover:underline focus-visible:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>

            {/* Composition de marque */}
            <div className="flex min-h-[260px] flex-1 flex-col justify-center gap-6 bg-v3-fond px-8 py-6 text-white lg:order-1 lg:min-h-0 lg:w-[660px] lg:flex-none lg:shrink lg:justify-start lg:gap-10 lg:px-16 lg:py-[120px]">
              <p className="v3-label text-v3-lavender">COLLECTION</p>
              <p className="font-['Bebas_Neue'] text-[48px] uppercase leading-[52px] lg:text-[104px] lg:leading-[100px]">
                Bar Tack<br />× MMA IQ
              </p>
              <p className="text-[18px] font-semibold leading-7 text-v3-lavender lg:text-[26px] lg:leading-8">
                Bar Tack × MMA IQ.<br />L’univers de la collection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 02 · Détails et accompagnement */}
      <Section tone="fond" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <Eyebrow>POUR BIEN CHOISIR</Eyebrow>
        <h2 className={SECTION_TITLE}>Les informations utiles<br />avant ta demande.</h2>
        {REPERES.map((repere) => (
          <div key={repere.title} className="contents">
            <div aria-hidden="true" className="h-px w-full bg-v3-border" />
            <div className="flex w-full flex-col gap-10 lg:flex-row">
              <h3 className="v3-subheading text-white lg:w-[440px] lg:shrink-0">{repere.title}</h3>
              <p className="v3-body text-v3-muted lg:max-w-[760px] lg:flex-1">{repere.text}</p>
            </div>
          </div>
        ))}
        <ButtonLink to="/equipement#collection" variant="light">Retour à la collection</ButtonLink>
      </Section>

      {/* 03 · Poursuivre */}
      <Section tone="accent" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <h2 className={SECTION_TITLE}>Une question<br />sur la collection ?</h2>
        <p className="v3-body text-white lg:max-w-[900px]">
          Une demande sur une pièce, une taille ou une commande ? L’équipe MMA IQ est à ton écoute.
        </p>
        <ButtonLink to="/contact">Contacter MMA IQ</ButtonLink>
      </Section>
    </>
  );
}
