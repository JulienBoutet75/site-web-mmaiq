import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { useMmaIqAccount } from "../context/MmaIqAccountContext";
import { Button, ButtonLink, DownloadButton, Section, buttonClass } from "../v3/ui";

// Figma « 12 · Confirmations de paiement » : Essentiel (2114:21461 / 2174:23208),
// Performance (2114:21537 / 2174:23243), Elite (2114:21613 / 2174:23278).
// Les autres états (vérification, attente, erreur…) reprennent la même mise en page.

const PLANS: Record<string, { name: string; credits?: number }> = {
  essentiel: { name: "Essentiel", credits: 30 },
  performance: { name: "Performance", credits: 80 },
  elite: { name: "Elite", credits: 200 },
  coach_suite: { name: "Coach Suite", credits: 150 },
};

// Retour dans l’application après un abonnement (lien universel de l’app).
const APP_RETURN_URL = "https://app.mmaiq.fr/subscription/success";

interface SessionInfo {
  status: string | null;
  paymentStatus: string | null;
  mode: string | null;
  email: string | null;
  planKey: string | null;
  gymCode: string | null;
  kind: string | null;
  formationId: string | null;
  /** false : payé avec un compte qui n'a pas encore de profil dans l'app. */
  profileExists?: boolean | null;
}

// Page de retour Stripe. Avec un session_id (checkout récent), on vérifie
// la session CÔTÉ SERVEUR et on affiche le vrai statut — fini la page
// statique qui disait « paiement réussi » sans rien vérifier.
export function Success() {
  const { authenticated, loading: accountLoading, getAccessToken, login, loginError, loginPending } = useMmaIqAccount();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "pending" | "error" | "auth-required" | "legacy">(
    sessionId ? "loading" : "legacy"
  );

  // Filet de sécurité : si l’initialisation du compte MMA IQ ne répond pas
  // (vérification SSO silencieuse bloquée), on vérifie quand même la session
  // après 8 s ; un abonnement demandera alors la reconnexion (401).
  const [accountWaitExpired, setAccountWaitExpired] = useState(false);
  useEffect(() => {
    if (!accountLoading) return;
    const timer = window.setTimeout(() => setAccountWaitExpired(true), 8000);
    return () => window.clearTimeout(timer);
  }, [accountLoading]);

  useEffect(() => {
    if (!sessionId || (accountLoading && !accountWaitExpired)) return;
    let cancelled = false;
    (async () => {
      try {
        const token = authenticated ? await getAccessToken().catch(() => null) : null;
        const res = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.status === 401) {
          if (!cancelled) setState("auth-required");
          return;
        }
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
        setState(data.status === "complete" && data.paymentStatus === "paid" ? "ok" : "pending");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, [accountLoading, accountWaitExpired, authenticated, getAccessToken, sessionId]);

  const isSubscription = info?.mode === "subscription";
  const isFormation = info?.kind === "formation";
  const plan = info?.planKey ? PLANS[info.planKey] ?? { name: info.planKey } : null;
  const accountEmail = info?.email ? <> (<span className="text-white">{info.email}</span>)</> : null;

  return (
    <>
      <Seo title="Confirmation de paiement — MMA IQ" description="Vérification et confirmation de ton paiement MMA IQ." canonicalPath="/success" />

      {state === "loading" && (
        <Confirmation status="VÉRIFICATION EN COURS" title="Vérification du paiement…" busy>
          <p>Nous vérifions ton paiement auprès de Stripe. Cela ne prend que quelques secondes.</p>
        </Confirmation>
      )}

      {state === "error" && (
        <Confirmation
          status="PAIEMENT NON VÉRIFIÉ"
          title="Session introuvable."
          actions={<ButtonLink to="/contact">Nous contacter</ButtonLink>}
        >
          <p>Impossible de vérifier ce paiement. Si tu as été débité, contacte-nous : on régularise vite.</p>
        </Confirmation>
      )}

      {state === "auth-required" && (
        <Confirmation
          status="CONNEXION REQUISE"
          title="Reconnecte-toi à MMA IQ."
          actions={<Button disabled={loginPending} onClick={() => login().catch(() => {})}>{loginPending ? "Connexion…" : "Se connecter et vérifier"}</Button>}
        >
          <p>Nous devons vérifier que cette session Stripe appartient bien à ton compte.</p>
          {loginError && <p role="alert">{loginError}</p>}
        </Confirmation>
      )}

      {state === "pending" && (
        <Confirmation
          status="PAIEMENT EN ATTENTE"
          title="Paiement en attente."
          actions={<ButtonLink to="/" variant="outline">Retour à l’accueil</ButtonLink>}
        >
          <p>
            Ton paiement n’est pas encore confirmé. Reviens dans quelques minutes ou contacte-nous si
            ça persiste — si tu as annulé, tu peux réessayer quand tu veux.
          </p>
        </Confirmation>
      )}

      {/* Arrivée sans session_id (vieux lien, navigation directe) : on ne peut
          RIEN vérifier — on n'affiche donc jamais « paiement réussi » ici. */}
      {state === "legacy" && (
        <Confirmation
          status="RETOUR DE PAIEMENT"
          title="Retour de paiement."
          actions={
            <>
              <ButtonLink to="/mes-formations">Mes formations</ButtonLink>
              <ButtonLink to="/contact" variant="outline">Un doute ? Contacte-nous</ButtonLink>
            </>
          }
        >
          <p>
            Ce lien ne permet pas de confirmer un paiement. Si tu viens de payer, le reçu Stripe est
            dans ta boîte mail et ton achat est bien enregistré — retrouve tes formations dans{" "}
            <span className="text-white">Mes formations</span>, connecté avec l’email utilisé au paiement.
          </p>
        </Confirmation>
      )}

      {state === "ok" && isSubscription && info?.profileExists === false && (
        <Confirmation
          status="PAIEMENT CONFIRMÉ"
          title="Plus qu’une étape."
          actions={
            <>
              <DownloadButton label="Télécharger MMA IQ" />
              <ButtonLink to="/mon-abonnement" variant="outline">Mon abonnement</ButtonLink>
            </>
          }
        >
          <p>
            {plan ? `Ton abonnement ${plan.name} est confirmé.` : "Ton abonnement est confirmé."}{" "}
            Pour en profiter, crée ton profil dans l’application :
          </p>
          <ol className="list-decimal space-y-1 pl-6">
            <li>Télécharge MMA IQ sur l’App Store ou sur Google Play.</li>
            <li>Choisis «&nbsp;Se connecter&nbsp;» avec ton compte MMA IQ{accountEmail}, pas «&nbsp;Créer un compte&nbsp;».</li>
            <li>Choisis le profil «&nbsp;Pratiquant&nbsp;» et termine ton inscription : ton abonnement{plan?.credits ? ` et tes ${plan.credits} crédits IA mensuels` : ""} s’y rattachent automatiquement.</li>
          </ol>
          <p>Un e-mail de confirmation t’a été envoyé avec ces étapes.</p>
        </Confirmation>
      )}

      {state === "ok" && isSubscription && info?.profileExists !== false && (
        <Confirmation
          status="PAIEMENT CONFIRMÉ"
          title="Paiement confirmé."
          actions={
            <>
              <a href={APP_RETURN_URL} className={buttonClass("primary")}>Ouvrir MMA IQ</a>
              <ButtonLink to="/mon-abonnement" variant="outline">Mon abonnement</ButtonLink>
            </>
          }
        >
          <p>
            {plan ? `Ton abonnement ${plan.name} est confirmé.` : "Ton abonnement est confirmé."}{" "}
            Retrouve tes outils{plan?.credits ? ` et tes ${plan.credits} crédits IA mensuels` : ""} dans
            l’application avec le même compte MMA IQ{accountEmail} : une notification t’y attend.
          </p>
          <p>Un e-mail de confirmation t’a été envoyé.</p>
        </Confirmation>
      )}

      {state === "ok" && !isSubscription && (
        <Confirmation
          status="PAIEMENT CONFIRMÉ"
          title="Paiement confirmé."
          actions={
            // « Mes formations » n'a de sens que pour une formation :
            // un achat boutique n'y apparaît jamais.
            <ButtonLink to={isFormation ? "/mes-formations" : "/academy"}>
              {isFormation ? "Accéder à mes formations" : "Découvrir les formations"}
            </ButtonLink>
          }
        >
          {isFormation ? (
            <p>
              Ton achat est confirmé. Retrouve ta formation à tout moment dans{" "}
              <span className="text-white">Mes formations</span>, connecté avec l’email utilisé au
              paiement{accountEmail}.
            </p>
          ) : (
            <p>Ton achat est confirmé. Merci pour ta confiance !</p>
          )}
        </Confirmation>
      )}
    </>
  );
}

/** Bloc de confirmation Figma : statut, titre, texte (760 px max) et actions. */
export function Confirmation({
  status,
  title,
  children,
  actions,
  busy = false,
}: {
  status: string;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  busy?: boolean;
}) {
  return (
    // La bande remplit l’écran entre navigation et pied de page (pas de raccord de dégradé visible).
    <Section tone="fond" className="min-h-[calc(100svh-308px)] py-12 lg:min-h-[calc(100svh-268px)] lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10" aria-live="polite" aria-busy={busy || undefined}>
      <p className="v3-label text-v3-lavender">{status}</p>
      <h1 className="text-[32px] font-semibold leading-[38px] text-white lg:text-[40px] lg:leading-[46px]">{title}</h1>
      <div className="v3-body flex max-w-[760px] flex-col gap-4 text-v3-muted">{children}</div>
      {actions && <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap">{actions}</div>}
    </Section>
  );
}
