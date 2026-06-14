-- ════════════════════════════════════════════════════════════════
-- HDCP · 0003 — borradores de onboarding + descubrimiento (nombre, zona, cercanía)
-- ════════════════════════════════════════════════════════════════

-- ── Borrador resumible del cuestionario, uno por usuario ──
create table if not exists public.onboarding_drafts (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  answers    jsonb not null default '{}',
  step       int   not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.onboarding_drafts enable row level security;

drop policy if exists drafts_owner_all on public.onboarding_drafts;
create policy drafts_owner_all on public.onboarding_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists drafts_set_updated_at on public.onboarding_drafts;
create trigger drafts_set_updated_at
  before update on public.onboarding_drafts
  for each row execute function public.set_updated_at();

-- ── Perfil: visualización del nombre + ubicación + disponibilidad ──
alter table public.profiles
  add column if not exists apellido text,
  add column if not exists apodo text,
  add column if not exists display_pref text not null default 'nombre'
    check (display_pref in ('apodo', 'nombre', 'nombre_apellido')),
  add column if not exists zona text,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists disponible boolean not null default false;

create index if not exists profiles_disponible_idx
  on public.profiles (disponible) where disponible = true;

-- ── Búsqueda por cercanía (haversine, sin PostGIS) ──
-- Devuelve perfiles disponibles dentro de radius_km, ordenados por distancia.
create or replace function public.nearby_players(
  in_lat double precision,
  in_lng double precision,
  radius_km double precision default 25
)
returns table (profile public.profiles, dist_km double precision)
language sql stable as $$
  select sub.profile, sub.dist_km from (
    select p as profile,
           6371 * acos(greatest(-1, least(1,
             cos(radians(in_lat)) * cos(radians(p.lat)) * cos(radians(p.lng) - radians(in_lng))
             + sin(radians(in_lat)) * sin(radians(p.lat))
           ))) as dist_km
    from public.profiles p
    where p.disponible = true and p.lat is not null and p.lng is not null
  ) sub
  where sub.dist_km <= radius_km
  order by sub.dist_km asc
  limit 60;
$$;

-- la función solo lee public.profiles (lectura pública por RLS)
grant execute on function public.nearby_players(double precision, double precision, double precision)
  to anon, authenticated;
