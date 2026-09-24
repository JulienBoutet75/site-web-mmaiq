import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { STORE_URLS } from "../config/stores";
import { useV3UI } from "../v3/V3UIContext";
import { ButtonLink, Eyebrow, Section, buttonClass } from "../v3/ui";

// Figma « Aide · Desktop · Vue complète » (2110:24492) et « Mobile » (2174:22185).
// Les questions sont toutes dépliées dans la maquette : pas d’accordéon.

type Segment = string | { text: string; to: string } | { text: string; store: "ios" | "android" };

type Question = { id?: string; question: string; answer: Segment[] };

const QUESTIONS: Question[] = [
  {
    id: "aide-application",
    question: "Où télécharger MMA IQ ?",
    answer: [
      "L’application est disponible sur ",
      { text: "l’App Store", store: "ios" },
      " et ",
      { text: "Google Play", store: "android" },
      ". Télécharge-la, crée ton profil et choisis les outils adaptés à ta pratique.",
    ],
  },
  {
    id: "aide-abonnement",
    question: "Quelle offre choisir ?",
    answer: [
      "Free permet de commencer gratuitement. Essentiel, Performance et Elite accompagnent différents besoins. Coach Suite est dédiée aux coachs. Compare les fonctionnalités et les crédits sur ",
      { text: "la page Tarifs", to: "/tarifs" },
      ".",
    ],
  },
  {
    question: "Puis-je arrêter mon abonnement ?",
    answer: [
      "Tu peux résilier à tout moment. L’accès reste actif jusqu’à la fin de la période déjà payée. Pour une question sur ta souscription, ",
      { text: "contacte notre équipe", to: "/contact" },
      ".",
    ],
  },
  {
    id: "aide-academy",
    question: "Les formations Academy sont-elles incluses ?",
    answer: [
      "Les tutoriels de l’application dépendent de ton offre. Les formations ",
      { text: "Academy", to: "/academy" },
      " sont des programmes approfondis, vendus séparément à l’unité.",
    ],
  },
  {
    question: "Où retrouver une formation achetée ?",
    answer: [
      "Connecte-toi avec l’adresse e-mail utilisée lors de l’achat, puis ouvre ",
      { text: "Mes formations", to: "/mes-formations" },
      " depuis ton espace.",
    ],
  },
  {
    question: "À quoi servent les crédits ?",
    answer: [
      "Ils te permettent d’utiliser les outils IA selon ton offre. ",
      { text: "La page Crédits", to: "/credits" },
      " présente les dotations mensuelles et le fonctionnement du solde.",
    ],
  },
  {
    id: "aide-club",
    question: "Ma salle est partenaire : comment en profiter ?",
    answer: [
      "Utilise le lien ou le QR code de ton club. La remise de référence est de 10 % sur Performance et Elite ; ses conditions sont précisées par ta salle.",
    ],
  },
  {
    question: "Les contenus sont-ils en français ?",
    answer: ["Oui. L’application et les formations s’adressent aux pratiquants francophones, du débutant au compétiteur."],
  },
];

const TOPICS = [
  { label: "L’application", target: "aide-application" },
  { label: "Mon abonnement", target: "aide-abonnement" },
  { label: "Academy", target: "aide-academy" },
  { label: "Mon club", target: "aide-club" },
];

const plainText = (segments: Segment[]) => segments.map((segment) => (typeof segment === "string" ? segment : segment.text)).join("");

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: QUESTIONS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: plainText(answer) },
  })),
};

const INLINE_LINK =
  "underline decoration-v3-ink-muted/40 underline-offset-4 transition-colors hover:text-v3-navy hover:decoration-v3-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-brand";

function Answer({ segments }: { segments: Segment[] }) {
  const { openStore } = useV3UI();
  return (
    <>
      {segments.map((segment, index) => {
        if (typeof segment === "string") return <Fragment key={index}>{segment}</Fragment>;
        if ("to" in segment) return <Link key={index} to={segment.to} className={INLINE_LINK}>{segment.text}</Link>;
        // Lien (et non bouton) pour que « l’App Store » puisse passer à la ligne comme dans la maquette.
        return (
          <a
            key={index}
            href={STORE_URLS[segment.store] || "#"}
            onClick={(event) => {
              event.preventDefault();
              openStore(segment.store);
            }}
            className={INLINE_LINK}
          >
            {segment.text}
          </a>
        );
      })}
    </>
  );
}

/** Titre « UI title » : 32/38 (mobile) → 40/46 SemiBold (desktop). */
function Title({ as: Tag = "h2", id, className = "", children }: { as?: "h1" | "h2"; id?: string; className?: string; children: ReactNode }) {
  return <Tag id={id} className={`text-[32px] font-semibold leading-[38px] lg:text-[40px] lg:leading-[46px] ${className}`}>{children}</Tag>;
}

export function Aide() {
  return (
    <>
      <Seo
        title="Aide & support — MMA IQ"
        description="Une question sur ton compte, ton abonnement ou tes formations MMA IQ ? Retrouve les réponses utiles ou contacte l’équipe."
        canonicalPath="/aide"
        jsonLd={FAQ_JSON_LD}
      />

      {/* Aide · Introduction */}
      <Section tone="fond" className="py-8 lg:py-12" innerClassName="flex flex-col items-start gap-4">
        <Eyebrow>AIDE &amp; SUPPORT</Eyebrow>
        <Title as="h1" className="text-white lg:max-w-[880px]">On est dans<br />ton coin.</Title>
        <p className="v3-body text-v3-muted lg:max-w-[760px]">
          Une question sur ton compte, ton abonnement ou tes formations ? Trouve le bon point de départ.
        </p>
        <ButtonLink to="/contact">Contacter l’équipe</ButtonLink>
        <nav aria-label="Rubriques de l’aide">
          <ul className="flex flex-col items-start gap-2 lg:flex-row lg:gap-4">
            {TOPICS.map((topic) => (
              <li key={topic.target}>
                <Link to={{ hash: topic.target }} className={buttonClass("primary")}>{topic.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      {/* Questions fréquentes */}
      <Section tone="clair" className="py-8 lg:py-12" innerClassName="flex flex-col gap-4" aria-labelledby="aide-faq-titre">
        <Title id="aide-faq-titre" className="text-v3-navy">Les réponses utiles.</Title>
        <ul className="flex flex-col gap-4">
          {QUESTIONS.map((item) => (
            <li
              key={item.question}
              id={item.id}
              className="flex scroll-mt-[72px] flex-col gap-3 rounded-[16px] bg-white px-4 py-5 text-[18px] leading-7 lg:scroll-mt-[104px] lg:bg-v3-clair lg:p-6"
            >
              <h3 className="font-semibold text-v3-navy lg:max-w-[880px]">{item.question}</h3>
              <p className="text-v3-ink-muted lg:max-w-[880px]"><Answer segments={item.answer} /></p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Contact support */}
      <Section tone="accent" className="py-8 lg:py-12" innerClassName="flex flex-col items-start gap-4">
        <Title className="text-white lg:max-w-[880px]">Besoin d’un coup de main ?</Title>
        <p className="text-[16px] leading-6 text-white lg:max-w-[760px] lg:text-[18px] lg:leading-7">
          <Link to="/contact" className="underline decoration-white/40 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-lavender">Écris-nous</Link>{" "}
          en précisant l’adresse de ton compte et ce qui bloque.
        </p>
      </Section>
    </>
  );
}
