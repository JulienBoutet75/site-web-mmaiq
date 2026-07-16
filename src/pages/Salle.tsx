import { useState, useEffect, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Bell, CheckCircle2, Loader2, AlertCircle, MapPin, ChevronRight, Percent, QrCode, TrendingUp } from "lucide-react";
import { supabase, submitLead } from "../lib/supabase";
import { saveReferral } from "../lib/referral";
import { createSubscriptionCheckout } from "../services/stripeService";
import { AmbientBackground } from "../components/AmbientBackground";

// Tant que l'app n'est pas lancée, la landing convertit en pré-inscriptions
// (waitlist). Passer VITE_ENABLE_CHECKOUT=true au lancement pour vendre
// l'abonnement web directement (prix fixés côté serveur, remise salle
// appliquée automatiquement au checkout).
const CHECKOUT_ENABLED = import.meta.env.VITE_ENABLE_CHECKOUT === "true";

interface CheckoutPlan {
  key: "essentiel" | "performance" | "elite";
  name: string;
  monthly: string;
  yearly: string;
  tagline: string;
  popular?: boolean;
}

const CHECKOUT_PLANS: CheckoutPlan[] = [
  { key: "essentiel", name: "Essentiel", monthly: "5,99 €", yearly: "59,90 €", tagline: "L'essentiel pour progresser" },
  { key: "performance", name: "Performance", monthly: "9,99 €", yearly: "99,90 €", tagline: "Pour les compétiteurs" },
  { key: "elite", name: "Elite", monthly: "19,99 €", yearly: "199,90 €", tagline: "L'expérience complète", popular: true },
];

interface PartnerPublic {
  name: string;
  slug: string;
  code: string;
  city: string | null;
  logo_url: string | null;
  discount_percent: number;
  discount_months: number;
}

// Landing co-brandée d'une salle partenaire : cible du QR affiché en salle
// et des liens partagés par les coachs. Dépose le code d'attribution puis
// convertit en pré-inscription waitlist taguée (l'app n'est pas encore lancée).
export function Salle() {
  const { slug } = useParams();
  const [partner, setPartner] = useState<PartnerPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subError, setSubError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("partners_public")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (cancelled) return;
      setPartner(data ?? null);
      // Toute navigation ultérieure (ex. /app) reste attribuée à la salle.
      if (data?.code) saveReferral(data.code);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading" || !partner) return;
    setStatus("loading");
    try {
      await submitLead({ type: "waitlist", email, referral_code: partner.code });
      setStatus("success");
      setEmail("");
    } catch (err) {
      console.error("Salle waitlist error:", err);
      setStatus("error");
    }
  };

  const handleSubscribe = async (planKey: "essentiel" | "performance" | "elite") => {
    if (subscribing || !partner) return;
    setSubError(false);
    setSubscribing(planKey);
    try {
      await createSubscriptionCheckout(planKey, interval, partner.code);
      // Redirection vers Stripe : on ne reset pas subscribing.
    } catch (err) {
      console.error("Salle checkout error:", err);
      setSubError(true);
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--color-bg-base)] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="bg-[var(--color-bg-base)] text-white min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-display mb-4 uppercase">Salle introuvable</h1>
          <p className="text-[var(--color-text-secondary)] font-body mb-6">
            Ce lien ne correspond à aucune salle partenaire active.
          </p>
          <Link to="/app" className="text-[var(--color-accent-primary)] hover:underline font-ui font-semibold">
            Découvrir l'application MMA IQ
          </Link>
        </div>
      </div>
    );
  }

  const hasDiscount = partner.discount_percent > 0;

  return (
    <div className="bg-[var(--color-bg-base)] text-white min-h-screen relative overflow-hidden selection:bg-[var(--color-accent-primary)] selection:text-white font-body">
      <AmbientBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(123,47,255,0.18)_0%,transparent_55%)] pointer-events-none z-0"></div>

      {/* Hero co-brandé */}
      <section className="relative z-10 pt-32 pb-16 px-6 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="flex items-center justify-center gap-4 mb-8">
            <img src="/brand/logo.webp" alt="MMA IQ" className="w-14 h-14 object-contain" />
            <span className="font-display text-2xl text-white/40">×</span>
            {partner.logo_url ? (
              <img
                src={partner.logo_url}
                alt={partner.name}
                className="w-14 h-14 object-contain rounded-xl bg-white/5 border border-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="font-display text-2xl uppercase tracking-wide text-white">{partner.name}</span>
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent-primary)] animate-pulse"></span>
            <span className="text-xs font-ui font-bold tracking-widest uppercase text-white">
              Partenaire officiel MMA IQ
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl uppercase leading-[0.95] tracking-wide mb-5">
            Ton club t'ouvre les portes de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)]">
              MMA IQ
            </span>
          </h1>

          {partner.city && (
            <p className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] font-ui text-sm font-semibold mb-6">
              <MapPin className="w-4 h-4" /> {partner.name} · {partner.city}
            </p>
          )}

          <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-xl mx-auto mb-8 leading-relaxed">
            Entraînement, nutrition, cutting, gameplan et analyse vidéo IA :
            l'app tout-en-un du combattant{CHECKOUT_ENABLED ? "." : " arrive sur iOS et Android."}{" "}
            {CHECKOUT_ENABLED
              ? "Abonne-toi via ton club : il touche sa part, tu progresses."
              : "Pré-inscris-toi avec le code de ton club."}
          </p>

          {hasDiscount && (
            <div className="inline-flex items-center gap-3 bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/30 rounded-2xl px-6 py-4 mb-10">
              <Percent className="w-6 h-6 text-[var(--color-accent-primary)] shrink-0" />
              <p className="text-sm sm:text-base font-body text-white text-left">
                <span className="font-bold">−{partner.discount_percent} % pendant {partner.discount_months} mois</span>{" "}
                au lancement, réservé aux membres {partner.name}.
              </p>
            </div>
          )}

          {CHECKOUT_ENABLED ? (
            <>
              {/* Choix mensuel / annuel */}
              <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 mb-8" role="group" aria-label="Facturation">
                {(["monthly", "yearly"] as const).map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInterval(i)}
                    className={`px-5 py-2 rounded-full font-ui text-sm font-bold transition-all ${
                      interval === i ? "bg-[var(--color-accent-primary)] text-white" : "text-[var(--color-text-secondary)] hover:text-white"
                    }`}
                  >
                    {i === "monthly" ? "Mensuel" : "Annuel (−17 %)"}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                {CHECKOUT_PLANS.map((plan) => (
                  <div
                    key={plan.key}
                    className={`relative bg-white/[0.04] border rounded-2xl p-6 flex flex-col ${
                      plan.popular ? "border-[var(--color-accent-primary)]/60 shadow-[0_0_30px_rgba(123,47,255,0.2)]" : "border-white/[0.08]"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--color-accent-primary)] text-white text-[10px] font-ui font-bold uppercase tracking-widest">
                        Populaire
                      </span>
                    )}
                    <h3 className="font-display text-xl uppercase tracking-wide mb-1">{plan.name}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-4">{plan.tagline}</p>
                    <p className="font-display text-3xl mb-5">
                      {interval === "monthly" ? plan.monthly : plan.yearly}
                      <span className="text-sm text-white/50 font-body"> {interval === "monthly" ? "/ mois" : "/ an"}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={subscribing !== null}
                      className="mt-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)] text-white font-ui text-sm font-bold hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
                    >
                      {subscribing === plan.key ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Choisir {plan.name}
                    </button>
                  </div>
                ))}
              </div>

              {hasDiscount && (
                <p className="text-xs text-[var(--color-text-secondary)] font-ui mt-5">
                  La remise −{partner.discount_percent} % ({partner.discount_months} mois) est appliquée automatiquement à l'étape de paiement.
                </p>
              )}

              {subError && (
                <div className="flex items-center justify-center gap-2 text-sm font-body text-white bg-[var(--color-accent-red)]/20 border border-[var(--color-accent-red)]/40 rounded-xl px-4 py-3 max-w-lg mx-auto mt-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Impossible d'ouvrir le paiement. Réessaie dans un instant.
                </div>
              )}
            </>
          ) : (
            <>
              {status === "success" ? (
                <div className="flex items-center justify-center gap-3 max-w-lg mx-auto px-6 py-5 bg-white/10 border border-white/20 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
                  <p className="text-white font-body font-bold text-left">
                    C'est noté ! Tu es rattaché à {partner.name}. On te prévient au lancement.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center items-stretch max-w-lg mx-auto">
                  <label htmlFor="salle-email" className="sr-only">Email</label>
                  <input
                    id="salle-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 font-body focus:outline-none focus:border-white/60 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)] text-white rounded-2xl font-ui font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(123,47,255,0.35)] disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
                    <span>Me pré-inscrire</span>
                  </button>
                </form>
              )}

              {status === "error" && (
                <div className="flex items-center justify-center gap-2 text-sm font-body text-white bg-[var(--color-accent-red)]/20 border border-[var(--color-accent-red)]/40 rounded-xl px-4 py-3 max-w-lg mx-auto mt-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  L'inscription a échoué. Réessaie dans un instant.
                </div>
              )}
            </>
          )}

          <p className="text-xs text-white/40 uppercase tracking-widest font-ui font-bold mt-6">
            Code club : <span className="text-white/70">{partner.code}</span> · Gratuit · Sans engagement
          </p>
        </motion.div>
      </section>

      {/* Ce que ça t'apporte */}
      <section className="relative z-10 px-6 pb-24 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <TrendingUp className="w-5 h-5" />, title: "Progresse entre les cours", desc: "Plans d'entraînement et nutrition périodisés, adaptés à ta discipline." },
            { icon: <QrCode className="w-5 h-5" />, title: "Rattaché à ton club", desc: "Ta pré-inscription soutient directement ta salle et ton coach." },
            { icon: <Percent className="w-5 h-5" />, title: "Avantage membre", desc: hasDiscount ? `−${partner.discount_percent} % pendant ${partner.discount_months} mois au lancement.` : "Des avantages exclusifs réservés aux membres du club." },
          ].map((item) => (
            <div key={item.title} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 text-left">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)] flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="font-display text-lg uppercase tracking-wide mb-2">{item.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-white font-ui text-sm font-semibold bg-white/5 border border-white/10 px-8 py-4 rounded-full hover:bg-[var(--color-accent-primary)] hover:border-[var(--color-accent-primary)] transition-all duration-300 hover:-translate-y-0.5"
          >
            Découvrir l'application en détail <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
