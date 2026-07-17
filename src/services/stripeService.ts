/// <reference types="vite/client" />
import { loadStripe, Stripe } from "@stripe/stripe-js";

// Chargé à la demande : évite une IntegrationError au chargement de
// chaque page quand la clé publishable n'est pas configurée.
let stripePromise: Promise<Stripe | null> | null = null;
export function getStripe() {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

// Abonnement (programme salles) : le serveur choisit le prix par lookup_key,
// le client n'envoie qu'une clé de plan + le code salle pour l'attribution.
export async function createSubscriptionCheckout(
  planKey: "essentiel" | "performance" | "elite" | "coach_suite",
  interval: "monthly" | "yearly",
  gymCode?: string | null
) {
  const response = await fetch("/api/create-subscription-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planKey, interval, gymCode: gymCode || undefined }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Impossible de créer la session d'abonnement");
  }
  const { url } = await response.json();
  if (url) window.location.href = url;
}

// Boutique : le client n'envoie plus que des identifiants produit et des
// quantités — les prix sont résolus côté serveur (jamais côté client).
export async function createCheckoutSession(
  items: { productId: string; quantity: number }[],
  metadata: Record<string, any> = {}
) {
  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: items.map(({ productId, quantity }) => ({ productId, quantity })),
        metadata,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/cancel`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create checkout session");
    }

    const { url } = await response.json();
    if (url) {
      window.location.href = url;
    }
  } catch (error) {
    console.error("Checkout error:", error);
    throw error;
  }
}

// Achat d'une formation à l'unité : le serveur résout le prix depuis la
// table formations, le client n'envoie que l'identifiant.
export async function createFormationCheckout(formationId: string, accessToken: string) {
  const response = await fetch("/api/create-formation-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ formationId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Impossible de créer la session de paiement");
  }
  const { url } = await response.json();
  if (url) window.location.href = url;
}

// Déblocage d'une formation par code d'accès : la validation se fait
// exclusivement côté serveur (le code n'est jamais comparé côté client).
export async function redeemAccessCode(
  formationId: string,
  code: string,
  accessToken: string
): Promise<{ ok: boolean; reason?: string }> {
  const response = await fetch("/api/redeem-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ formationId, code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, reason: data.reason || data.error || "server-error" };
  }
  return { ok: !!data.ok, reason: data.reason };
}

// URL de lecture d'une vidéo (teaser ou chapitre) : le serveur contrôle
// les droits et renvoie une URL signée (ou l'URL stockée en mode dégradé).
export async function getVideoUrl(
  formationId: string,
  target: string,
  accessToken: string
): Promise<{ url: string; kind: string }> {
  const response = await fetch("/api/video-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ formationId, target }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Impossible de récupérer l'URL de la vidéo");
  }
  return response.json();
}
