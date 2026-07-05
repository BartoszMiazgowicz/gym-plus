-- GYM+ — licznik dziennego użycia analizy zdjęć posiłku (Anthropic API)
--
-- Jak uruchomić: Supabase Dashboard → SQL Editor → wklej całość → Run.
-- Tabela jest czytana/zapisywana wyłącznie przez Edge Function
-- analyze-meal-photo przy użyciu service_role (który omija RLS),
-- dlatego celowo nie ma tu żadnych polityk dla zwykłych klientów —
-- RLS włączone bez polityk = zero dostępu z przeglądarki.

create table if not exists public.meal_photo_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);

alter table public.meal_photo_usage enable row level security;
