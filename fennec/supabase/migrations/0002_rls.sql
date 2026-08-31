-- Fennec — Row Level Security (0002)
--
-- Principe : un compte (auth.users) accède uniquement aux élèves dont il est
-- le tuteur (guardian), ou — pour un enseignant — aux élèves membres d'une
-- classe qu'il possède. Le référentiel (worlds, words) est public en lecture
-- (contenu pédagogique, pas de donnée personnelle) et jamais modifiable par
-- le client (seedé uniquement via migration/service role).

alter table worlds enable row level security;
alter table words enable row level security;
alter table guardians enable row level security;
alter table students enable row level security;
alter table classrooms enable row level security;
alter table classroom_students enable row level security;
alter table student_word_state enable row level security;
alter table sessions enable row level security;
alter table session_events enable row level security;
alter table parent_reports enable row level security;
alter table placement_tests enable row level security;

-- ---------------------------------------------------------------- référentiel
create policy "worlds: lecture publique" on worlds
  for select using (true);
create policy "words: lecture publique" on words
  for select using (true);
-- Aucune policy insert/update/delete : seul le service role (migrations/seed) écrit.

-- ---------------------------------------------------------------- guardians
create policy "guardians: gère son propre profil" on guardians
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- students
create policy "students: le tuteur voit ses élèves" on students
  for select using (
    guardian_id in (select id from guardians where user_id = auth.uid())
    or id in (
      select cs.student_id from classroom_students cs
      join classrooms c on c.id = cs.classroom_id
      join guardians g on g.id = c.teacher_id
      where g.user_id = auth.uid()
    )
  );
create policy "students: le tuteur crée ses élèves" on students
  for insert with check (guardian_id in (select id from guardians where user_id = auth.uid()));
create policy "students: le tuteur modifie ses élèves" on students
  for update using (guardian_id in (select id from guardians where user_id = auth.uid()));
create policy "students: le tuteur retire ses élèves" on students
  for delete using (guardian_id in (select id from guardians where user_id = auth.uid()));

-- ---------------------------------------------------------------- classrooms
create policy "classrooms: l'enseignant gère les siennes" on classrooms
  for all using (teacher_id in (select id from guardians where user_id = auth.uid() and role = 'teacher'))
  with check (teacher_id in (select id from guardians where user_id = auth.uid() and role = 'teacher'));

create policy "classroom_students: visible par l'enseignant ou le parent de l'élève" on classroom_students
  for select using (
    classroom_id in (
      select c.id from classrooms c join guardians g on g.id = c.teacher_id where g.user_id = auth.uid()
    )
    or student_id in (
      select s.id from students s join guardians g on g.id = s.guardian_id where g.user_id = auth.uid()
    )
  );
create policy "classroom_students: l'enseignant inscrit via son code" on classroom_students
  for insert with check (
    classroom_id in (
      select c.id from classrooms c join guardians g on g.id = c.teacher_id where g.user_id = auth.uid()
    )
    -- un parent peut aussi inscrire son propre élève avec le code de la classe (rejoint côté app)
    or student_id in (
      select s.id from students s join guardians g on g.id = s.guardian_id where g.user_id = auth.uid()
    )
  );
create policy "classroom_students: retrait par l'enseignant" on classroom_students
  for delete using (
    classroom_id in (
      select c.id from classrooms c join guardians g on g.id = c.teacher_id where g.user_id = auth.uid()
    )
  );

-- ------------------------------------------------ fonction utilitaire commune
-- Un élève est "visible" par l'utilisateur courant s'il en est le tuteur, ou
-- s'il est enseignant d'une classe qui le contient. Centralisée pour éviter
-- de dupliquer la sous-requête dans chaque policy ci-dessous.
create or replace function fennec_visible_student(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from students s
    join guardians g on g.id = s.guardian_id
    where s.id = p_student_id and g.user_id = auth.uid()
  ) or exists (
    select 1 from classroom_students cs
    join classrooms c on c.id = cs.classroom_id
    join guardians g on g.id = c.teacher_id
    where cs.student_id = p_student_id and g.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------- student_word_state
create policy "sws: lecture par tuteur/enseignant" on student_word_state
  for select using (fennec_visible_student(student_id));
create policy "sws: écriture par tuteur (sync app enfant)" on student_word_state
  for insert with check (
    student_id in (select s.id from students s join guardians g on g.id = s.guardian_id where g.user_id = auth.uid())
  );
create policy "sws: mise à jour par tuteur (sync app enfant)" on student_word_state
  for update using (
    student_id in (select s.id from students s join guardians g on g.id = s.guardian_id where g.user_id = auth.uid())
  );

-- ---------------------------------------------------------------- sessions
create policy "sessions: lecture par tuteur/enseignant" on sessions
  for select using (fennec_visible_student(student_id));
create policy "sessions: écriture par tuteur (sync app enfant)" on sessions
  for insert with check (
    student_id in (select s.id from students s join guardians g on g.id = s.guardian_id where g.user_id = auth.uid())
  );
create policy "sessions: mise à jour par tuteur (clôture de session)" on sessions
  for update using (
    student_id in (select s.id from students s join guardians g on g.id = s.guardian_id where g.user_id = auth.uid())
  );

-- ------------------------------------------------------------ session_events
create policy "events: lecture par tuteur/enseignant" on session_events
  for select using (
    session_id in (
      select id from sessions where fennec_visible_student(student_id)
    )
  );
create policy "events: écriture par tuteur (sync app enfant)" on session_events
  for insert with check (
    session_id in (
      select se.id from sessions se
      join students s on s.id = se.student_id
      join guardians g on g.id = s.guardian_id
      where g.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------ parent_reports
create policy "reports: lecture par tuteur/enseignant" on parent_reports
  for select using (fennec_visible_student(student_id));
create policy "reports: écriture par tuteur (générés côté app)" on parent_reports
  for insert with check (
    student_id in (select s.id from students s join guardians g on g.id = s.guardian_id where g.user_id = auth.uid())
  );

-- ----------------------------------------------------------- placement_tests
create policy "placement: lecture par tuteur/enseignant" on placement_tests
  for select using (fennec_visible_student(student_id));
create policy "placement: écriture par tuteur" on placement_tests
  for insert with check (
    student_id in (select s.id from students s join guardians g on g.id = s.guardian_id where g.user_id = auth.uid())
  );
