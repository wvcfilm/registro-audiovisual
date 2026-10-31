-- Registro audiovisual · base de datos
-- Pegar completo en Supabase → SQL Editor → Run. Se puede volver a ejecutar sin perder datos.

create extension if not exists pgcrypto;

-- ---------- Tablas ----------
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,
  role text not null check (role in ('admin', 'socio', 'colaborador')),
  apoyo boolean not null default false,          -- recibe apoyo en el acabado (5.5)
  invite_code text unique,
  invite_expires timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  client text not null,
  name text not null,
  budget numeric not null check (budget > 0),
  videos_total int not null check (videos_total > 0),
  start_date date not null,
  pct jsonb not null default '{"pre":25,"rod":35,"mon":16,"aca":24}',
  status text not null default 'abierto' check (status in ('abierto', 'cerrado')),
  settlement jsonb,
  created_at timestamptz not null default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  num int not null,
  publish_date date not null,
  owner uuid not null references members(id),
  pre_due timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, num)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  kind text not null check (kind in ('guion', 'storyboard', 'rodaje', 'montaje', 'acabado')),
  done_by uuid not null references members(id),
  done_at timestamptz not null default now(),
  link text,
  note text,
  unique (video_id, kind)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  kind text not null check (kind in ('reunion', 'rodaje')),
  starts_at timestamptz not null,
  tolerance_min int not null default 45,
  video_ids uuid[] not null default '{}',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references members(id),
  arrived_at timestamptz,
  photo text,
  notice jsonb,
  unique (event_id, member_id)
);

create table if not exists log (
  id bigserial primary key,
  team_id uuid not null references teams(id) on delete cascade,
  project_id uuid,
  at timestamptz not null default now(),
  actor uuid references members(id),
  type text not null,
  data jsonb not null default '{}'
);

create table if not exists corrections (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  log_id bigint references log(id),
  requested_by uuid not null references members(id),
  text text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobada', 'rechazada')),
  decided_by uuid references members(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Quién es quién ----------
create or replace function my_member(t uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select id from members where team_id = t and user_id = auth.uid() and active limit 1
$$;

create or replace function is_partner(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where team_id = t and user_id = auth.uid() and active and role in ('admin', 'socio'))
$$;

create or replace function is_admin(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where team_id = t and user_id = auth.uid() and active and role = 'admin')
$$;

-- ---------- Seguridad: cada equipo solo ve lo suyo ----------
alter table teams enable row level security;
alter table members enable row level security;
alter table projects enable row level security;
alter table videos enable row level security;
alter table tasks enable row level security;
alter table events enable row level security;
alter table attendance enable row level security;
alter table log enable row level security;
alter table corrections enable row level security;

drop policy if exists team_read on teams;
create policy team_read on teams for select using (is_partner(id));

drop policy if exists members_read on members;
create policy members_read on members for select using (is_partner(team_id));
drop policy if exists members_admin on members;
create policy members_admin on members for update using (is_admin(team_id) or user_id = auth.uid());
-- Desde la app solo se puede cambiar el nombre (y el administrador, desactivar a alguien). El rol no se toca.
revoke update on members from authenticated;
grant update (name, active) on members to authenticated;

do $$
declare t text;
begin
  foreach t in array array['projects', 'videos', 'tasks', 'events', 'attendance', 'corrections'] loop
    execute format('drop policy if exists %1$s_read on %1$s', t);
    execute format('create policy %1$s_read on %1$s for select using (is_partner(team_id))', t);
    execute format('drop policy if exists %1$s_insert on %1$s', t);
    execute format('create policy %1$s_insert on %1$s for insert with check (is_partner(team_id))', t);
    execute format('drop policy if exists %1$s_update on %1$s', t);
    execute format('create policy %1$s_update on %1$s for update using (is_partner(team_id))', t);
  end loop;
end $$;

-- Una tarea marcada no se edita: si hay un error, se pide una corrección y la aplica el administrador.
drop policy if exists tasks_update on tasks;
create policy tasks_update on tasks for update using (is_admin(team_id));

-- Borrar solo lo puede el administrador (y queda en el historial).
drop policy if exists videos_delete on videos;
create policy videos_delete on videos for delete using (is_admin(team_id));
drop policy if exists tasks_delete on tasks;
create policy tasks_delete on tasks for delete using (is_admin(team_id));
drop policy if exists events_delete on events;
create policy events_delete on events for delete using (is_admin(team_id));

-- El historial solo se agrega: nadie lo edita ni lo borra.
drop policy if exists log_read on log;
create policy log_read on log for select using (is_partner(team_id));
drop policy if exists log_insert on log;
create policy log_insert on log for insert with check (is_partner(team_id) and actor = my_member(team_id));

-- ---------- Historial automático ----------
create or replace function log_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r jsonb := to_jsonb(coalesce(new, old));
  t uuid := (r->>'team_id')::uuid;
  p uuid := case when tg_table_name = 'projects' then (r->>'id')::uuid else (r->>'project_id')::uuid end;
begin
  if tg_table_name = 'attendance' then
    select project_id into p from events where id = (r->>'event_id')::uuid;
  end if;
  insert into log (team_id, project_id, actor, type, data)
  values (t, p, my_member(t), tg_table_name || '.' || lower(tg_op),
          jsonb_build_object('new', case when tg_op <> 'DELETE' then to_jsonb(new) end,
                             'old', case when tg_op <> 'INSERT' then to_jsonb(old) end));
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['projects', 'videos', 'tasks', 'events', 'attendance', 'corrections'] loop
    execute format('drop trigger if exists %1$s_log on %1$s', t);
    execute format('create trigger %1$s_log after insert or update or delete on %1$s for each row execute function log_change()', t);
  end loop;
end $$;

-- ---------- Funciones de la app ----------
create or replace function create_team(team_name text, my_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  insert into teams (name) values (team_name) returning id into t;
  insert into members (team_id, user_id, name, role) values (t, auth.uid(), my_name, 'admin');
  return t;
end $$;

create or replace function create_invite(t uuid, invite_name text, invite_role text, gets_apoyo boolean default false) returns text
language plpgsql security definer set search_path = public as $$
declare c text := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
begin
  if not is_admin(t) then raise exception 'Solo el administrador invita'; end if;
  insert into members (team_id, name, role, apoyo, invite_code, invite_expires)
  values (t, invite_name, invite_role, gets_apoyo, c, now() + interval '7 days');
  insert into log (team_id, actor, type, data) values (t, my_member(t), 'invite', jsonb_build_object('name', invite_name, 'role', invite_role));
  return c;
end $$;

create or replace function invite_info(code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('team', t.name, 'name', m.name, 'role', m.role, 'expired', m.invite_expires < now(), 'used', m.user_id is not null)
  from members m join teams t on t.id = m.team_id where m.invite_code = upper(code)
$$;

create or replace function accept_invite(code text, my_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare m members;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  select * into m from members where invite_code = upper(code);
  if m.id is null then raise exception 'Invitación no encontrada'; end if;
  if m.user_id is not null then raise exception 'Esta invitación ya se usó'; end if;
  if m.invite_expires < now() then raise exception 'La invitación venció'; end if;
  update members set user_id = auth.uid(), name = coalesce(nullif(trim(my_name), ''), name), invite_code = null where id = m.id;
  insert into log (team_id, actor, type, data) values (m.team_id, m.id, 'join', jsonb_build_object('name', my_name, 'role', m.role));
  return m.team_id;
end $$;

create or replace function my_teams() returns setof jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('team_id', t.id, 'team', t.name, 'member_id', m.id, 'role', m.role, 'name', m.name)
  from members m join teams t on t.id = m.team_id
  where m.user_id = auth.uid() and m.active
$$;

grant execute on function create_team, create_invite, invite_info, accept_invite, my_teams, my_member, is_partner, is_admin to authenticated;
grant execute on function invite_info to anon;

-- ---------- Fotos de evidencia ----------
insert into storage.buckets (id, name, public) values ('evidencia', 'evidencia', false) on conflict do nothing;
drop policy if exists evidencia_rw on storage.objects;
create policy evidencia_rw on storage.objects for all
  using (bucket_id = 'evidencia' and is_partner((storage.foldername(name))[1]::uuid))
  with check (bucket_id = 'evidencia' and is_partner((storage.foldername(name))[1]::uuid));

-- ---------- Candados: la hora la pone el servidor ----------
-- Nadie puede marcar una tarea con otra hora ni a nombre de otra persona.
create or replace function guard_task() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.done_by is distinct from my_member(new.team_id) then raise exception 'Solo puedes marcar tus propias tareas'; end if;
  new.done_at := now();
  return new;
end $$;
drop trigger if exists tasks_guard on tasks;
create trigger tasks_guard before insert on tasks for each row execute function guard_task();

-- Cada uno registra su propia llegada y su propio aviso; la respuesta al aviso la da el otro.
create or replace function guard_attendance() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := my_member(new.team_id);
begin
  if new.arrived_at is not null and (tg_op = 'INSERT' or new.arrived_at is distinct from old.arrived_at) then
    if new.member_id <> me then raise exception 'Solo puedes registrar tu propia llegada'; end if;
    new.arrived_at := now();
  end if;
  if new.notice ? 'sent_at' and (new.notice->>'sent_at') is not null
     and (tg_op = 'INSERT' or (old.notice->>'sent_at') is distinct from (new.notice->>'sent_at')) then
    if new.member_id <> me then raise exception 'Solo puedes enviar tu propio aviso'; end if;
    new.notice := jsonb_set(new.notice, '{sent_at}', to_jsonb(now()));
  end if;
  if tg_op = 'UPDATE' and (new.notice->>'decision') is not null and (old.notice->>'decision') is distinct from (new.notice->>'decision') then
    if new.member_id = me then raise exception 'El aviso lo responde tu compañero'; end if;
    new.notice := jsonb_set(new.notice, '{decided_at}', to_jsonb(now()));
  end if;
  return new;
end $$;
drop trigger if exists attendance_guard on attendance;
create trigger attendance_guard before insert or update on attendance for each row execute function guard_attendance();

-- ---------- Guillermo: colaborador de preproducción (80 %) ----------
-- Un socio lo contrata para una reunión; el otro (el que asiste) acepta y hace la preproducción con él.
create table if not exists hires (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  hired_by uuid not null references members(id),
  present uuid not null references members(id),
  pct numeric not null default 80 check (pct > 0 and pct <= 100),
  status text not null default 'pendiente' check (status in ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
alter table tasks add column if not exists hire_id uuid references hires(id);

alter table hires enable row level security;
drop policy if exists hires_read on hires;
create policy hires_read on hires for select using (is_partner(team_id));
drop policy if exists hires_insert on hires;
create policy hires_insert on hires for insert with check (is_partner(team_id) and hired_by = my_member(team_id));
drop policy if exists hires_update on hires;
create policy hires_update on hires for update using (is_partner(team_id));
drop trigger if exists hires_log on hires;
create trigger hires_log after insert or update or delete on hires for each row execute function log_change();

create or replace function guard_hire() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := my_member(new.team_id); ev events;
begin
  select * into ev from events where id = new.event_id;
  if tg_op = 'INSERT' then
    if ev.kind <> 'reunion' then raise exception 'Guillermo solo se contrata para reuniones de preproducción'; end if;
    if ev.starts_at <= now() then raise exception 'La reunión ya empezó'; end if;
    if new.present = new.hired_by then raise exception 'Alguien tiene que asistir'; end if;
    if exists (select 1 from hires where event_id = new.event_id and status in ('pendiente', 'aceptada')) then
      raise exception 'Ya hay una contratación de Guillermo para esta reunión';
    end if;
    new.pct := 80; new.status := 'pendiente'; new.decided_at := null;
  elsif new.status is distinct from old.status then
    if new.status in ('aceptada', 'rechazada') and me <> old.present then raise exception 'La contratación la acepta quien asiste'; end if;
    if new.status = 'cancelada' and me <> old.hired_by then raise exception 'Solo quien contrató puede cancelar'; end if;
    new.decided_at := now();
  end if;
  return new;
end $$;
drop trigger if exists hires_guard on hires;
create trigger hires_guard before insert or update on hires for each row execute function guard_hire();

-- Las tareas "por Guillermo" solo las marca quien asiste, y solo en una contratación aceptada.
create or replace function guard_task() returns trigger
language plpgsql security definer set search_path = public as $$
declare h hires;
begin
  if new.done_by is distinct from my_member(new.team_id) then raise exception 'Solo puedes marcar tus propias tareas'; end if;
  if new.hire_id is not null then
    select * into h from hires where id = new.hire_id;
    if h.status <> 'aceptada' or h.present <> new.done_by then raise exception 'Contratación de Guillermo no válida'; end if;
    if new.kind not in ('guion', 'storyboard') then raise exception 'Guillermo solo hace guiones y storyboards'; end if;
  end if;
  new.done_at := now();
  return new;
end $$;
