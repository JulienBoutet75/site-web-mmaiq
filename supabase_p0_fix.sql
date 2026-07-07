-- ═══════════════════════════════════════════════════════════════
--  MMA IQ — Correctif leads (à exécuter dans Supabase → SQL Editor)
--  Répare l'insertion des formulaires (contact / newsletter / waitlist)
--  qui était bloquée par la RLS (erreur 401 "violates row-level
--  security policy"). On accorde explicitement le droit d'INSERT au
--  rôle anonyme et on recrée la policy en la ciblant sur anon/authenticated.
-- ═══════════════════════════════════════════════════════════════

-- 1. Droit d'écriture au niveau table pour les visiteurs
grant insert on table public.leads to anon, authenticated;

-- 2. Policy d'insertion explicitement ciblée sur anon + authenticated
drop policy if exists "Anyone can submit leads" on public.leads;
create policy "Anyone can submit leads"
on public.leads for insert
to anon, authenticated
with check (true);

-- 3. Lecture réservée à l'admin (inchangé, on le remet par sécurité)
drop policy if exists "Admins can read leads" on public.leads;
create policy "Admins can read leads"
on public.leads for select
to authenticated
using (check_is_admin());

-- Vérif : insère une ligne de test puis la supprime.
insert into public.leads (type, email, message)
values ('contact', 'verif@mmaiq.test', 'test RLS ok');
delete from public.leads where email = 'verif@mmaiq.test';
