import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Stripe initialization
  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        console.warn("⚠️ STRIPE_SECRET_KEY is missing. Stripe integration will fail.");
        return null;
      }
      stripe = new Stripe(key);
    }
    return stripe;
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    const { items, successUrl, cancelUrl, metadata } = req.body;
    const stripeClient = getStripe();

    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }

    try {
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: items.map((item: any) => ({
          price_data: {
            currency: "eur",
            product_data: {
              name: item.name,
              images: item.image ? [item.image] : [],
              description: item.description,
            },
            unit_amount: Math.round(item.price * 100), // in cents
          },
          quantity: item.quantity || 1,
        })),
        mode: "payment",
        success_url: successUrl || `${process.env.APP_URL}/success`,
        cancel_url: cancelUrl || `${process.env.APP_URL}/cancel`,
        metadata: metadata || {},
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ── Abonnements (programme salles, Phase 1) ─────────────────────
  // Les prix sont résolus CÔTÉ SERVEUR par lookup_key Stripe (créés par
  // scripts/stripe-bootstrap.mjs) : le client ne choisit qu'une clé de
  // plan, jamais un montant. Le code salle voyage dans la metadata de
  // l'abonnement et se propage à toutes les factures futures — c'est lui
  // qui portera la commission récurrente (webhook lab-service).
  const PLAN_KEYS = ["essentiel", "performance", "elite", "coach_suite"] as const;
  const INTERVALS = ["monthly", "yearly"] as const;
  const GYM_CODE_PATTERN = /^[A-Z0-9]{3,14}$/;
  const priceCache = new Map<string, string>(); // lookup_key -> price id

  const resolvePrice = async (stripeClient: Stripe, lookupKey: string) => {
    const cached = priceCache.get(lookupKey);
    if (cached) return cached;
    const prices = await stripeClient.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    const price = prices.data[0];
    if (!price) return null;
    priceCache.set(lookupKey, price.id);
    return price.id;
  };

  app.post("/api/create-subscription-checkout", async (req, res) => {
    const { planKey, interval, gymCode } = req.body ?? {};
    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    if (!PLAN_KEYS.includes(planKey) || !INTERVALS.includes(interval)) {
      return res.status(400).json({ error: "Plan ou intervalle invalide" });
    }

    const code =
      typeof gymCode === "string" && GYM_CODE_PATTERN.test(gymCode.toUpperCase())
        ? gymCode.toUpperCase()
        : null;

    try {
      const priceId = await resolvePrice(stripeClient, `${planKey}_${interval}`);
      if (!priceId) {
        return res.status(500).json({ error: "Prix introuvable — lancer scripts/stripe-bootstrap.mjs" });
      }

      const origin = req.get("origin") || process.env.APP_URL || "http://localhost:3000";
      const base: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cancel`,
        ...(code ? { client_reference_id: code } : {}),
        subscription_data: {
          metadata: { gym_code: code ?? "", channel: code ? "gym" : "direct", plan_key: planKey },
        },
        metadata: { gym_code: code ?? "", plan_key: planKey },
      };

      // Remise adhérent : le code promo Stripe porte le même nom que le
      // code salle. S'il existe, on l'applique automatiquement ; sinon le
      // champ code promo reste saisissable dans le Checkout.
      let session: Stripe.Checkout.Session;
      const promo = code
        ? (await stripeClient.promotionCodes.list({ code, active: true, limit: 1 })).data[0]
        : undefined;
      try {
        session = await stripeClient.checkout.sessions.create(
          promo
            ? { ...base, discounts: [{ promotion_code: promo.id }] }
            : { ...base, allow_promotion_codes: true }
        );
      } catch (err) {
        // Ex. restriction "premier achat" refusée pour un client connu :
        // on retombe sur un checkout sans remise auto plutôt que d'échouer.
        if (!promo) throw err;
        session = await stripeClient.checkout.sessions.create({ ...base, allow_promotion_codes: true });
      }

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe subscription checkout error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Statut d'une session pour la page /success (aucune donnée sensible).
  app.get("/api/checkout-session", async (req, res) => {
    const stripeClient = getStripe();
    const sessionId = req.query.session_id;
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return res.status(400).json({ error: "session_id invalide" });
    }
    try {
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);
      res.json({
        status: session.status,
        paymentStatus: session.payment_status,
        mode: session.mode,
        email: session.customer_details?.email ?? null,
        planKey: session.metadata?.plan_key ?? null,
        gymCode: session.metadata?.gym_code || null,
        amountTotal: session.amount_total,
        currency: session.currency,
      });
    } catch (error: any) {
      console.error("Stripe session retrieve error:", error);
      res.status(404).json({ error: "Session introuvable" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
