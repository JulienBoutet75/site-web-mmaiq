-- Progression de lecture des formations Academy, synchronisée entre appareils.
-- Le site fonctionne sans cette table (progression gardée dans le navigateur) ;
-- une fois appliquée, src/utils/formationProgress.ts la lit et l'alimente
-- automatiquement. Chapitres stockés par numéro (1, 2, 3…) dans l'ordre
-- sort_order : l'éditeur recrée les lignes formation_chapters à chaque
-- enregistrement, leurs ids ne sont donc pas stables.

create table if not exists public.formation_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  formation_id uuid not null references public.formations (id) on delete cascade,
  completed_chapters integer[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, formation_id)
);

alter table public.formation_progress enable row level security;

-- Chaque élève ne lit et n'écrit que sa propre progression.
drop policy if exists "formation_progress_select_own" on public.formation_progress;
create policy "formation_progress_select_own" on public.formation_progress
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "formation_progress_insert_own" on public.formation_progress;
create policy "formation_progress_insert_own" on public.formation_progress
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "formation_progress_update_own" on public.formation_progress;
create policy "formation_progress_update_own" on public.formation_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on public.formation_progress from anon;
grant select, insert, update on public.formation_progress to authenticated;
