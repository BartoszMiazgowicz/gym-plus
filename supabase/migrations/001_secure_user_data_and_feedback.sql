-- GYM+ — RLS lockdown for user_data and feedback
--
-- Jak uruchomić: Supabase Dashboard → SQL Editor → wklej całość → Run.
-- Bezpieczne do wielokrotnego uruchomienia (drop policy if exists + create).
--
-- Bez tego: każdy zalogowany użytkownik może w konsoli przeglądarki
-- odpytać supabase.from('user_data')/('feedback') i, jeśli te tabele
-- nie mają RLS, zobaczyć dane WSZYSTKICH użytkowników.

-- ============================================================
-- user_data — cały stan aplikacji (treningi, dieta, ustawienia)
-- jednego użytkownika w kolumnie `payload` (jsonb).
-- ============================================================

alter table public.user_data enable row level security;

drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own"
  on public.user_data for select
  using (auth.uid() = user_id);

drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own"
  on public.user_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_data_delete_own" on public.user_data;
create policy "user_data_delete_own"
  on public.user_data for delete
  using (auth.uid() = user_id);

-- ============================================================
-- feedback — zgłoszenia z panelu "Panel uwag". Każdy może dodać
-- swoje zgłoszenie, ale tylko konto deweloperskie może je czytać
-- i oznaczać jako rozwiązane (aplikacja pilnuje tego tylko w UI,
-- bez tych polityk każdy zalogowany widziałby zgłoszenia innych).
-- ============================================================

alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own"
  on public.feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "feedback_select_admin_only" on public.feedback;
create policy "feedback_select_admin_only"
  on public.feedback for select
  using ((auth.jwt() ->> 'email') = 'bartoszmiazgowicz@gmail.com');

drop policy if exists "feedback_update_admin_only" on public.feedback;
create policy "feedback_update_admin_only"
  on public.feedback for update
  using ((auth.jwt() ->> 'email') = 'bartoszmiazgowicz@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'bartoszmiazgowicz@gmail.com');

-- ============================================================
-- Weryfikacja po uruchomieniu: powinno zwrócić 6 wierszy (4 dla
-- user_data, 3 dla feedback... tj. łącznie 7 polityk powyżej).
-- ============================================================
-- select tablename, policyname, cmd from pg_policies
-- where schemaname = 'public' and tablename in ('user_data', 'feedback')
-- order by tablename, cmd;
