/**
 * E-mails du cycle de vie des abonnements, déclenchés par les webhooks Stripe
 * reçus par le site. Les droits dans l'app sont gérés par lab-service (son
 * propre webhook) : ici, on ne fait qu'informer le client.
 *
 * Événements à activer sur le webhook Stripe du site :
 * invoice.paid, invoice.payment_failed, invoice.upcoming,
 * customer.subscription.updated, customer.subscription.deleted.
 */
import type Stripe from "stripe";
import { normalizePlanKey, PLAN_DETAILS } from "../../src/config/subscriptionCommercial";
import { dateOf, discountOf, idOf, isCancellationScheduled, planOf } from "./stripeSubscriptions";
import { renderEmail } from "../emails/layout";
import { sendEmail } from "../emails/mailer";
import {
  subscriptionEmails,
  type SubscriptionEmailData,
  type SubscriptionEmailKind,
  type SubscriptionEmailLinks,
} from "../emails/subscriptionTemplates";

export const SUBSCRIPTION_EMAIL_EVENTS = new Set([
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.upcoming",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

// Stripe peut relivrer un événement : un même événement n'envoie qu'un e-mail.
const handledEvents = new Set<string>();
const rememberEvent = (id: string) => {
  handledEvents.add(id);
  if (handledEvents.size > 2000) handledEvents.delete(handledEvents.values().next().value as string);
};

export function emailLinks(): SubscriptionEmailLinks & { helpUrl: string; termsUrl: string; logoUrl: string } {
  const siteUrl = (process.env.APP_URL || "https://mmaiq.fr").replace(/\/$/, "");
  const assetsUrl = (process.env.MAIL_ASSETS_URL || siteUrl).replace(/\/$/, "");
  return {
    siteUrl,
    manageUrl: `${siteUrl}/mon-abonnement`,
    appUrl: "https://app.mmaiq.fr/subscription/success",
    helpUrl: `${siteUrl}/aide`,
    termsUrl: `${siteUrl}/cgv`,
    logoUrl: `${assetsUrl}/email/logo.png`,
  };
}

/** Rend un modèle avec les liens du site : utilisé par l'envoi et par l'aperçu. */
export function renderSubscriptionEmail(kind: SubscriptionEmailKind, data: SubscriptionEmailData) {
  const links = emailLinks();
  return renderEmail(subscriptionEmails[kind](data, links), links);
}

/** Abonnement d'une facture, quel que soit le format d'API de l'événement. */
function invoiceSubscriptionId(invoice: any): string | null {
  return (
    idOf(invoice?.parent?.subscription_details?.subscription) ??
    idOf(invoice?.subscription) ??
    idOf(invoice?.lines?.data?.[0]?.parent?.subscription_item_details?.subscription) ??
    idOf(invoice?.lines?.data?.[0]?.subscription)
  );
}

async function customerEmail(stripe: Stripe, customer: unknown): Promise<string | null> {
  if (customer && typeof customer === "object" && "email" in customer) return (customer as any).email ?? null;
  const id = idOf(customer);
  if (!id) return null;
  const retrieved = await stripe.customers.retrieve(id);
  return "deleted" in retrieved && retrieved.deleted ? null : (retrieved as Stripe.Customer).email ?? null;
}

async function baseData(stripe: Stripe, subscription: any, email: string): Promise<SubscriptionEmailData | null> {
  const plan = planOf(subscription);
  if (!plan.planKey) return null;
  const details = PLAN_DETAILS[plan.planKey];
  return {
    email,
    planName: details.name,
    credits: details.creditsPerMonth,
    interval: plan.interval,
    amountCents: plan.amountCents,
    nextBillingDate: isCancellationScheduled(subscription) ? null : plan.periodEnd,
    accessUntil: dateOf(subscription?.cancel_at) ?? plan.periodEnd,
    hasAppProfile: Boolean(subscription?.metadata?.user_id),
    discount: await discountOf(stripe, subscription),
  };
}

/**
 * Facture payée après un refus. attempt_count ne compte que les relances
 * automatiques : un paiement fait par le client (lien de l'e-mail, portail)
 * le laisse à 1, d'où la recherche d'un débit refusé sur la facture.
 */
async function hadFailedPayment(stripe: Stripe, invoice: any): Promise<boolean> {
  if ((invoice.attempt_count ?? 1) > 1) return true;
  if (!invoice.id) return false;
  const payments = await stripe.invoicePayments.list({ invoice: invoice.id, limit: 10 });
  for (const entry of payments.data) {
    const paymentIntent = idOf(entry.payment?.payment_intent);
    if (!paymentIntent) continue;
    const charges = await stripe.charges.list({ payment_intent: paymentIntent, limit: 20 });
    if (charges.data.some((charge) => charge.status === "failed")) return true;
  }
  return false;
}

async function deliver(kind: SubscriptionEmailKind, data: SubscriptionEmailData, event: Stripe.Event) {
  const rendered = renderSubscriptionEmail(kind, data);
  await sendEmail({ ...rendered, to: data.email, tags: ["abonnement", kind] });
  console.log(`[abonnement] e-mail ${kind} pour ${event.type} (${event.id})`);
}

/**
 * Envoie l'e-mail correspondant à l'événement, s'il y en a un. Ne lève pas
 * d'erreur : un e-mail manqué ne doit pas faire relivrer l'événement.
 */
export async function handleSubscriptionEmailEvent(stripe: Stripe, event: Stripe.Event): Promise<void> {
  if (!SUBSCRIPTION_EMAIL_EVENTS.has(event.type) || handledEvents.has(event.id)) return;
  rememberEvent(event.id);
  try {
    await dispatch(stripe, event);
  } catch (error) {
    console.error(`[abonnement] e-mail non envoyé pour ${event.type} (${event.id}) :`, error);
  }
}

async function dispatch(stripe: Stripe, event: Stripe.Event) {
  const object: any = event.data.object;

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed" || event.type === "invoice.upcoming") {
    const subscriptionId = invoiceSubscriptionId(object);
    if (!subscriptionId) return;
    const reason: string | undefined = object.billing_reason;
    let kind: SubscriptionEmailKind | null = null;
    if (event.type === "invoice.paid") {
      if (reason === "subscription_create") kind = "started";
      else if (await hadFailedPayment(stripe, object)) kind = "paymentRecovered";
      else if (reason === "subscription_cycle") kind = "renewed";
    } else if (event.type === "invoice.payment_failed") {
      // Premier paiement refusé : Stripe Checkout l'affiche déjà au client.
      kind = reason === "subscription_create" ? null : "paymentFailed";
    } else {
      kind = "annualReminder";
    }
    if (!kind) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["discounts"] });
    if (kind === "annualReminder" && planOf(subscription).interval !== "yearly") return;
    // Facture de clôture d'un abonnement terminé : ce n'est pas un renouvellement.
    if (kind === "renewed" && subscription.status === "canceled") return;
    const email = object.customer_email ?? (await customerEmail(stripe, subscription.customer));
    if (!email) return;
    const data = await baseData(stripe, subscription, email);
    if (!data) return;
    data.paidCents = event.type === "invoice.paid" ? object.amount_paid ?? null : object.amount_due ?? null;
    data.invoiceUrl = object.hosted_invoice_url ?? null;
    data.payUrl = object.hosted_invoice_url ?? null;
    if (kind === "annualReminder") data.nextBillingDate = dateOf(object.next_payment_attempt) ?? dateOf(object.period_end) ?? data.nextBillingDate;
    await deliver(kind, data, event);
    return;
  }

  if (event.type === "customer.subscription.updated") {
    const previous: any = (event.data as any).previous_attributes ?? {};
    const email = await customerEmail(stripe, object.customer);
    if (!email) return;

    const previousPlanKey = normalizePlanKey(previous?.items?.data?.[0]?.price?.lookup_key);
    const currentPlan = planOf(object);
    if (previousPlanKey && currentPlan.planKey && previousPlanKey !== currentPlan.planKey) {
      const data = await baseData(stripe, object, email);
      if (!data) return;
      data.previousPlanName = PLAN_DETAILS[previousPlanKey].name;
      data.previousCredits = PLAN_DETAILS[previousPlanKey].creditsPerMonth;
      await deliver("planChanged", data, event);
      return;
    }

    if ("cancel_at_period_end" in previous || "cancel_at" in previous) {
      const wasScheduled = isCancellationScheduled({ ...object, ...previous });
      const nowScheduled = isCancellationScheduled(object);
      if (wasScheduled === nowScheduled) return;
      const data = await baseData(stripe, object, email);
      if (!data) return;
      await deliver(nowScheduled ? "cancellationScheduled" : "cancellationReverted", data, event);
    }
    return;
  }

  if (event.type === "customer.subscription.deleted") {
    const email = await customerEmail(stripe, object.customer);
    if (!email) return;
    const data = await baseData(stripe, object, email);
    if (!data) return;
    data.accessUntil = dateOf(object.ended_at) ?? data.accessUntil;
    await deliver("ended", data, event);
  }
}
