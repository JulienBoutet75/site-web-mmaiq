/**
 * Lecture des abonnements Stripe, tolérante aux formats d'API (période sur les
 * lignes ou à la racine, remises en tableau ou non).
 */
import type Stripe from "stripe";
import { normalizePlanKey, PLAN_DETAILS, type SubscriptionPlanKey } from "../../src/config/subscriptionCommercial";

export type BillingInterval = "monthly" | "yearly";

export const idOf = (value: unknown): string | null =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as any).id) : null;

export const dateOf = (epoch: unknown) => (typeof epoch === "number" && epoch > 0 ? new Date(epoch * 1000) : null);

export interface PlanSnapshot {
  planKey: SubscriptionPlanKey | null;
  interval: BillingInterval;
  amountCents: number | null;
  periodEnd: Date | null;
  itemId: string | null;
  priceId: string | null;
}

export function planOf(subscription: any): PlanSnapshot {
  const item = subscription?.items?.data?.[0];
  return {
    planKey: normalizePlanKey(item?.price?.lookup_key) ?? normalizePlanKey(subscription?.metadata?.plan_key),
    interval: item?.price?.recurring?.interval === "year" ? "yearly" : "monthly",
    amountCents: typeof item?.price?.unit_amount === "number" ? item.price.unit_amount : null,
    periodEnd: dateOf(item?.current_period_end) ?? dateOf(subscription?.current_period_end),
    itemId: item?.id ?? null,
    priceId: idOf(item?.price),
  };
}

export const isCancellationScheduled = (subscription: any) =>
  Boolean(subscription?.cancel_at_period_end) || typeof subscription?.cancel_at === "number";

export async function discountOf(stripe: Stripe, subscription: any): Promise<{ percent: number; endsAt: Date | null } | null> {
  for (const raw of subscription?.discounts ?? []) {
    const discount = typeof raw === "string" ? null : raw;
    if (!discount) continue;
    let coupon = discount.coupon ?? discount.source?.coupon;
    if (typeof coupon === "string") coupon = await stripe.coupons.retrieve(coupon).catch(() => null);
    if (coupon?.percent_off) return { percent: coupon.percent_off, endsAt: dateOf(discount.end) };
  }
  return null;
}

const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "paused", "incomplete"]);

/** Abonnement en cours d'un client Stripe (le plus récent non terminé), ou null. */
export async function currentSubscription(stripe: Stripe, customerId: string): Promise<Stripe.Subscription | null> {
  const list = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10, expand: ["data.discounts"] });
  return list.data
    .filter((subscription) => LIVE_STATUSES.has(subscription.status))
    .sort((a, b) => b.created - a.created)[0] ?? null;
}

export interface SubscriptionOverview {
  id: string;
  status: string;
  planKey: SubscriptionPlanKey | null;
  planName: string | null;
  creditsPerMonth: number | null;
  interval: BillingInterval;
  amountCents: number | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  discount: { percent: number; endsAt: string | null } | null;
}

export async function describeSubscription(stripe: Stripe, subscription: Stripe.Subscription): Promise<SubscriptionOverview> {
  const plan = planOf(subscription);
  const discount = await discountOf(stripe, subscription);
  const details = plan.planKey ? PLAN_DETAILS[plan.planKey] : null;
  return {
    id: subscription.id,
    status: subscription.status,
    planKey: plan.planKey,
    planName: details?.name ?? null,
    creditsPerMonth: details?.creditsPerMonth ?? null,
    interval: plan.interval,
    amountCents: plan.amountCents,
    currentPeriodEnd: plan.periodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: isCancellationScheduled(subscription),
    cancelAt: dateOf((subscription as any).cancel_at)?.toISOString() ?? null,
    discount: discount ? { percent: discount.percent, endsAt: discount.endsAt?.toISOString() ?? null } : null,
  };
}
