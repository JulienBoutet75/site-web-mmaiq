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

  // Le webhook Stripe exige le corps BRUT pour vérifier la signature :
  // on saute express.json() pour cette seule route (déclarée en express.raw).
  const jsonParser = express.json();
  app.use((req, res, next) => {
    if (req.path === "/api/stripe-webhook") return next();
    return jsonParser(req, res, next);
  });

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

  // Message renvoyé au client quand Stripe échoue : jamais le message
  // brut de l'API (fuite d'infos) — le détail reste dans les logs serveur.
  const CHECKOUT_UNAVAILABLE = "Paiement momentanément indisponible, réessaie dans un instant.";

  // ── Supabase REST (fetch natif, pas de SDK côté serveur) ────────
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!SERVICE_ROLE_KEY) {
    console.warn(
      "⚠️ SUPABASE_SERVICE_ROLE_KEY manquante — mode dégradé : confirmation d'achats et codes d'accès inactifs, vidéos servies sans URL signée."
    );
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("⚠️ STRIPE_WEBHOOK_SECRET manquant — /api/stripe-webhook répondra 501.");
  }

  // Requête REST avec la clé anon (mêmes droits que le navigateur).
  // Un header Authorization passé dans init écrase celui par défaut
  // (utile pour requêter avec le jeton de l'utilisateur → RLS).
  const sbAnon = (restPath: string, init: RequestInit = {}) =>
    fetch(`${SUPABASE_URL}${restPath}`, {
      ...init,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

  // Requête REST avec la service role (bypass RLS — serveur uniquement).
  const sbService = (restPath: string, init: RequestInit = {}) =>
    fetch(`${SUPABASE_URL}${restPath}`, {
      ...init,
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

  // Vérifie le jeton Supabase envoyé en Authorization: Bearer <token>.
  // Retourne { user, token } ou null si absent/invalide.
  const getUserFromRequest = async (req: express.Request) => {
    const header = req.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) return null;
    try {
      const resp = await sbAnon("/auth/v1/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return null;
      const user: any = await resp.json();
      return user?.id ? { user, token } : null;
    } catch {
      return null;
    }
  };

  // L'utilisateur a-t-il un achat complété pour cette formation ?
  // Avec service role → lecture directe ; sinon mode dégradé : on requête
  // purchases avec le jeton de l'élève (la RLS « own purchases » l'autorise).
  const hasCompletedPurchase = async (userId: string, formationId: string, userToken: string) => {
    const query = `/rest/v1/purchases?user_id=eq.${encodeURIComponent(userId)}&formation_id=eq.${encodeURIComponent(formationId)}&status=eq.completed&select=id&limit=1`;
    const resp = SERVICE_ROLE_KEY
      ? await sbService(query)
      : await sbAnon(query, { headers: { Authorization: `Bearer ${userToken}` } });
    if (!resp.ok) return false;
    const rows: any = await resp.json();
    return Array.isArray(rows) && rows.length > 0;
  };

  // Rôle du profil (admin / super_admin / coach / null). La RLS « own
  // profile » permet la lecture avec le jeton de l'utilisateur lui-même.
  const getProfileRole = async (userId: string, userToken: string) => {
    const query = `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`;
    const resp = SERVICE_ROLE_KEY
      ? await sbService(query)
      : await sbAnon(query, { headers: { Authorization: `Bearer ${userToken}` } });
    if (!resp.ok) return null;
    const rows: any = await resp.json();
    return rows?.[0]?.role ?? null;
  };

  // Un coach n'est privilégié QUE sur ses propres formations : une ligne
  // coaches doit relier son profil (coaches.profile_id = user) à la
  // formation (coaches.id = formation.coach_id). Requête service role ;
  // sans elle, impossible à vérifier → fail closed (non privilégié),
  // l'achat reste le chemin d'accès.
  const isCoachOfFormation = async (userId: string, formationId: string) => {
    if (!SERVICE_ROLE_KEY) return false;
    const formationResp = await sbService(
      `/rest/v1/formations?id=eq.${encodeURIComponent(formationId)}&select=coach_id&limit=1`
    );
    if (!formationResp.ok) return false;
    const formations: any = await formationResp.json();
    const coachId = formations?.[0]?.coach_id;
    if (!coachId) return false;
    const coachResp = await sbService(
      `/rest/v1/coaches?id=eq.${encodeURIComponent(coachId)}&profile_id=eq.${encodeURIComponent(userId)}&select=id&limit=1`
    );
    if (!coachResp.ok) return false;
    const coaches: any = await coachResp.json();
    return Array.isArray(coaches) && coaches.length > 0;
  };

  // Upsert idempotent d'un achat (clé naturelle : stripe_session_id).
  // Appelé par /api/confirm-purchase ET le webhook — le premier arrivé insère.
  const recordPurchaseFromSession = async (session: Stripe.Checkout.Session) => {
    if (!SERVICE_ROLE_KEY) return { ok: false as const, reason: "server-not-configured" };
    const userId = session.metadata?.user_id;
    const formationId = session.metadata?.formation_id;
    if (!userId || !formationId) return { ok: false as const, reason: "missing-metadata" };

    const existingQuery = `/rest/v1/purchases?stripe_session_id=eq.${encodeURIComponent(session.id)}&select=id&limit=1`;
    const existing = await sbService(existingQuery);
    if (existing.ok && ((await existing.json()) as any[]).length > 0) {
      return { ok: true as const, formationId };
    }

    const inserted = await sbService("/rest/v1/purchases", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        formation_id: formationId,
        status: "completed",
        stripe_session_id: session.id,
        amount_cents: session.amount_total ?? 0,
      }),
    });
    if (!inserted.ok) {
      // Course possible webhook/confirm : si la ligne existe désormais, tout va bien.
      const recheck = await sbService(existingQuery);
      if (recheck.ok && ((await recheck.json()) as any[]).length > 0) {
        return { ok: true as const, formationId };
      }
      console.error("Insertion purchases échouée:", await inserted.text());
      return { ok: false as const, reason: "insert-failed" };
    }
    return { ok: true as const, formationId };
  };

  // Une URL publique Storage (…/object/public/<bucket>/<path>) est signée
  // pour 1 h via la service role. Toute autre URL (YouTube…) est renvoyée
  // telle quelle. Sans service role → fallback sur l'URL stockée.
  const STORAGE_PUBLIC_RE = /\/storage\/v1\/object\/public\/([^/?]+)\/([^?]+)/;
  const signStorageUrl = async (storedUrl: string) => {
    const match = storedUrl.match(STORAGE_PUBLIC_RE);
    if (!match) return { url: storedUrl, kind: "external" as const };
    if (!SERVICE_ROLE_KEY) return { url: storedUrl, kind: "public-fallback" as const };
    const [, bucket, filePath] = match;
    try {
      const resp = await sbService(`/storage/v1/object/sign/${bucket}/${filePath}`, {
        method: "POST",
        body: JSON.stringify({ expiresIn: 3600 }),
      });
      if (!resp.ok) {
        console.error("Signature Storage échouée:", await resp.text());
        return { url: storedUrl, kind: "public-fallback" as const };
      }
      const data: any = await resp.json();
      const signedPath = data?.signedURL || data?.signedUrl;
      if (!signedPath) return { url: storedUrl, kind: "public-fallback" as const };
      return { url: `${SUPABASE_URL}/storage/v1${signedPath}`, kind: "signed" as const };
    } catch (error) {
      console.error("Signature Storage échouée:", error);
      return { url: storedUrl, kind: "public-fallback" as const };
    }
  };

  // Anti open redirect : le client ne fournit que des CHEMINS relatifs
  // ('/…' mais pas '//…'), préfixés ici par l'origin. Toute URL absolue
  // ou invalide retombe sur le chemin par défaut.
  const safeReturnUrl = (value: unknown, origin: string, fallbackPath: string) =>
    typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
      ? `${origin}${value}`
      : `${origin}${fallbackPath}`;

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Checkout Session (boutique) — le client n'envoie que des
  // identifiants produits : nom, prix et image sont résolus ICI depuis
  // la table products (price_cents = centimes, jamais un montant client).
  app.post("/api/create-checkout-session", async (req, res) => {
    const { items, successUrl, cancelUrl, metadata } = req.body ?? {};
    const stripeClient = getStripe();

    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items requis ([{productId, quantity}])" });
    }

    try {
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      for (const item of items) {
        const productId = item?.productId;
        if (typeof productId !== "string" || !productId) {
          return res.status(400).json({ error: "productId manquant" });
        }
        const quantity = Math.min(Math.max(Math.trunc(Number(item?.quantity)) || 1, 1), 99);

        const resp = await sbAnon(
          `/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=id,name,description,price_cents,images,available&limit=1`
        );
        const rows: any = resp.ok ? await resp.json() : [];
        const product = rows?.[0];
        if (!product || product.available === false || !product.price_cents) {
          return res.status(400).json({ error: "Produit indisponible" });
        }

        lineItems.push({
          price_data: {
            currency: "eur",
            product_data: {
              name: product.name,
              ...(product.images?.[0] ? { images: [product.images[0]] } : {}),
              ...(product.description ? { description: product.description } : {}),
            },
            unit_amount: product.price_cents, // déjà en centimes
          },
          quantity,
        });
      }

      // Metadata : seules les valeurs scalaires passent (Stripe exige des strings).
      const safeMetadata: Record<string, string> = {};
      if (metadata && typeof metadata === "object") {
        for (const [key, value] of Object.entries(metadata)) {
          if (["string", "number", "boolean"].includes(typeof value)) {
            safeMetadata[key] = String(value);
          }
        }
      }

      const origin = req.get("origin") || process.env.APP_URL || "http://localhost:3000";
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: safeReturnUrl(successUrl, origin, "/success"),
        cancel_url: safeReturnUrl(cancelUrl, origin, "/cancel"),
        metadata: safeMetadata,
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: CHECKOUT_UNAVAILABLE });
    }
  });

  // ── Formations (achat à l'unité) ────────────────────────────────
  // Le prix est résolu CÔTÉ SERVEUR depuis la table formations : le
  // client n'envoie qu'un formationId, jamais un montant. La metadata
  // {kind, formation_id, user_id} permet au webhook et à confirm-purchase
  // d'enregistrer l'achat dans purchases.
  app.post("/api/create-formation-checkout", async (req, res) => {
    const { formationId } = req.body ?? {};
    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    if (typeof formationId !== "string" || !formationId) {
      return res.status(400).json({ error: "formationId requis" });
    }

    const auth = await getUserFromRequest(req);
    if (!auth) {
      return res.status(401).json({ error: "Connexion requise" });
    }

    try {
      const resp = await sbAnon(
        `/rest/v1/formations?id=eq.${encodeURIComponent(formationId)}&select=id,title,price_cents,thumbnail_url,published,slug&limit=1`
      );
      const rows: any = resp.ok ? await resp.json() : [];
      const formation = rows?.[0];
      if (!formation || formation.published === false) {
        return res.status(404).json({ error: "Formation introuvable" });
      }
      if (!formation.price_cents) {
        return res.status(400).json({ error: "Formation sans prix — achat impossible" });
      }

      const origin = req.get("origin") || process.env.APP_URL || "http://localhost:3000";
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: formation.title,
                ...(formation.thumbnail_url ? { images: [formation.thumbnail_url] } : {}),
              },
              unit_amount: formation.price_cents,
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/course/${formation.slug || formation.id}`,
        metadata: { kind: "formation", formation_id: formation.id, user_id: auth.user.id },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe formation checkout error:", error);
      res.status(500).json({ error: CHECKOUT_UNAVAILABLE });
    }
  });

  // Confirmation côté client après retour de /success : on revérifie la
  // session auprès de Stripe (jamais confiance au navigateur) puis on
  // enregistre l'achat. Idempotent — le webhook peut être passé avant.
  app.post("/api/confirm-purchase", async (req, res) => {
    const { sessionId } = req.body ?? {};
    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(500).json({ ok: false, reason: "stripe-not-configured" });
    }
    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return res.status(400).json({ ok: false, reason: "invalid-session-id" });
    }
    if (!SERVICE_ROLE_KEY) {
      return res.json({ ok: false, reason: "server-not-configured" });
    }

    try {
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);
      if (session.metadata?.kind !== "formation") {
        return res.json({ ok: false, reason: "not-a-formation" });
      }
      if (session.payment_status !== "paid") {
        return res.json({ ok: false, reason: "not-paid" });
      }
      const result = await recordPurchaseFromSession(session);
      return res.json(
        result.ok ? { ok: true, formationId: result.formationId } : { ok: false, reason: result.reason }
      );
    } catch (error: any) {
      console.error("confirm-purchase error:", error);
      return res.status(404).json({ ok: false, reason: "session-not-found" });
    }
  });

  // Webhook Stripe — corps BRUT requis (cf. middleware conditionnel plus
  // haut) pour vérifier la signature. Même upsert que confirm-purchase.
  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const stripeClient = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    if (!webhookSecret) {
      return res.status(501).json({ error: "STRIPE_WEBHOOK_SECRET non configuré — webhook inactif" });
    }

    let event: Stripe.Event;
    try {
      const signature = req.get("stripe-signature") ?? "";
      event = stripeClient.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error: any) {
      console.error("Webhook Stripe — signature invalide:", error.message);
      return res.status(400).json({ error: "Signature invalide" });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === "formation" && session.payment_status === "paid") {
        const result = await recordPurchaseFromSession(session);
        if (!result.ok) {
          // 500 → Stripe réessaiera (utile si la service role arrive plus tard)
          return res.status(500).json({ error: result.reason });
        }
      }
    }

    res.json({ received: true });
  });

  // Déblocage par code d'accès (élèves en salle) : le code de référence
  // vit dans le JSON long_description de la formation (champ access_code),
  // lu via la service role. Idempotent sur (user_id, formation_id).
  app.post("/api/redeem-code", async (req, res) => {
    const { formationId, code } = req.body ?? {};
    if (typeof formationId !== "string" || !formationId || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ ok: false, reason: "invalid-request" });
    }
    const auth = await getUserFromRequest(req);
    if (!auth) {
      return res.status(401).json({ ok: false, reason: "auth-required" });
    }
    if (!SERVICE_ROLE_KEY) {
      return res.json({ ok: false, reason: "server-not-configured" });
    }

    try {
      const resp = await sbService(
        `/rest/v1/formations?id=eq.${encodeURIComponent(formationId)}&select=id,long_description&limit=1`
      );
      const rows: any = resp.ok ? await resp.json() : [];
      const formation = rows?.[0];
      if (!formation) {
        return res.json({ ok: false, reason: "not-found" });
      }

      let accessCode = "";
      try {
        const parsed =
          typeof formation.long_description === "string"
            ? JSON.parse(formation.long_description)
            : formation.long_description;
        accessCode = String(parsed?.access_code ?? "");
      } catch {
        accessCode = "";
      }
      if (!accessCode.trim()) {
        return res.json({ ok: false, reason: "no-code" });
      }
      // Comparaison insensible à la casse et aux espaces
      if (accessCode.trim().toLowerCase() !== code.trim().toLowerCase()) {
        return res.json({ ok: false, reason: "invalid-code" });
      }

      if (await hasCompletedPurchase(auth.user.id, formationId, auth.token)) {
        return res.json({ ok: true });
      }
      const inserted = await sbService("/rest/v1/purchases", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          user_id: auth.user.id,
          formation_id: formationId,
          status: "completed",
          stripe_session_id: null,
          amount_cents: 0,
        }),
      });
      if (!inserted.ok) {
        console.error("redeem-code — insertion échouée:", await inserted.text());
        return res.json({ ok: false, reason: "insert-failed" });
      }
      return res.json({ ok: true });
    } catch (error: any) {
      console.error("redeem-code error:", error);
      return res.status(500).json({ ok: false, reason: "server-error" });
    }
  });

  // URL de lecture d'une vidéo. target = 'trailer' (tout utilisateur
  // connecté) ou un id de chapitre (achat complété, profil admin, ou
  // coach DE cette formation — jamais un coach quelconque).
  // Storage → URL signée 1 h ; YouTube/externe → URL telle quelle.
  app.post("/api/video-url", async (req, res) => {
    const { formationId, target } = req.body ?? {};
    if (typeof formationId !== "string" || !formationId || typeof target !== "string" || !target) {
      return res.status(400).json({ error: "formationId et target requis" });
    }
    const auth = await getUserFromRequest(req);
    if (!auth) {
      return res.status(401).json({ error: "Connexion requise" });
    }

    try {
      if (target === "trailer") {
        const resp = await sbAnon(
          `/rest/v1/formations?id=eq.${encodeURIComponent(formationId)}&select=*&limit=1`
        );
        const rows: any = resp.ok ? await resp.json() : [];
        const formation = rows?.[0];
        // Deux noms historiques pour la colonne teaser (cf. Course.tsx)
        const trailerUrl = formation?.trailer_video_url || formation?.trailer_url || null;
        if (!trailerUrl) {
          return res.status(404).json({ error: "Teaser introuvable" });
        }
        return res.json(await signStorageUrl(trailerUrl));
      }

      // Chapitre complet : contrôle d'accès avant toute résolution d'URL.
      // Admin/super_admin : accès global ; coach : uniquement SES
      // formations (isCoachOfFormation) ; sinon achat complété requis.
      const [purchased, role] = await Promise.all([
        hasCompletedPurchase(auth.user.id, formationId, auth.token),
        getProfileRole(auth.user.id, auth.token),
      ]);
      let privileged = role === "admin" || role === "super_admin";
      if (!privileged && !purchased && role === "coach") {
        privileged = await isCoachOfFormation(auth.user.id, formationId);
      }
      if (!purchased && !privileged) {
        return res.status(403).json({ error: "Formation non achetée" });
      }

      const chapterQuery = `/rest/v1/formation_chapters?id=eq.${encodeURIComponent(target)}&formation_id=eq.${encodeURIComponent(formationId)}&select=video_url&limit=1`;
      const chapterResp = SERVICE_ROLE_KEY ? await sbService(chapterQuery) : await sbAnon(chapterQuery);
      const chapters: any = chapterResp.ok ? await chapterResp.json() : [];
      const videoUrl = chapters?.[0]?.video_url || null;
      if (!videoUrl) {
        return res.status(404).json({ error: "Chapitre introuvable" });
      }
      return res.json(await signStorageUrl(videoUrl));
    } catch (error: any) {
      console.error("video-url error:", error);
      return res.status(500).json({ error: "Erreur serveur" });
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
      res.status(500).json({ error: CHECKOUT_UNAVAILABLE });
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
        kind: session.metadata?.kind ?? null,
        formationId: session.metadata?.formation_id ?? null,
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
