import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, AlertCircle, Smartphone, Mail } from "lucide-react";
import { Button } from "../components/ui/Button";
import { motion } from "motion/react";

const PLAN_NAMES: Record<string, string> = {
  essentiel: "Essentiel",
  performance: "Performance",
  elite: "Elite",
  coach_suite: "Coach Suite",
};

interface SessionInfo {
  status: string | null;
  paymentStatus: string | null;
  mode: string | null;
  email: string | null;
  planKey: string | null;
  gymCode: string | null;
  kind: string | null;
  formationId: string | null;
}

// Page de retour Stripe. Avec un session_id (checkout récent), on vérifie
// la session CÔTÉ SERVEUR et on affiche le vrai statut — fini la page
// statique qui disait « paiement réussi » sans rien vérifier.
export function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "pending" | "error" | "legacy">(
    sessionId ? "loading" : "legacy"
  );

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`);
        if (!res.ok) throw new Error("Session introuvable");
        const data: SessionInfo = await res.json();
        if (cancelled) return;
        setInfo(data);
        // Achat de formation : on confirme côté serveur AVANT d'afficher le
        // CTA « Accéder à mes formations » — confirm-purchase est l'écrivain
        // principal de purchases (upsert idempotent), un clic immédiat
        // tomberait sinon sur une page vide. En cas d'échec on affiche quand
        // même le succès : le webhook Stripe sert de rattrapage en prod.
        if (data.kind === "formation") {
          try {
            await fetch("/api/confirm-purchase", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId }),
            });
          } catch {
            // silencieux : la confirmation arrivera par le webhook
          }
        }
        if (cancelled) return;
        setState(data.status === "complete" && data.paymentStatus !== "unpaid" ? "ok" : "pending");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  const isSubscription = info?.mode === "subscription";
  const isFormation = info?.kind === "formation";
  const planName = info?.planKey ? PLAN_NAMES[info.planKey] ?? info.planKey : null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[var(--color-bg-surface)] border border-[var(--color-accent-primary)]/30 rounded-[2rem] p-10 text-center shadow-[0_0_50px_rgba(123,47,255,0.2)]"
      >
        {state === "loading" && (
          <>
            <div className="w-12 h-12 mx-auto mb-6 rounded-full border-2 border-white/10 border-t-[var(--color-accent-primary)] animate-spin"></div>
            <p className="text-[var(--color-text-secondary)]">Vérification du paiement…</p>
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-3xl font-display mb-4">Session introuvable</h1>
            <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
              Impossible de vérifier ce paiement. Si tu as été débité, contacte-nous : on régularise vite.
            </p>
            <Link to="/contact">
              <Button className="w-full py-4 rounded-xl bg-[var(--color-accent-primary)]">Nous contacter</Button>
            </Link>
          </>
        )}

        {state === "pending" && (
          <>
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-400">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-3xl font-display mb-4">Paiement en attente</h1>
            <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
              Ton paiement n'est pas encore confirmé. Reviens dans quelques minutes ou
              contacte-nous si ça persiste — si tu as annulé, tu peux réessayer quand tu veux.
            </p>
            <Link to="/">
              <Button variant="outline" className="w-full py-4 rounded-xl border-white/10 hover:bg-white/5">
                Retour à l'accueil
              </Button>
            </Link>
          </>
        )}

        {(state === "ok" || state === "legacy") && (
          <>
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
              <CheckCircle2 size={40} />
            </div>

            {state === "ok" && isSubscription ? (
              <>
                <h1 className="text-3xl font-display mb-2">Abonnement activé !</h1>
                {planName && (
                  <p className="text-[var(--color-accent-primary)] font-ui font-bold uppercase tracking-widest text-sm mb-6">
                    Plan {planName}
                  </p>
                )}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-left space-y-3">
                  <p className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
                    <Smartphone className="w-5 h-5 shrink-0 text-[var(--color-accent-primary)]" />
                    <span>Télécharge l'app MMA IQ (iOS / Android) dès sa sortie.</span>
                  </p>
                  <p className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
                    <Mail className="w-5 h-5 shrink-0 text-[var(--color-accent-primary)]" />
                    <span>
                      Crée ton compte avec <strong className="text-white">exactement cet email</strong>
                      {info?.email && <> : <strong className="text-white">{info.email}</strong></>} — c'est lui
                      qui débloque ton abonnement dans l'app.
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-display mb-4">Paiement réussi !</h1>
                {/* « Mes formations » n'a de sens que pour une formation :
                    un achat boutique n'y apparaît jamais. */}
                {isFormation ? (
                  <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
                    Ton achat est confirmé. Retrouve ta formation à tout moment dans{" "}
                    <strong className="text-white">Mes formations</strong>, connecté avec l'email
                    utilisé au paiement{info?.email && <> (<strong className="text-white">{info.email}</strong>)</>}.
                  </p>
                ) : (
                  <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
                    Ton achat est confirmé. Merci pour ta confiance !
                  </p>
                )}
              </>
            )}

            <div className="space-y-4">
              {state === "legacy" || !isSubscription ? (
                <Link to={isFormation ? "/mes-formations" : "/instructional"}>
                  <Button className="w-full py-4 rounded-xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] flex items-center justify-center gap-2">
                    {isFormation ? "Accéder à mes formations" : "Découvrir les formations"}
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              ) : (
                <Link to="/app">
                  <Button className="w-full py-4 rounded-xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] flex items-center justify-center gap-2">
                    Découvrir l'application
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              )}
              <Link to="/">
                <Button variant="outline" className="w-full py-4 rounded-xl border-white/10 hover:bg-white/5">
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
