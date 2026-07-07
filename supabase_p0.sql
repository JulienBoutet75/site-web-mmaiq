-- ═══════════════════════════════════════════════════════════════
--  MMA IQ — Script P0 (audit UX/UI du 6 juillet 2026)
--  À coller tel quel dans Supabase → SQL Editor → Run.
--  Deux actions : 1) purge des données de test visibles en public,
--  2) création de la table `leads` (contact / newsletter / waitlist).
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Purge des données de test ──────────────────────────────
-- Formations de test : "yayaya" (1000€, image manga) et
-- "Formation de chuck" (79€, photo de chiens).
delete from public.formations
where id in (
  'e624e8c7-fb01-4926-b696-a7fa0724db85',  -- yayaya
  'afeba3a6-5b9c-4b19-ad68-923ee524f7bb'   -- formation-de-chuck
);

-- Coachs de test : "test", "Yannus" (photo pièce d'identité),
-- "Chuck" (Norris). Johnny Frachey est conservé.
delete from public.coaches
where id in (
  'cc2540e9-163e-4dc5-90ea-dba4bca2d952',  -- test
  '56e60515-c1e8-4d41-bfcf-6123836011fd',  -- Yannus
  'ac64a5be-5a91-4eda-9cb8-5e3d9640bed7'   -- Chuck
);

-- La home mettait en avant "Formation de chuck" (slot 2) :
-- on retire cette sélection du contenu éditorial.
update public.site_content
set data = jsonb_set(data, '{texts}', (data->'texts') - 'home.featured_course_2')
where id = 1
  and data->'texts' ? 'home.featured_course_2';

-- ── 2. Table leads (formulaire de contact, newsletter, waitlist app) ──
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('contact', 'newsletter', 'waitlist')),
  name text,
  email text not null,
  message text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Droit d'écriture au niveau table pour les visiteurs.
grant insert on table public.leads to anon, authenticated;

-- Tout visiteur peut soumettre (insert), personne ne peut lire
-- sauf l'admin (fonction check_is_admin déjà en place).
drop policy if exists "Anyone can submit leads" on public.leads;
create policy "Anyone can submit leads"
on public.leads for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read leads" on public.leads;
create policy "Admins can read leads"
on public.leads for select
to authenticated
using (check_is_admin());

-- Vérification rapide (doit retourner uniquement Johnny Frachey) :
select id, name from public.coaches;
