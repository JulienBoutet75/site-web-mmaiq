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

export async function createCheckoutSession(items: any[], metadata: any = {}) {
  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
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
