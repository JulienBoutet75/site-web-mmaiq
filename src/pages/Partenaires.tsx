import { useMemo, useState, FormEvent } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Loader2, AlertCircle, QrCode, FileSignature, Banknote, ChevronDown } from "lucide-react";
import { submitLead } from "../lib/supabase";
import { AmbientBackground } from "../components/AmbientBackground";
import { TrustBar } from "../components/TrustBar";
import { ACTIVE_PRICING, CLUB_OFFER_REFERENCE, formatEuroCents, isClubDiscountEligible } from "../config/subscriptionCommercial";

const SIM_PLANS = [
  { id: "essentiel", name: "Essentiel", yearlyCents: ACTIVE_PRICING.prices.essentiel.yearlyCents },
  { id: "performance", name: "Performance", yearlyCents: ACTIVE_PRICING.prices.performance.yearlyCents },
  { id: "elite", name: "Elite", yearlyCents: ACTIVE_PRICING.prices.elite.yearlyCents },
] as const;
const VAT_DIVISOR = 1.2;

const FAQ_ITEMS = [
  {
    q: "Qu'est-ce que ça demande à mon club ?",
    a: "Afficher le QR code ou partager le lien avec vos adhérents. Ils créent leur compte et paient directement MMA IQ sur Stripe ; le club n'encaisse pas leur abonnement.",
  },
  {
    q: "Combien de temps dure la commission ?",
    a: "Le simulateur de référence calcule 10 % sur chaque abonnement annuel vendu. La rémunération des renouvellements et sa durée sont précisées dans le contrat du partenariat.",
  },
  {
    q: "Mon club est une association loi 1901, c'est possible ?",
    a: "Oui. Le montage prévu distingue les salles privées, rémunérées par contrat, et les associations sportives, accompagnées dans le cadre d'un contrat de sponsoring adapté à leur situation.",
  },
  {
    q: "Quel engagement je prends ?",
    a: "Le club partage son code ou son QR et les adhérents paient directement MMA IQ sur Stripe. Les conditions de durée, de versement et de fin de partenariat sont fixées dans le contrat.",
  },
  {
    q: "Et mes adhérents, qu'est-ce qu'ils y gagnent ?",
    a: "L'offre de référence prévoit −10 % sur Performance et Elite. La durée exacte de l'avantage est indiquée sur la page du club avant le paiement.",
  },
];

export function Partenaires() {
  const [planId, setPlanId] = useState<(typeof SIM_PLANS)[number]["id"]>("performance");
  const [members, setMembers] = useState(30);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [clubName, setClubName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const plan = SIM_PLANS.find((p) => p.id === planId)!;
  const billedAnnualCents = useMemo(
    () => isClubDiscountEligible(plan.id)
      ? Math.round(plan.yearlyCents * (1 - CLUB_OFFER_REFERENCE.discountPercent / 100))
      : plan.yearlyCents,
    [plan],
  );
  const perMemberCents = useMemo(
    () => Math.round(Math.round(billedAnnualCents / VAT_DIVISOR) * CLUB_OFFER_REFERENCE.clubCommissionRate),
    [billedAnnualCents],
  );
  const annualCommissionCents = useMemo(() => perMemberCents * members, [perMemberCents, members]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      await submitLead({
        type: "partner",
        email,
        name: clubName,
        message: [
          contactName && `Contact : ${contactName}`,
          city && `Ville : ${city}`,
          message,
        ].filter(Boolean).join("\n"),
      });
      setStatus("success");
    } catch (err) {
      console.error("Partner lead error:", err);
      setStatus("error");
    }
  };

  return (
    <div className="bg-[var(--color-bg-base)] text-white min-h-screen relative overflow-hidden selection:bg-[var(--color-accent-primary)] selection:text-white font-body">
      <AmbientBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(123,47,255,0.15)_0%,transparent_50%)] pointer-events-none z-0"></div>

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-16 px-6 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent-primary)] animate-pulse"></span>
            <span className="text-xs font-ui font-bold tracking-widest uppercase">Programme clubs &amp; salles</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl uppercase leading-[0.95] tracking-wide mb-6">
            Vos adhérents progressent.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)]">
              Votre club est payé pour ça.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Recommandez MMA IQ à vos adhérents. La simulation de référence prévoit <strong className="text-white">10 % du montant HT encaissé sur chaque abonnement annuel vendu</strong>.
            Zéro encaissement, zéro administratif, zéro engagement : vous affichez un QR code, on s'occupe du reste.
          </p>
        </motion.div>
      </section>

      {/* Les salles qui ont déjà rejoint le programme — vraie preuve sociale */}
      <TrustBar path="partners.trust.title" defaultTitle="Ils nous font déjà confiance" className="relative z-10 !py-8" />

      {/* Simulateur */}
      <section className="relative z-10 px-6 pb-20 max-w-3xl mx-auto">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[2rem] p-8 sm:p-10">
          <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide mb-8 text-center">
            Combien pour votre club ?
          </h2>

          <div className="flex justify-center gap-2 mb-8" role="group" aria-label="Choix du plan">
            {SIM_PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlanId(p.id)}
                className={`px-5 py-2.5 rounded-full font-ui text-sm font-bold transition-all border ${
                  planId === p.id
                    ? "bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)] text-white shadow-[0_0_20px_rgba(123,47,255,0.4)]"
                    : "bg-white/5 border-white/10 text-[var(--color-text-secondary)] hover:bg-white/10"
                }`}
              >
                {p.name} · {formatEuroCents(p.yearlyCents)} / an
              </button>
            ))}
          </div>

          <label htmlFor="sim-members" className="flex items-center justify-between font-ui text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
            <span>Adhérents abonnés via votre club</span>
            <span className="text-white text-lg font-bold tabular-nums">{members}</span>
          </label>
          <input
            id="sim-members"
            type="range"
            min={5}
            max={150}
            step={5}
            value={members}
            onChange={(e) => setMembers(Number(e.target.value))}
            className="w-full accent-[var(--color-accent-primary)] mb-10"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs font-ui font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-2">Par adhérent / an</p>
              <p className="font-display text-3xl text-white tabular-nums">
                {formatEuroCents(perMemberCents)}
              </p>
            </div>
            <div className="bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/30 rounded-2xl p-5">
              <p className="text-xs font-ui font-bold uppercase tracking-widest text-[var(--color-violet-300)] mb-2">Votre club / an</p>
              <p className="font-display text-3xl text-white tabular-nums">
                {formatEuroCents(annualCommissionCents)}
              </p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs font-ui font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-2">Équivalent mensuel</p>
              <p className="font-display text-3xl text-white tabular-nums">
                {formatEuroCents(Math.round(annualCommissionCents / 12))}
              </p>
            </div>
          </div>

          <p className="flex items-center justify-center gap-2 text-xs text-white/40 font-ui font-semibold uppercase tracking-widest mt-6">
            Simulation sur le HT du catalogue de lancement, remise membre déduite pour Performance et Elite
          </p>
        </div>
      </section>

      {/* 3 étapes */}
      <section className="relative z-10 px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide mb-10 text-center">
          Trois étapes, dix minutes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <FileSignature className="w-5 h-5" />, step: "1", title: "On signe ensemble", desc: "Un contrat d'apporteur d'affaires de deux pages, signé en rendez-vous. Votre code et votre page club sont créés dans la minute." },
            { icon: <QrCode className="w-5 h-5" />, step: "2", title: "Vous affichez le QR", desc: "Affiche fournie, prête à imprimer. Vos adhérents scannent, s'inscrivent, et sont rattachés à votre club automatiquement." },
            { icon: <Banknote className="w-5 h-5" />, step: "3", title: "Vous êtes payé", desc: "La référence est de 10 % du HT encaissé sur l'abonnement annuel vendu. Les modalités de versement figurent dans votre contrat." },
          ].map((item) => (
            <div key={item.step} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)] flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="font-display text-2xl text-white/20">0{item.step}</span>
              </div>
              <h3 className="font-display text-lg uppercase tracking-wide mb-2">{item.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 px-6 pb-20 max-w-3xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide mb-8 text-center">
          Questions fréquentes
        </h2>
        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left font-ui font-semibold text-sm sm:text-base hover:bg-white/[0.03] transition-colors"
              >
                {item.q}
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <p className="px-6 pb-5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Formulaire de candidature */}
      <section id="devenir-partenaire" className="relative z-10 px-6 pb-32 max-w-2xl mx-auto scroll-mt-24">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[2rem] p-8 sm:p-10">
          <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide mb-3 text-center">
            Devenir club partenaire
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-8">
            Laissez vos coordonnées, on vous rappelle sous 48 h pour tout mettre en place.
          </p>

          {status === "success" ? (
            <div className="flex items-center justify-center gap-3 px-6 py-5 bg-white/10 border border-white/20 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
              <p className="text-white font-body font-bold">
                Bien reçu ! On revient vers vous très vite pour lancer le partenariat.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="p-club" className="sr-only">Nom du club</label>
                  <input
                    id="p-club" type="text" required value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="Nom du club *"
                    className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/40 font-body focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="p-city" className="sr-only">Ville</label>
                  <input
                    id="p-city" type="text" value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ville"
                    className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/40 font-body focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="p-contact" className="sr-only">Votre nom</label>
                  <input
                    id="p-contact" type="text" value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/40 font-body focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="p-email" className="sr-only">Email</label>
                  <input
                    id="p-email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email *"
                    className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/40 font-body focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="p-message" className="sr-only">Message</label>
                <textarea
                  id="p-message" value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Parlez-nous de votre club (disciplines, nombre d'adhérents…)"
                  rows={4}
                  className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/40 font-body focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)] text-white rounded-2xl font-ui font-bold text-lg hover:scale-[1.02] transition-all duration-300 shadow-[0_0_40px_rgba(123,47,255,0.35)] disabled:opacity-60 disabled:hover:scale-100"
              >
                {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Devenir partenaire
              </button>
              {status === "error" && (
                <div className="flex items-center justify-center gap-2 text-sm font-body text-white bg-[var(--color-accent-red)]/20 border border-[var(--color-accent-red)]/40 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  L'envoi a échoué. Réessayez dans un instant.
                </div>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
