-- ═══════════════════════════════════════════════════════════════
--  MMA IQ — Académie freemium (17 juillet 2026)
--
--  Deux parties À EXÉCUTER SÉPARÉMENT (chacune collée seule dans
--  Supabase → SQL Editor → Run). Raison : le SQL Editor exécute
--  chaque collage en UNE transaction — un échec de droits sur
--  storage.objects (possible : ce schéma appartient parfois à
--  supabase_storage_admin) annulerait aussi la table, l'index et
--  le seed s'ils étaient collés ensemble.
--
--  Prérequis, dans l'ordre :
--  1. Déployer le code (checkout formations, /mes-formations,
--     URLs signées via POST /api/video-url).
--  2. Renseigner SUPABASE_SERVICE_ROLE_KEY et STRIPE_WEBHOOK_SECRET
--     dans le .env du serveur, puis redémarrer le serveur.
--  3. Exécuter la PARTIE 1 (données) — sans risque, tout de suite.
--  4. Exécuter la PARTIE 2 (storage) — SEULEMENT après l'étape 2 :
--     le bucket `formations-videos` passe en privé et les anciennes
--     URLs /object/public/… cessent de fonctionner ; sans service
--     role, le serveur ne peut pas signer et les élèves ne peuvent
--     plus rien lire.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
--  PARTIE 1 — DONNÉES (exécutable tout de suite, sans risque)
--  Table video_edits, index d'idempotence purchases, rôle 'admin'
--  reconnu par check_is_admin(), seed de démonstration.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Table video_edits (éditeur vidéo de l'admin) ───────────
-- Une ligne par vidéo de la médiathèque : trim de début/fin et
-- liste de coupes [{in, out}] sérialisée en JSON par le client
-- (voir Admin.tsx → handleSaveEdits).
create table if not exists public.video_edits (
  id uuid primary key default gen_random_uuid(),
  video_url text unique not null,
  trim_start double precision not null default 0,
  trim_end double precision not null default 0,
  -- Coupes sérialisées : '[{"in":12.4,"out":18.9}, …]'
  cuts text not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.video_edits enable row level security;

grant select, insert, update, delete on table public.video_edits to authenticated;

-- Seul l'admin lit et écrit ; aucune policy pour les autres rôles.
drop policy if exists "Admins manage video edits" on public.video_edits;
create policy "Admins manage video edits"
on public.video_edits for all
to authenticated
using (check_is_admin())
with check (check_is_admin());

-- ── 2. Idempotence des achats Stripe ──────────────────────────
-- Une même session Stripe ne doit produire qu'une seule ligne
-- purchases, que la confirmation vienne du webhook ou de la page
-- Success. Index partiel : les achats sans session (codes d'accès,
-- stripe_session_id null) ne sont pas contraints.
create unique index if not exists purchases_stripe_session_id_key
  on public.purchases (stripe_session_id)
  where stripe_session_id is not null;

-- ── 3. check_is_admin() : rôle 'admin' reconnu ────────────────
-- Le front accepte désormais profiles.role = 'admin' en plus de
-- 'super_admin', mais la fonction (définie dans final_rls_fix.sql)
-- ne validait que 'super_admin'. Même définition, rôles élargis.
create or replace function public.check_is_admin()
returns boolean as $$
declare
  user_email text;
begin
  -- Email du JWT (emplacement standard)
  user_email := auth.jwt() ->> 'email';

  -- Repli sur user_metadata si l'email manque au premier niveau
  if (user_email is null) then
    user_email := auth.jwt() -> 'user_metadata' ->> 'email';
  end if;

  -- Admin principal codé en dur
  if (user_email = 'stanlamoureux@gmail.com') then
    return true;
  end if;

  -- Repli sur la table profiles (SECURITY DEFINER : hors RLS)
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
end;
$$ language plpgsql security definer set search_path = public;

-- ── 4. Seed de démonstration ──────────────────────────────────
-- Prévu à l'origine via l'API admin, mais VITE_ADMIN_PASSWORD du
-- .env est périmé (invalid_credentials) — le seed passe donc par ce
-- script. Un coach + 3 formations « (démo) » avec 3 chapitres
-- chacune, réutilisant les mp4/images déjà présents dans Storage.
-- Idempotent (garde-fous sur les slugs). Pour retirer la démo :
--   delete from public.formations where slug like '%-demo';
--   delete from public.coaches where slug = 'coach-demo-sarah';

insert into public.coaches (name, slug, tagline, bio, is_featured, access_key, photo_url)
select
  'Sarah Lemoine',
  'coach-demo-sarah',
  'Grappling & contrôle au sol',
  'Coach de démonstration : ceinture noire de grappling, spécialiste des transitions lutte-sol. Profil créé pour valider le parcours académie — à remplacer par un vrai coach.',
  false,
  'DEMO-SARAH-2026',
  'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/1773513680507-Coach_homepage_rogna_2.png'
where not exists (select 1 from public.coaches where slug = 'coach-demo-sarah');

-- Formation 1 — striking, débutant, coach Johnny Frachey (existant).
insert into public.formations
  (title, slug, description, long_description, price_cents, duration, rating,
   level, discipline, coach_id, thumbnail_url, trailer_url, published)
select
  'Jab-cross : la mécanique du striking (démo)',
  'jab-cross-mecanique-demo',
  'Poser les fondations d''un striking propre : appuis, rotation de hanche et retour de garde. Formation de démonstration.',
  '{"content":"Trois chapitres pour construire un un-deux fiable sous fatigue : mécanique des appuis, transfert de poids, et enchaînements en déplacement.","bullets":["Appuis et distance de frappe","Rotation de hanche et alignement","Retour de garde systématique"]}',
  4900, '45m', 4.8,
  'debutant', 'striking',
  (select id from public.coaches where slug = 'johnny-frachey'),
  'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/1773508337865-pexels-jeffrey-czum-254391-3499174.jpg',
  'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/1774797988680-Bakary_Samake__16-0__Highlights_.mp4',
  true
where not exists (select 1 from public.formations where slug = 'jab-cross-mecanique-demo');

-- Formation 2 — grappling, amateur, coach démo Sarah.
-- Porte le code d''accès de test MMAIQ-DEMO (flux « J''ai un code »).
insert into public.formations
  (title, slug, description, long_description, price_cents, duration, rating,
   level, discipline, coach_id, thumbnail_url, trailer_url, published)
select
  'Passage de garde : les fondamentaux (démo)',
  'passage-de-garde-demo',
  'Pression, angles et timing : un système simple pour passer la garde sans s''épuiser. Formation de démonstration.',
  '{"content":"Un système de passage en trois temps : poser la pression, créer l''angle, stabiliser la position. Chaque chapitre isole un temps du système.","bullets":["Pression et posture de passage","Créer l''angle : knee-cut et torreando","Stabiliser en side control"],"access_code":"MMAIQ-DEMO"}',
  7900, '60m', 4.7,
  'amateur', 'grappling',
  (select id from public.coaches where slug = 'coach-demo-sarah'),
  'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/side-view-male-female-boxers-fist-bump.jpg',
  'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/1774792340676-YTDown.com_YouTube_Presentation-Coach-Jerome-MMA-Boxing-Cen_Media_X5EEiUwkbkQ_001_1080p.mp4',
  true
where not exists (select 1 from public.formations where slug = 'passage-de-garde-demo');

-- Formation 3 — mma-gameplan, pro, coach Johnny Frachey.
insert into public.formations
  (title, slug, description, long_description, price_cents, duration, rating,
   level, discipline, coach_id, thumbnail_url, trailer_url, published)
select
  'Construire son gameplan MMA (démo)',
  'gameplan-mma-demo',
  'Analyser l''adversaire, choisir ses zones de combat et scripter les deux premières minutes. Formation de démonstration.',
  '{"content":"Du scouting vidéo au plan de round : identifier les patterns adverses, définir ses zones gagnantes et préparer les scénarios d''urgence.","bullets":["Lire les patterns adverses","Définir ses zones de combat","Scripter le round 1"]}',
  14900, '90m', 4.9,
  'pro', 'mma-gameplan',
  (select id from public.coaches where slug = 'johnny-frachey'),
  'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/1773513343152-header.png',
  'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/BMPCC%204K%20_%20Jessie%20Wilcox%20Boxing.mp4',
  true
where not exists (select 1 from public.formations where slug = 'gameplan-mma-demo');

-- Chapitres (3 par formation, mp4 existants du bucket).
insert into public.formation_chapters
  (formation_id, chapter_number, sort_order, title, description, "timestamp", video_url)
select f.id, c.n, c.n, c.title, c.description, c.ts, c.video_url
from public.formations f
cross join (values
  (1, 'Appuis et distance', 'Trouver sa distance de frappe et stabiliser ses appuis.', '00:00',
   'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/1774798060074-Bakary_Samake__16-0__Highlights_.mp4'),
  (2, 'Rotation de hanche', 'Générer la puissance depuis le sol, pas depuis le bras.', '15:00',
   'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/1774799042718-Bakary_Samake__16-0__Highlights_.mp4'),
  (3, 'Retour de garde', 'Frapper sans s''exposer : le retour systématique.', '30:00',
   'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/1773584407608-49f08393-92c2-45fb-a834-04e8f8d90678.MP4')
) as c(n, title, description, ts, video_url)
where f.slug = 'jab-cross-mecanique-demo'
  and not exists (select 1 from public.formation_chapters x
                  where x.formation_id = f.id and x.chapter_number = c.n);

insert into public.formation_chapters
  (formation_id, chapter_number, sort_order, title, description, "timestamp", video_url)
select f.id, c.n, c.n, c.title, c.description, c.ts, c.video_url
from public.formations f
cross join (values
  (1, 'Pression et posture', 'La posture qui interdit les sweeps avant de passer.', '00:00',
   'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/1775317978335-YTDown.com_YouTube_Presentation-Coach-Jerome-MMA-Boxing-Cen_Media_X5EEiUwkbkQ_001_1080p.mp4'),
  (2, 'Créer l''angle', 'Knee-cut et torreando : deux angles, un même timing.', '20:00',
   'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/1775318172143-YTDown.com_YouTube_Presentation-Coach-Jerome-MMA-Boxing-Cen_Media_X5EEiUwkbkQ_001_1080p.mp4'),
  (3, 'Stabiliser la position', 'Tuer le re-guard : pression de côté et contrôles.', '40:00',
   'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/1775318682809-YTDown.com_YouTube_Presentation-Coach-Jerome-MMA-Boxing-Cen_Media_X5EEiUwkbkQ_001_1080p.mp4')
) as c(n, title, description, ts, video_url)
where f.slug = 'passage-de-garde-demo'
  and not exists (select 1 from public.formation_chapters x
                  where x.formation_id = f.id and x.chapter_number = c.n);

insert into public.formation_chapters
  (formation_id, chapter_number, sort_order, title, description, "timestamp", video_url)
select f.id, c.n, c.n, c.title, c.description, c.ts, c.video_url
from public.formations f
cross join (values
  (1, 'Scouting vidéo', 'Extraire trois patterns exploitables d''un combat adverse.', '00:00',
   'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/1773584476249-49f08393-92c2-45fb-a834-04e8f8d90678.MP4'),
  (2, 'Zones de combat', 'Choisir où le combat doit se passer — et où il ne doit pas.', '30:00',
   'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/1774792365457-YTDown.com_YouTube_Presentation-Coach-Jerome-MMA-Boxing-Cen_Media_X5EEiUwkbkQ_001_1080p.mp4'),
  (3, 'Scripter le round 1', 'Les 120 premières secondes décidées avant la cage.', '60:00',
   'https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/BMPCC%204K%20_%20Jessie%20Wilcox%20Boxing.mp4')
) as c(n, title, description, ts, video_url)
where f.slug = 'gameplan-mma-demo'
  and not exists (select 1 from public.formation_chapters x
                  where x.formation_id = f.id and x.chapter_number = c.n);

-- ── Vérifications (Partie 1) ──────────────────────────────────
-- Seed en place : 3 formations « (démo) » publiées, 9 chapitres.
select count(*) as formations from public.formations where published = true;
select count(*) as chapitres from public.formation_chapters;


-- ═══════════════════════════════════════════════════════════════
--  PARTIE 2 — STORAGE (copier-coller CE BLOC SEUL, et SEULEMENT
--  après avoir renseigné SUPABASE_SERVICE_ROLE_KEY dans le .env du
--  serveur : le bucket passe en privé, seules les URLs signées par
--  le serveur restent lisibles — sans service role, les élèves ne
--  peuvent plus rien lire).
--  Purge des policies storage.objects, bucket formations-videos →
--  privé, policies Staff (formations-videos, images, admin-media).
--  NB : en cas d'erreur de droits sur storage.objects (le schéma
--  appartient parfois à supabase_storage_admin), créer ces mêmes
--  policies via Dashboard → Storage → Policies.
-- ═══════════════════════════════════════════════════════════════

-- ── 5. Purge des policies storage.objects ─────────────────────
-- Vérifié en live : une policy permissive préexistante laissait la
-- clé anon lister ET signer le bucket formations-videos — paywall
-- contournable. On droppe TOUTES les policies de storage.objects
-- sauf les nôtres (préfixe « Staff »). Les GET publics
-- /object/public/images/… continuent de marcher : bucket public,
-- aucune policy nécessaire.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname not like 'Staff %'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- ── 6. Bucket formations-videos → privé ───────────────────────
-- Les URLs /storage/v1/object/public/formations-videos/… renvoient
-- désormais 400 : seules les URLs signées (1 h) servies par
-- /api/video-url donnent accès aux fichiers. (Le bucket `images`
-- reste public, il n'est pas touché.)
update storage.buckets set public = false where id = 'formations-videos';

-- ── 7. Policies Staff (bucket formations-videos) ──────────────
-- Admin + coach : gestion complète (upload, remplacement, purge)
-- depuis la médiathèque. Personne d'autre : les élèves passent par
-- les URLs signées générées côté serveur (service role, hors RLS).
drop policy if exists "Staff read formations videos" on storage.objects;
create policy "Staff read formations videos"
on storage.objects for select
to authenticated
using (bucket_id = 'formations-videos' and (check_is_admin() or check_is_coach()));

drop policy if exists "Staff upload formations videos" on storage.objects;
create policy "Staff upload formations videos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'formations-videos' and (check_is_admin() or check_is_coach()));

drop policy if exists "Staff update formations videos" on storage.objects;
create policy "Staff update formations videos"
on storage.objects for update
to authenticated
using (bucket_id = 'formations-videos' and (check_is_admin() or check_is_coach()))
with check (bucket_id = 'formations-videos' and (check_is_admin() or check_is_coach()));

drop policy if exists "Staff delete formations videos" on storage.objects;
create policy "Staff delete formations videos"
on storage.objects for delete
to authenticated
using (bucket_id = 'formations-videos' and (check_is_admin() or check_is_coach()));

-- ── 8. Policies Staff (buckets images et admin-media) ─────────
-- La purge du § 5 supprime aussi les policies permissives dont
-- dépendait la médiathèque admin : sans celles-ci, plus de listing
-- ni d'upload sur images / admin-media pour le staff. Le préfixe
-- « Staff » les protège de la purge en cas de ré-exécution.
drop policy if exists "Staff read media buckets" on storage.objects;
create policy "Staff read media buckets"
on storage.objects for select
to authenticated
using (bucket_id in ('images', 'admin-media') and (check_is_admin() or check_is_coach()));

drop policy if exists "Staff upload media buckets" on storage.objects;
create policy "Staff upload media buckets"
on storage.objects for insert
to authenticated
with check (bucket_id in ('images', 'admin-media') and (check_is_admin() or check_is_coach()));

drop policy if exists "Staff update media buckets" on storage.objects;
create policy "Staff update media buckets"
on storage.objects for update
to authenticated
using (bucket_id in ('images', 'admin-media') and (check_is_admin() or check_is_coach()))
with check (bucket_id in ('images', 'admin-media') and (check_is_admin() or check_is_coach()));

drop policy if exists "Staff delete media buckets" on storage.objects;
create policy "Staff delete media buckets"
on storage.objects for delete
to authenticated
using (bucket_id in ('images', 'admin-media') and (check_is_admin() or check_is_coach()));

-- ── Vérifications (Partie 2) ──────────────────────────────────
-- Le bucket formations-videos doit être privé (public = false)…
select id, public from storage.buckets where id in ('formations-videos', 'images');
-- …et SEULES des policies « Staff … » doivent rester sur
-- storage.objects — toute autre ligne ici est une policy permissive
-- qui a survécu, à supprimer via Dashboard → Storage → Policies.
select policyname, cmd, roles from pg_policies
where schemaname = 'storage' and tablename = 'objects';
