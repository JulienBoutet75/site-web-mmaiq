-- ═══════════════════════════════════════════════════════════════
--  MMA IQ — Programme partenaires salles, Phase 0 (13 juillet 2026)
--  À coller tel quel dans Supabase → SQL Editor → Run.
--  1) Table `partners` (annuaire + config marketing des salles).
--     ⚠️ Aucune donnée d'argent ici : attributions, paiements et
--     ledger de commissions vivront dans lab-service (Phase 1).
--  2) Vue publique `partners_public` pour la landing /s/:slug.
--  3) Table `leads` : type 'partner' + colonne referral_code
--     (waitlist taguée par salle avant le lancement).
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Table partners ──────────────────────────────────────────
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- URL de la landing : mmaiq.fr/s/{slug}
  slug text unique not null,
  -- Code dicté à l'oral / imprimé sur l'affiche (= upper du slug sans tirets)
  code text unique not null,
  city text,
  contact_name text,
  contact_email text,
  phone text,
  logo_url text,
  siret text,
  -- Statut TVA pour l'auto-facturation (Phase 1)
  vat_status text check (vat_status in ('tva20', 'franchise_293b', 'asso_non_assujettie')),
  -- Taux de référence du simulateur commercial V1. La remise reste inactive
  -- tant que sa durée n'est pas renseignée explicitement pour le partenaire.
  commission_rate numeric not null default 0.10
    check (commission_rate >= 0 and commission_rate <= 0.5),
  discount_percent integer not null default 10
    check (discount_percent >= 0 and discount_percent <= 100),
  discount_months integer not null default 0
    check (discount_months >= 0 and discount_months <= 24),
  status text not null default 'active'
    check (status in ('pending', 'active', 'suspended')),
  notes text,
  created_at timestamptz not null default now()
);

-- Rend aussi le script sûr pour une table créée avec les anciens defaults.
-- Les lignes existantes ne sont pas modifiées automatiquement.
alter table public.partners alter column commission_rate set default 0.10;
alter table public.partners alter column discount_percent set default 10;
alter table public.partners alter column discount_months set default 0;

alter table public.partners enable row level security;

grant select, insert, update, delete on table public.partners to authenticated;

-- Seul l'admin lit/écrit la table complète (IBAN, SIRET, taux…).
drop policy if exists "Admins manage partners" on public.partners;
create policy "Admins manage partners"
on public.partners for all
to authenticated
using (check_is_admin())
with check (check_is_admin());

-- ── 2. Vue publique pour la landing /s/:slug ───────────────────
-- Volontairement SANS security_invoker : la vue s'exécute avec les
-- droits de son propriétaire et expose UNIQUEMENT les colonnes
-- marketing des salles actives (jamais SIRET, taux, contact…).
create or replace view public.partners_public as
select name, slug, code, city, logo_url, discount_percent, discount_months
from public.partners
where status = 'active';

grant select on public.partners_public to anon, authenticated;

-- ── 3. Leads : type 'partner' + attribution waitlist ───────────
alter table public.leads drop constraint if exists leads_type_check;
alter table public.leads add constraint leads_type_check
  check (type in ('contact', 'newsletter', 'waitlist', 'partner'));

alter table public.leads add column if not exists referral_code text;

create index if not exists leads_referral_code_idx
  on public.leads (referral_code)
  where referral_code is not null;

-- Vérification rapide :
select 'partners' as t, count(*) from public.partners
union all
select 'leads avec code', count(*) from public.leads where referral_code is not null;
