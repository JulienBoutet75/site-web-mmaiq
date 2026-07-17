import { useEffect, useRef, useState, FormEvent } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import {
  Send,
  Mail,
  MessageSquare,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  ArrowRight,
  Tag,
  ChevronDown,
} from "lucide-react";
import { submitLead } from "../lib/supabase";
import { AmbientBackground } from "../components/AmbientBackground";
import { Seo } from "../components/Seo";
import { CONTACT_EMAIL } from "../data/site";
import { textRevealVariant, powerUpVariant } from "../animations";

const MOTIFS = [
  { id: "app", label: "Question sur l'app ou une formation" },
  { id: "partner", label: "Partenariat salle ou club" },
  { id: "presse", label: "Presse" },
  { id: "autre", label: "Autre" },
] as const;

type MotifId = (typeof MOTIFS)[number]["id"];

const INPUT_CLASSES =
  "w-full bg-[var(--color-bg-base)]/50 border border-white/10 rounded-xl px-5 py-4 font-ui text-white focus:border-[var(--color-accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] transition-colors duration-300 placeholder:text-white/55";

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [motif, setMotif] = useState<MotifId>("app");
  const [message, setMessage] = useState("");
  // Honeypot : champ invisible pour les humains, rempli par les bots
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const successTitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === "success") successTitleRef.current?.focus();
  }, [status]);

  // Une saisie après un échec efface l'erreur : l'utilisateur corrige, on repart à zéro
  const withErrorReset = <T,>(setter: (v: T) => void) => (value: T) => {
    if (status === "error") setStatus("idle");
    setter(value);
  };

  const setNameSafe = withErrorReset(setName);
  const setEmailSafe = withErrorReset(setEmail);
  const setMotifSafe = withErrorReset(setMotif);
  const setMessageSafe = withErrorReset(setMessage);

  const resetFields = () => {
    setName("");
    setEmail("");
    setMotif("app");
    setMessage("");
    setWebsite("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    // Bot détecté : on simule le succès sans rien envoyer
    if (website.trim()) {
      resetFields();
      setStatus("success");
      return;
    }

    setStatus("loading");
    const motifLabel = MOTIFS.find((m) => m.id === motif)!.label;
    try {
      if (motif === "partner") {
        // Mêmes conventions que Partenaires.tsx pour rester compatible admin :
        // PartnersCRUD regexe « Contact : » dans le message (le champ name du
        // formulaire Contact est le nom de la personne, pas celui du club).
        await submitLead({
          type: "partner",
          email,
          name,
          message: [
            "Via le formulaire de contact — motif : Partenariat salle ou club",
            name && `Contact : ${name}`,
            message,
          ]
            .filter(Boolean)
            .join("\n\n"),
        });
      } else {
        await submitLead({
          type: "contact",
          email,
          name,
          message: [`Motif : ${motifLabel}`, message].filter(Boolean).join("\n\n"),
        });
      }
      resetFields();
      setStatus("success");
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("error");
    }
  };

  return (
    <div className="bg-[var(--color-bg-base)] text-white pt-32 pb-24 min-h-screen relative overflow-hidden selection:bg-[var(--color-accent-primary)] selection:text-white">
      <Seo
        title="Contact — MMA IQ"
        description="Une question sur l'app, une formation ou un partenariat salle ? Écris-nous, on répond sous 24h ouvrées."
        canonicalPath="/contact"
      />
      <AmbientBackground />

      {/* Hero */}
      <section className="px-6 max-w-3xl mx-auto text-center mb-12 relative z-10">
        <motion.div initial="hidden" animate="visible" variants={textRevealVariant}>
          <Badge color="purple" className="mb-8 bg-white/5 border-white/10 text-white/80 shadow-[0_0_30px_rgba(123,47,255,0.2)]">
            CONTACT
          </Badge>
          <h1 className="font-display text-display-xl mb-6 leading-[1.05] tracking-tight drop-shadow-2xl">
            Une question, une proposition, un{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)]">
              partenariat ?
            </span>
          </h1>
          <p className="font-body text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed">
            On répond sous 24h ouvrées.
          </p>
        </motion.div>
      </section>

      {/* Form */}
      <section className="px-6 max-w-2xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={powerUpVariant}
        >
          {/* Orientation : les salles ont leur propre parcours */}
          <Link
            to="/partenaires"
            className="group flex items-center gap-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-6 py-4 mb-6 hover:border-[var(--color-accent-primary)]/40 transition-colors duration-300"
          >
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="font-body text-sm text-[var(--color-text-secondary)] leading-snug">
              Tu gères un club ou une salle ?{" "}
              <span className="font-ui font-semibold text-white">Découvre le programme partenaires</span>
            </p>
            <ArrowRight className="w-4 h-4 shrink-0 ml-auto text-[var(--color-accent-primary)] group-hover:translate-x-1 transition-transform duration-300" />
          </Link>

          {status === "success" ? (
            <div
              role="status"
              className="bg-white/[0.04] border border-[var(--color-success)]/30 rounded-[2rem] p-8 md:p-12 text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-[var(--color-success)] mx-auto mb-4" />
              <h2
                ref={successTitleRef}
                tabIndex={-1}
                className="font-ui font-bold text-2xl text-white mb-2 focus:outline-none"
              >
                Message envoyé !
              </h2>
              <p className="font-body text-[var(--color-text-secondary)] mb-8">
                Merci, on a bien reçu ton message. On te répond sous 24h ouvrées, par email.
              </p>

              <p className="font-ui font-bold text-xs uppercase tracking-widest text-[var(--color-text-secondary)] mb-4">
                En attendant notre réponse
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                <Link
                  to="/app"
                  className="group flex items-center justify-between gap-3 px-5 py-4 bg-white/[0.04] border border-white/10 rounded-xl font-ui font-semibold text-sm text-white hover:border-[var(--color-accent-primary)]/50 transition-colors duration-300"
                >
                  Découvrir l'app
                  <ArrowRight className="w-4 h-4 text-[var(--color-accent-primary)] group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <Link
                  to="/faq"
                  className="group flex items-center justify-between gap-3 px-5 py-4 bg-white/[0.04] border border-white/10 rounded-xl font-ui font-semibold text-sm text-white hover:border-[var(--color-accent-primary)]/50 transition-colors duration-300"
                >
                  Consulter la FAQ
                  <ArrowRight className="w-4 h-4 text-[var(--color-accent-primary)] group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>

              <button
                onClick={() => setStatus("idle")}
                className="font-ui font-semibold text-sm text-[var(--color-accent-primary)] hover:underline"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form
              className="bg-white/[0.04] border border-white/[0.05] rounded-[2rem] p-8 md:p-12 backdrop-blur-sm shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] relative overflow-hidden group hover:border-[var(--color-accent-primary)]/30 transition-colors duration-500"
              onSubmit={handleSubmit}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(123,47,255,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

              {/* Honeypot anti-spam : invisible et inatteignable pour un humain */}
              <div aria-hidden="true" className="absolute -left-[9999px] top-0 w-px h-px overflow-hidden">
                <label htmlFor="contact-website">Ne pas remplir ce champ</label>
                <input
                  type="text"
                  id="contact-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="space-y-8 relative z-10">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="flex items-center gap-2 font-ui font-semibold text-sm text-white/80"
                  >
                    <User className="w-4 h-4 text-[var(--color-accent-primary)]" /> Nom
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setNameSafe(e.target.value)}
                    className={INPUT_CLASSES}
                    placeholder="Ton nom"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="flex items-center gap-2 font-ui font-semibold text-sm text-white/80"
                  >
                    <Mail className="w-4 h-4 text-[var(--color-accent-primary)]" /> Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmailSafe(e.target.value)}
                    className={INPUT_CLASSES}
                    placeholder="ton@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="motif"
                    className="flex items-center gap-2 font-ui font-semibold text-sm text-white/80"
                  >
                    <Tag className="w-4 h-4 text-[var(--color-accent-primary)]" /> Motif
                  </label>
                  <div className="relative">
                    <select
                      id="motif"
                      required
                      value={motif}
                      onChange={(e) => setMotifSafe(e.target.value as MotifId)}
                      className={`${INPUT_CLASSES} appearance-none pr-12 cursor-pointer`}
                    >
                      {MOTIFS.map((m) => (
                        <option key={m.id} value={m.id} className="bg-[var(--color-bg-base)] text-white">
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)] absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="flex items-center gap-2 font-ui font-semibold text-sm text-white/80"
                  >
                    <MessageSquare className="w-4 h-4 text-[var(--color-accent-primary)]" /> Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    required
                    maxLength={2000}
                    value={message}
                    onChange={(e) => setMessageSafe(e.target.value)}
                    className={`${INPUT_CLASSES} resize-none`}
                    placeholder="Comment peut-on t'aider ?"
                  ></textarea>
                </div>

                {status === "error" && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 text-sm font-ui text-[var(--color-accent-red)] bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/30 rounded-xl px-4 py-3"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      L'envoi a échoué. Réessaie dans un instant, ou écris-nous directement à{" "}
                      <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline">
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </p>
                  </div>
                )}

                {/* Annonce du statut d'envoi aux lecteurs d'écran */}
                <span className="sr-only" role="status">
                  {status === "loading" ? "Envoi du message en cours" : ""}
                </span>

                <Button
                  variant="primary"
                  disabled={status === "loading"}
                  className="w-full py-4 text-lg rounded-xl shadow-[0_0_30px_rgba(123,47,255,0.3)] hover:shadow-[0_0_40px_rgba(123,47,255,0.5)] transition-all duration-300 flex items-center justify-center gap-2 group/btn disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <>
                      Envoi en cours…
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </>
                  ) : (
                    <>
                      Envoyer le message
                      <Send className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </>
                  )}
                </Button>

                <p className="font-body text-xs text-[var(--color-text-secondary)] text-center leading-relaxed">
                  Tes données servent uniquement à te répondre. Jamais partagées, jamais de spam.{" "}
                  <Link to="/confidentialite" className="underline hover:text-white transition-colors">
                    Politique de confidentialité
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* Canal de secours */}
          <p className="font-body text-sm text-[var(--color-text-secondary)] text-center mt-6">
            Tu préfères l'email ? Écris-nous à{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-ui font-semibold text-white underline hover:text-[var(--color-violet-300)] transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </motion.div>
      </section>
    </div>
  );
}
