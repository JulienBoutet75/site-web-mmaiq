/**
 * E-mails du cycle de vie d'un abonnement payé sur mmaiq.fr. Chaque modèle
 * reçoit des données déjà lues chez Stripe et renvoie le contenu à mettre en
 * page ({@link renderEmail}). Textes à ajuster ici.
 */
import { formatEuroCents, PLAN_DETAILS } from "../../src/config/subscriptionCommercial";
import type { EmailBlock, EmailContent } from "./layout";

export type BillingInterval = "monthly" | "yearly";

export interface SubscriptionEmailData {
  email: string;
  planName: string;
  credits: number;
  interval: BillingInterval;
  /** Prix de la formule (hors remise), en centimes. */
  amountCents: number | null;
  /** Montant réellement prélevé, pour les reçus. */
  paidCents?: number | null;
  nextBillingDate?: Date | null;
  /** Fin de l'accès (résiliation programmée, fin d'abonnement). */
  accessUntil?: Date | null;
  /** Le compte avait un profil dans l'app au moment du paiement. */
  hasAppProfile: boolean;
  previousPlanName?: string | null;
  previousCredits?: number | null;
  discount?: { percent: number; endsAt: Date | null } | null;
  invoiceUrl?: string | null;
  payUrl?: string | null;
}

export interface SubscriptionEmailLinks {
  siteUrl: string;
  manageUrl: string;
  /** Lien universel : ouvre l'app si elle est installée. */
  appUrl: string;
}

const LONG_DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
const formatDate = (date?: Date | null) => (date ? LONG_DATE.format(date) : "—");
const perPeriod = (interval: BillingInterval) => (interval === "yearly" ? "an" : "mois");
const price = (data: SubscriptionEmailData) =>
  data.amountCents != null ? `${formatEuroCents(data.amountCents)} / ${perPeriod(data.interval)}` : "—";

function planFacts(data: SubscriptionEmailData, withNextDate = true): EmailBlock {
  const rows: Array<[string, string]> = [
    ["Formule", data.planName],
    ["Prix", price(data)],
    ["Crédits IA", `${data.credits} par mois`],
  ];
  if (data.discount && data.discount.percent > 0) {
    rows.push([
      "Remise club",
      data.discount.endsAt ? `−${data.discount.percent}\u00a0% jusqu'au ${formatDate(data.discount.endsAt)}` : `−${data.discount.percent}\u00a0%`,
    ]);
  }
  if (withNextDate && data.nextBillingDate) rows.push(["Prochain prélèvement", formatDate(data.nextBillingDate)]);
  return { kind: "facts", rows };
}

function openAppBlocks(data: SubscriptionEmailData, links: SubscriptionEmailLinks): EmailBlock[] {
  if (data.hasAppProfile) {
    return [{ kind: "button", label: "Ouvrir MMA IQ", href: links.appUrl }];
  }
  return [
    {
      kind: "steps",
      title: "Dernière étape : ton profil dans l'app",
      items: [
        "Télécharge MMA IQ sur l'App Store ou sur Google Play.",
        `Choisis «\u00a0Se connecter\u00a0» avec ton adresse ${data.email}, pas «\u00a0Créer un compte\u00a0».`,
        "Choisis le profil « Pratiquant » et termine ton inscription : ton abonnement s'y rattache automatiquement.",
      ],
    },
    { kind: "button", label: "Télécharger MMA IQ", href: `${links.siteUrl}/application` },
  ];
}

export const subscriptionEmails = {
  started(data: SubscriptionEmailData, links: SubscriptionEmailLinks): EmailContent {
    return {
      subject: `Bienvenue dans MMA IQ ${data.planName}`,
      preheader: `Ton abonnement est actif : ${data.credits} crédits IA par mois t'attendent.`,
      eyebrow: "ABONNEMENT ACTIVÉ",
      title: `Bienvenue dans ${data.planName}.`,
      blocks: [
        {
          kind: "paragraph",
          text: `Ton abonnement ${data.planName} est actif. Tes outils et tes ${data.credits} crédits IA par mois t'attendent dans l'application MMA IQ.`,
        },
        planFacts(data),
        ...openAppBlocks(data, links),
        { kind: "link", before: "Ton espace abonnement :", label: "voir mon abonnement", href: links.manageUrl },
        ...(data.invoiceUrl ? [{ kind: "link", before: "Ton reçu :", label: "voir le reçu", href: data.invoiceUrl } as EmailBlock] : []),
        {
          kind: "note",
          text: "Tu peux changer de formule ou résilier à tout moment depuis ton espace abonnement. Une résiliation prend effet à la fin de la période payée.",
        },
      ],
    };
  },

  planChanged(data: SubscriptionEmailData, links: SubscriptionEmailLinks): EmailContent {
    const upgrade = (data.previousCredits ?? 0) < data.credits;
    const from = data.previousPlanName ?? "ton ancienne formule";
    return {
      subject: `Tu passes à MMA IQ ${data.planName}`,
      preheader: upgrade
        ? `Tes nouveaux outils sont prêts, avec ${data.credits} crédits IA par mois.`
        : `Ta formule est modifiée : ${data.credits} crédits IA par mois.`,
      eyebrow: "FORMULE MODIFIÉE",
      title: `Tu passes à ${data.planName}.`,
      blocks: [
        {
          kind: "paragraph",
          text: upgrade
            ? `C'est fait : ta formule passe de ${from} à ${data.planName}. Tes nouveaux outils sont disponibles tout de suite, avec ${data.credits} crédits IA par mois.`
            : `C'est fait : ta formule passe de ${from} à ${data.planName}. Tu disposes désormais de ${data.credits} crédits IA par mois.`,
        },
        {
          kind: "facts",
          rows: [
            ["Avant", data.previousCredits != null ? `${from} · ${data.previousCredits} crédits` : from],
            ["Maintenant", `${data.planName} · ${data.credits} crédits`],
            ["Prix", price(data)],
            ...(data.nextBillingDate ? [["Prochain prélèvement", formatDate(data.nextBillingDate)] as [string, string]] : []),
          ],
        },
        {
          kind: "paragraph",
          text: upgrade
            ? "La différence, calculée au prorata du temps restant sur ta période, est réglée aujourd'hui : ton reçu est dans ton espace abonnement."
            : "La différence, calculée au prorata du temps restant sur ta période, est déduite de tes prochains prélèvements.",
        },
        { kind: "button", label: "Ouvrir MMA IQ", href: links.appUrl },
        { kind: "link", before: "Détails et factures :", label: "mon abonnement", href: links.manageUrl },
      ],
    };
  },

  cancellationScheduled(data: SubscriptionEmailData, links: SubscriptionEmailLinks): EmailContent {
    const until = formatDate(data.accessUntil);
    return {
      subject: `Ton abonnement ${data.planName} s'arrêtera le ${until}`,
      preheader: `Tu gardes ton accès et tes crédits jusqu'au ${until}. Aucun prélèvement ne suivra.`,
      eyebrow: "RÉSILIATION PROGRAMMÉE",
      title: `C'est noté : ${data.planName} s'arrête le ${until}.`,
      blocks: [
        {
          kind: "paragraph",
          text: `Tu gardes l'accès à ${data.planName} et à tes crédits IA jusqu'au ${until}. Aucun prélèvement ne suivra.`,
        },
        {
          kind: "paragraph",
          text: `Ensuite, ton compte repasse en Free (${PLAN_DETAILS.free.creditsPerMonth} crédits IA par mois) : ton profil, tes séances et ton historique restent là.`,
        },
        { kind: "button", label: "Garder mon abonnement", href: links.manageUrl },
        {
          kind: "note",
          text: `Tu as changé d'avis ? Tu peux réactiver ton abonnement jusqu'au ${until}, sans nouveau paiement d'ici là.`,
        },
      ],
    };
  },

  cancellationReverted(data: SubscriptionEmailData, links: SubscriptionEmailLinks): EmailContent {
    return {
      subject: `Ton abonnement ${data.planName} continue`,
      preheader: `Résiliation annulée : prochain prélèvement le ${formatDate(data.nextBillingDate)}.`,
      eyebrow: "RÉSILIATION ANNULÉE",
      title: "Ravi de te garder.",
      blocks: [
        {
          kind: "paragraph",
          text: `Ta résiliation est annulée : ton abonnement ${data.planName} continue normalement.`,
        },
        planFacts(data),
        { kind: "button", label: "Ouvrir MMA IQ", href: links.appUrl },
      ],
    };
  },

  ended(data: SubscriptionEmailData, links: SubscriptionEmailLinks): EmailContent {
    const free = PLAN_DETAILS.free.creditsPerMonth;
    return {
      subject: `Ton abonnement ${data.planName} est terminé`,
      preheader: `Ton compte repasse en Free, avec ${free} crédits IA par mois.`,
      eyebrow: "ABONNEMENT TERMINÉ",
      title: `Ton abonnement ${data.planName} est terminé.`,
      blocks: [
        {
          kind: "paragraph",
          text: `Ton compte repasse en Free : ${free} crédits IA par mois, un plan d'entraînement, un plan nutrition et un tutoriel technique. Ton profil et ton historique sont conservés.`,
        },
        { kind: "paragraph", text: "Tu peux reprendre un abonnement à tout moment, tes outils reviennent aussitôt." },
        { kind: "button", label: "Voir les formules", href: `${links.siteUrl}/tarifs` },
      ],
    };
  },

  paymentFailed(data: SubscriptionEmailData, links: SubscriptionEmailLinks): EmailContent {
    const amount = data.paidCents != null ? formatEuroCents(data.paidCents) : price(data);
    return {
      subject: "Ton paiement MMA IQ n'est pas passé",
      preheader: `Ton accès ${data.planName} est suspendu en attendant le paiement.`,
      eyebrow: "PAIEMENT REFUSÉ",
      title: "Ton paiement n'est pas passé.",
      blocks: [
        {
          kind: "paragraph",
          text: `Le prélèvement de ${amount} pour ton abonnement ${data.planName} a été refusé par ta banque. En attendant, ton accès ${data.planName} est suspendu.`,
        },
        {
          kind: "paragraph",
          text: "Règle la facture ou mets à jour ta carte : ton accès revient dès que le paiement est accepté.",
        },
        { kind: "button", label: "Régler ma facture", href: data.payUrl ?? links.manageUrl },
        { kind: "link", before: "Changer de carte :", label: "mon abonnement", href: links.manageUrl },
      ],
    };
  },

  paymentRecovered(data: SubscriptionEmailData, links: SubscriptionEmailLinks): EmailContent {
    const amount = data.paidCents != null ? formatEuroCents(data.paidCents) : price(data);
    return {
      subject: "Paiement reçu : ton accès MMA IQ est rétabli",
      preheader: `Ton accès ${data.planName} est de nouveau ouvert.`,
      eyebrow: "PAIEMENT REÇU",
      title: "C'est réglé.",
      blocks: [
        { kind: "paragraph", text: `Merci ! Ton paiement de ${amount} est bien passé : ton accès ${data.planName} est rétabli.` },
        planFacts(data),
        { kind: "button", label: "Ouvrir MMA IQ", href: links.appUrl },
        ...(data.invoiceUrl ? [{ kind: "link", before: "Ton reçu :", label: "voir le reçu", href: data.invoiceUrl } as EmailBlock] : []),
      ],
    };
  },

  renewed(data: SubscriptionEmailData, links: SubscriptionEmailLinks): EmailContent {
    return {
      subject: `Ton abonnement ${data.planName} est renouvelé`,
      preheader: `Un nouveau cycle commence : ${data.credits} crédits IA par mois.`,
      eyebrow: "RENOUVELLEMENT",
      title: "Un nouveau cycle commence.",
      blocks: [
        {
          kind: "paragraph",
          text: `Ton abonnement ${data.planName} est renouvelé pour ${data.interval === "yearly" ? "un an" : "un mois"}. Merci de ta confiance.`,
        },
        {
          kind: "facts",
          rows: [
            ["Montant prélevé", data.paidCents != null ? formatEuroCents(data.paidCents) : price(data)],
            ["Crédits IA", `${data.credits} par mois`],
            ["Prochain prélèvement", formatDate(data.nextBillingDate)],
          ],
        },
        ...(data.invoiceUrl ? [{ kind: "button", label: "Voir le reçu", href: data.invoiceUrl } as EmailBlock] : []),
        { kind: "link", before: "Changer de formule ou résilier :", label: "mon abonnement", href: links.manageUrl },
      ],
    };
  },

  annualReminder(data: SubscriptionEmailData, links: SubscriptionEmailLinks): EmailContent {
    const date = formatDate(data.nextBillingDate);
    return {
      subject: `Ton abonnement annuel ${data.planName} se renouvelle le ${date}`,
      preheader: `Renouvellement automatique pour ${price(data)}. Tu peux le résilier avant.`,
      eyebrow: "RAPPEL DE RENOUVELLEMENT",
      title: `Renouvellement le ${date}.`,
      blocks: [
        {
          kind: "paragraph",
          text: `Ton abonnement annuel ${data.planName} se renouvellera automatiquement le ${date}, pour ${data.amountCents != null ? formatEuroCents(data.amountCents) : "le tarif en vigueur"}.`,
        },
        {
          kind: "paragraph",
          text: "Si tu ne souhaites pas le reconduire, résilie-le avant cette date depuis ton espace abonnement : tu garderas l'accès jusqu'au bout de ta période.",
        },
        { kind: "button", label: "Gérer mon abonnement", href: links.manageUrl },
      ],
    };
  },
} satisfies Record<string, (data: SubscriptionEmailData, links: SubscriptionEmailLinks) => EmailContent>;

export type SubscriptionEmailKind = keyof typeof subscriptionEmails;

/** Données d'exemple pour l'aperçu des modèles (/api/dev/email-templates). */
export function sampleEmailData(kind: SubscriptionEmailKind): SubscriptionEmailData {
  const inAMonth = new Date(Date.now() + 30 * 86400000);
  const base: SubscriptionEmailData = {
    email: "julien@exemple.fr",
    planName: "Performance",
    credits: 80,
    interval: "monthly",
    amountCents: 1099,
    paidCents: 1099,
    nextBillingDate: inAMonth,
    accessUntil: inAMonth,
    hasAppProfile: kind !== "started",
    invoiceUrl: "https://invoice.stripe.com/i/exemple",
    payUrl: "https://invoice.stripe.com/i/exemple",
  };
  if (kind === "planChanged") return { ...base, planName: "Elite", credits: 200, amountCents: 2099, previousPlanName: "Performance", previousCredits: 80 };
  if (kind === "annualReminder") return { ...base, interval: "yearly", amountCents: 10999 };
  if (kind === "started") return { ...base, discount: { percent: 10, endsAt: new Date(Date.now() + 90 * 86400000) } };
  return base;
}
