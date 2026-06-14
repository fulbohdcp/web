-- ════════════════════════════════════════════════════════════════
-- HDCP · esquema inicial
-- Pegá este archivo entero en: Supabase → SQL Editor → New query → Run.
-- Es idempotente en lo posible (IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- Secciones:
--   A) Tipos (enums)
--   B) CORE — perfiles + autoevaluaciones   ← necesario para el primer entregable
--   C) SOCIAL — validaciones, amigos, partidos, invitaciones  ← próximo tramo
--   D) Triggers y RLS
-- Podés correr todo, o solo A+B+D-core ahora y el resto después.
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ─────────────────────────────────────────────
-- A) TIPOS
-- ─────────────────────────────────────────────
do $$ begin
  create type hdcp_position as enum ('Delantero','Mediocampista','Defensor','Arquero');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hdcp_format as enum ('F5','F7','F8','F9','F11');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hdcp_category as enum ('amateur','pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hdcp_tier as enum ('verde','dorada','azul','roja');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hdcp_match_kind as enum ('amistoso','torneo_amateur','torneo_pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hdcp_friend_status as enum ('pending','accepted','blocked');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────
-- B) CORE
-- ─────────────────────────────────────────────

-- Perfil del jugador. 1:1 con auth.users.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null unique
                  check (username ~ '^[a-z0-9_]{3,20}$'),
  nombre        text not null check (char_length(nombre) between 1 and 40),
  foto_url      text,
  edad          int  check (edad between 10 and 99),
  genero        text check (genero in ('M','F','X')),
  categoria     hdcp_category not null default 'amateur',
  posicion      hdcp_position,
  formatos      hdcp_format[] not null default '{}',
  -- privados (afinan el físico vía IMC), no se muestran:
  peso_kg       numeric(5,2),
  altura_m      numeric(3,2),
  ataja         text check (ataja in ('no','si-bien','si-mal')) default 'no',
  -- snapshot de la figurita más reciente (para mostrar sin recalcular):
  auto_score    numeric(3,1),
  tier          hdcp_tier,
  titulo        text,
  stat_tecnico  numeric(3,1),
  stat_fisico   numeric(3,1),
  stat_equipo   numeric(3,1),
  verified      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'Jugador HDCP, 1:1 con auth.users. auto_score/tier/etc. son el snapshot de la última figurita.';

-- Autoevaluaciones (respuestas del cuestionario). Versionadas para ver evolución.
create table if not exists public.self_evaluations (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  posicion     hdcp_position not null,
  answers      jsonb not null,              -- respuestas crudas del quiz
  auto_score   numeric(3,1) not null,
  tier         hdcp_tier not null,
  titulo       text,
  stat_tecnico numeric(3,1),
  stat_fisico  numeric(3,1),
  stat_equipo  numeric(3,1),
  created_at   timestamptz not null default now()
);

create index if not exists self_evaluations_profile_idx
  on public.self_evaluations (profile_id, created_at desc);

-- ─────────────────────────────────────────────
-- C) SOCIAL (próximo tramo — se puede correr ahora igual)
-- ─────────────────────────────────────────────

-- Validaciones a ciegas: un jugador evalúa a otro. Mínimo 5 → verifica.
create table if not exists public.validations (
  id           uuid primary key default gen_random_uuid(),
  evaluator_id uuid not null references public.profiles(id) on delete cascade,
  subject_id   uuid not null references public.profiles(id) on delete cascade,
  answers      jsonb not null,
  score        numeric(3,1) not null,
  created_at   timestamptz not null default now(),
  check (evaluator_id <> subject_id),
  unique (evaluator_id, subject_id)
);

create index if not exists validations_subject_idx on public.validations (subject_id);

-- Amistades (grafo social). Una fila por relación.
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status       hdcp_friend_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

-- Partidos cargados.
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.profiles(id) on delete cascade,
  kind        hdcp_match_kind not null,
  format      hdcp_format not null,
  played_on   date not null default current_date,
  location    text,
  home_score  int check (home_score >= 0),
  away_score  int check (away_score >= 0),
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists matches_creator_idx on public.matches (creator_id, played_on desc);

-- Participantes de un partido. profile_id null = invitado que aún no tiene cuenta.
create table if not exists public.match_participants (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references public.matches(id) on delete cascade,
  profile_id   uuid references public.profiles(id) on delete set null,
  team         text check (team in ('home','away')),
  -- placeholder cuando todavía no es usuario (se completa al aceptar la invitación):
  invited_name text,
  goals        int default 0 check (goals >= 0),
  assists      int default 0 check (assists >= 0),
  stats        jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists match_participants_match_idx on public.match_participants (match_id);
create index if not exists match_participants_profile_idx on public.match_participants (profile_id);

-- Calificaciones cruzadas: cada jugador del equipo califica cómo jugó cada uno.
create table if not exists public.match_ratings (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  rater_id   uuid not null references public.profiles(id) on delete cascade,
  rated_id   uuid not null references public.profiles(id) on delete cascade,
  score      numeric(3,1) not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  check (rater_id <> rated_id),
  unique (match_id, rater_id, rated_id)
);

-- Invitaciones a jugadores etiquetados que todavía no tienen cuenta.
create table if not exists public.invites (
  id                 uuid primary key default gen_random_uuid(),
  inviter_id         uuid not null references public.profiles(id) on delete cascade,
  match_id           uuid references public.matches(id) on delete set null,
  contact            text not null,          -- email o teléfono
  contact_name       text,
  accepted_profile_id uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- D) TRIGGERS
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists friendships_set_updated_at on public.friendships;
create trigger friendships_set_updated_at
  before update on public.friendships
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- D) RLS
-- Red social: los perfiles y figuritas son públicos para leer;
-- cada quien solo escribe lo suyo.
-- ─────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.self_evaluations  enable row level security;
alter table public.validations        enable row level security;
alter table public.friendships        enable row level security;
alter table public.matches            enable row level security;
alter table public.match_participants enable row level security;
alter table public.match_ratings      enable row level security;
alter table public.invites            enable row level security;

-- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (auth.uid() = id);
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete using (auth.uid() = id);

-- self_evaluations
drop policy if exists self_eval_read on public.self_evaluations;
create policy self_eval_read on public.self_evaluations for select using (true);
drop policy if exists self_eval_write on public.self_evaluations;
create policy self_eval_write on public.self_evaluations for insert with check (auth.uid() = profile_id);
drop policy if exists self_eval_delete on public.self_evaluations;
create policy self_eval_delete on public.self_evaluations for delete using (auth.uid() = profile_id);

-- validations (lo emite el evaluador; el agregado es público)
drop policy if exists validations_read on public.validations;
create policy validations_read on public.validations for select using (true);
drop policy if exists validations_insert on public.validations;
create policy validations_insert on public.validations
  for insert with check (auth.uid() = evaluator_id and evaluator_id <> subject_id);
drop policy if exists validations_update on public.validations;
create policy validations_update on public.validations
  for update using (auth.uid() = evaluator_id);
drop policy if exists validations_delete on public.validations;
create policy validations_delete on public.validations
  for delete using (auth.uid() = evaluator_id);

-- friendships (cualquiera de los dos lados ve / modifica)
drop policy if exists friendships_read on public.friendships;
create policy friendships_read on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists friendships_insert on public.friendships;
create policy friendships_insert on public.friendships
  for insert with check (auth.uid() = requester_id);
drop policy if exists friendships_update on public.friendships;
create policy friendships_update on public.friendships
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists friendships_delete on public.friendships;
create policy friendships_delete on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- matches (públicos para leer; los crea su autor)
drop policy if exists matches_read on public.matches;
create policy matches_read on public.matches for select using (true);
drop policy if exists matches_insert on public.matches;
create policy matches_insert on public.matches for insert with check (auth.uid() = creator_id);
drop policy if exists matches_update on public.matches;
create policy matches_update on public.matches for update using (auth.uid() = creator_id);
drop policy if exists matches_delete on public.matches;
create policy matches_delete on public.matches for delete using (auth.uid() = creator_id);

-- match_participants (lectura pública; gestiona el creador del partido)
drop policy if exists mp_read on public.match_participants;
create policy mp_read on public.match_participants for select using (true);
drop policy if exists mp_write on public.match_participants;
create policy mp_write on public.match_participants
  for insert with check (exists (
    select 1 from public.matches m where m.id = match_id and m.creator_id = auth.uid()
  ));
drop policy if exists mp_update on public.match_participants;
create policy mp_update on public.match_participants
  for update using (exists (
    select 1 from public.matches m where m.id = match_id and m.creator_id = auth.uid()
  ));

-- match_ratings (cada jugador califica; agregado público)
drop policy if exists mr_read on public.match_ratings;
create policy mr_read on public.match_ratings for select using (true);
drop policy if exists mr_insert on public.match_ratings;
create policy mr_insert on public.match_ratings
  for insert with check (auth.uid() = rater_id and rater_id <> rated_id);
drop policy if exists mr_update on public.match_ratings;
create policy mr_update on public.match_ratings for update using (auth.uid() = rater_id);
drop policy if exists mr_delete on public.match_ratings;
create policy mr_delete on public.match_ratings for delete using (auth.uid() = rater_id);

-- invites (las gestiona quien invita)
drop policy if exists invites_read on public.invites;
create policy invites_read on public.invites
  for select using (auth.uid() = inviter_id);
drop policy if exists invites_insert on public.invites;
create policy invites_insert on public.invites
  for insert with check (auth.uid() = inviter_id);
drop policy if exists invites_delete on public.invites;
create policy invites_delete on public.invites
  for delete using (auth.uid() = inviter_id);

-- ════════════════════════════════════════════════════════════════
-- Fin. Tras correrlo, en Supabase → Authentication → Providers
-- habilitá Email y Google para el login.
-- ════════════════════════════════════════════════════════════════
