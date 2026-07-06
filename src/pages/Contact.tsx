import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Send, Mail, MessageSquare, User, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { insertData } from "../lib/supabase";

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      await insertData("leads", { type: "contact", name, email, message });
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("error");
    }
  };

  return (
    <div className="bg-[#04050A] text-white pt-32 pb-24 min-h-screen selection:bg-[var(--color-accent-purple)] selection:text-white">
      {/* Hero */}
      <section className="px-6 max-w-3xl mx-auto text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(123,47,255,0.08)_0%,transparent_50%)] pointer-events-none blur-3xl"></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10"
        >
          <Badge color="purple" className="mb-8 bg-white/5 border-white/10 text-white/80 shadow-[0_0_30px_rgba(123,47,255,0.2)]">
            CONTACT
          </Badge>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-8 leading-[1.1] tracking-tighter drop-shadow-2xl">
            Une question, une proposition, un{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-magenta)]">
              partenariat ?
            </span>
          </h1>
          <p className="font-body text-lg md:text-xl text-white/60 mb-12 leading-relaxed">
            On répond vite.
          </p>
        </motion.div>
      </section>

      {/* Form */}
      <section className="px-6 max-w-2xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          {status === "success" ? (
            <div className="bg-white/[0.04] border border-[var(--color-success)]/30 rounded-[2rem] p-8 md:p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-[var(--color-success)] mx-auto mb-4" />
              <h2 className="font-ui font-bold text-2xl text-white mb-2">Message envoyé !</h2>
              <p className="font-body text-white/70 mb-8">
                Merci, on a bien reçu ton message. On te répond au plus vite par email.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="font-ui font-semibold text-sm text-[var(--color-accent-purple)] hover:underline"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form
              className="bg-white/[0.04] border border-white/[0.05] rounded-[2rem] p-8 md:p-12 backdrop-blur-sm shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] relative overflow-hidden group hover:border-[var(--color-accent-purple)]/30 transition-colors duration-500"
              onSubmit={handleSubmit}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(123,47,255,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

              <div className="space-y-8 relative z-10">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="flex items-center gap-2 font-ui font-semibold text-sm text-white/80"
                  >
                    <User className="w-4 h-4 text-[var(--color-accent-purple)]" /> Nom
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#04050A]/50 border border-white/10 rounded-xl px-5 py-4 font-ui text-white/90 focus:outline-none focus:border-[var(--color-accent-purple)] focus:ring-1 focus:ring-[var(--color-accent-purple)]/50 transition-all duration-300 placeholder:text-white/40"
                      placeholder="Ton nom"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="flex items-center gap-2 font-ui font-semibold text-sm text-white/80"
                  >
                    <Mail className="w-4 h-4 text-[var(--color-accent-purple)]" /> Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#04050A]/50 border border-white/10 rounded-xl px-5 py-4 font-ui text-white/90 focus:outline-none focus:border-[var(--color-accent-purple)] focus:ring-1 focus:ring-[var(--color-accent-purple)]/50 transition-all duration-300 placeholder:text-white/40"
                      placeholder="ton@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="flex items-center gap-2 font-ui font-semibold text-sm text-white/80"
                  >
                    <MessageSquare className="w-4 h-4 text-[var(--color-accent-purple)]" /> Message
                  </label>
                  <div className="relative">
                    <textarea
                      id="message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-[#04050A]/50 border border-white/10 rounded-xl px-5 py-4 font-ui text-white/90 focus:outline-none focus:border-[var(--color-accent-purple)] focus:ring-1 focus:ring-[var(--color-accent-purple)]/50 transition-all duration-300 resize-none placeholder:text-white/40"
                      placeholder="Comment peut-on t'aider ?"
                    ></textarea>
                  </div>
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 text-sm font-ui text-[var(--color-accent-red)] bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/30 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    L'envoi a échoué. Réessaie dans un instant.
                  </div>
                )}

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
              </div>
            </form>
          )}
        </motion.div>
      </section>
    </div>
  );
}
