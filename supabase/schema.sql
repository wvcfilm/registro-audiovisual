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

-- =====================================================================
-- Versión 1.1
-- =====================================================================
alter table attendance add column if not exists claimed_at timestamptz;
alter table attendance add column if not exists confirmed_by uuid references members(id);
alter table events add column if not exists status text not null default 'activo';
alter table events add column if not exists ended_at timestamptz;
alter table events add column if not exists end_requested_at timestamptz;
alter table events add column if not exists end_requested_by uuid references members(id);
alter table events add column if not exists rodaje_id uuid references events(id) on delete set null;
alter table events add column if not exists replaced_by uuid references events(id) on delete set null;
alter table events add column if not exists cancel_note text;
do $$ begin
  alter table events add constraint events_status_chk check (status in ('activo', 'cancelado', 'reprogramado'));
exception when duplicate_object then null; end $$;
alter table projects drop constraint if exists projects_status_check;
alter table projects add constraint projects_status_check check (status in ('abierto', 'cerrado', 'archivado'));

-- ---------- Fechas en hora de Lima ----------
create or replace function lima_day(ts timestamptz) returns date language sql immutable as $$ select (ts at time zone 'America/Lima')::date $$;
create or replace function lima_at(d date, t time) returns timestamptz language sql immutable as $$ select (d + t) at time zone 'America/Lima' $$;

-- Rodaje vigente de un video y plazo de su preproducción (día antes del rodaje, 18:00).
create or replace function video_rodaje(v uuid) returns events
language sql stable security definer set search_path = public as $$
  select * from events where kind = 'rodaje' and status = 'activo' and v = any(video_ids) order by starts_at limit 1
$$;
create or replace function pre_due(v uuid) returns timestamptz
language sql stable security definer set search_path = public as $$
  select lima_at(lima_day(starts_at) - 1, '18:00') from events where kind = 'rodaje' and status = 'activo' and v = any(video_ids) order by starts_at limit 1
$$;

-- El administrador no estará: avisó, contrató a Guillermo, o no llegó dentro de la tolerancia.
create or replace function admin_absent(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from attendance a join members m on m.id = a.member_id where a.event_id = e and m.role = 'admin' and (a.notice->>'sent_at') is not null)
      or exists (select 1 from hires h join members m on m.id = h.hired_by where h.event_id = e and h.status = 'aceptada' and m.role = 'admin')
      or exists (select 1 from events ev where ev.id = e and now() > ev.starts_at + make_interval(mins => ev.tolerance_min)
                 and not exists (select 1 from attendance a join members m on m.id = a.member_id where a.event_id = e and m.role = 'admin' and a.arrived_at is not null))
$$;

-- ---------- Tareas: orden y momento correctos ----------
create or replace function guard_task() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me uuid := my_member(new.team_id); mrole text; v videos; vowner members; r events; h hires;
  due timestamptz; att attendance; oatt attendance; md timestamptz;
begin
  if new.done_by is distinct from me then raise exception 'Solo puedes marcar tus propias tareas'; end if;
  select role into mrole from members where id = me;
  select * into v from videos where id = new.video_id;
  select * into vowner from members where id = v.owner;
  if new.hire_id is not null then
    select * into h from hires where id = new.hire_id;
    if h.status <> 'aceptada' or h.present <> new.done_by then raise exception 'Contratación de Guillermo no válida'; end if;
    if new.kind not in ('guion', 'storyboard') then raise exception 'Guillermo solo hace guiones y storyboards'; end if;
  end if;
  if new.kind in ('guion', 'storyboard') then
    due := pre_due(v.id);
    if me <> v.owner and new.hire_id is null and (due is null or now() <= due) then
      raise exception 'La preproducción de tu compañero solo se puede tomar después de su plazo';
    end if;
  elsif new.kind = 'rodaje' then
    r := video_rodaje(v.id);
    if r.id is null then raise exception 'Este video no tiene rodaje agendado'; end if;
    if now() < r.starts_at - interval '15 minutes' or lima_day(now()) <> lima_day(r.starts_at) then
      raise exception 'El rodaje solo se marca el día del rodaje, desde 15 minutos antes';
    end if;
    if not exists (select 1 from tasks where video_id = v.id and kind = 'guion') or not exists (select 1 from tasks where video_id = v.id and kind = 'storyboard') then
      raise exception 'Primero se necesitan el guion y el storyboard';
    end if;
    select * into att from attendance where event_id = r.id and member_id = me;
    if att.arrived_at is null then raise exception 'Primero tu llegada al rodaje tiene que estar confirmada'; end if;
    if me <> v.owner then
      select * into oatt from attendance where event_id = r.id and member_id = v.owner;
      if oatt.arrived_at is not null then raise exception 'El dueño del video está en el rodaje: lo marca él'; end if;
      if (oatt.notice->>'sent_at') is not null and (oatt.notice->>'sent_at')::timestamptz <= lima_at(lima_day(r.starts_at) - 1, '18:00')
         and coalesce(oatt.notice->>'choice', '') <> 'other' then
        raise exception 'Avisó a tiempo: sus videos se reprograman, salvo que acepte que los grabes';
      end if;
    end if;
  elsif new.kind = 'montaje' then
    if not exists (select 1 from tasks where video_id = v.id and kind = 'rodaje') then raise exception 'Primero tiene que grabarse el video'; end if;
    md := case when vowner.apoyo then lima_at(v.publish_date - 2, '21:00') end;
    if me = v.owner then
      if md is not null and now() > md then raise exception 'Venció el plazo del montaje: el video pasa al administrador (5.7)'; end if;
    elsif mrole <> 'admin' or md is null or now() <= md then
      raise exception 'Este montaje le corresponde al dueño del video';
    end if;
  elsif new.kind = 'acabado' then
    if not exists (select 1 from tasks where video_id = v.id and kind = 'montaje') then raise exception 'Primero tiene que estar el montaje'; end if;
    if me <> v.owner and mrole <> 'admin' then raise exception 'El video final lo hace el dueño o el administrador'; end if;
  end if;
  new.done_at := now();
  return new;
end $$;

-- Deshacer: la preproducción hasta su plazo; lo demás, 10 minutos. El administrador, siempre.
create or replace function can_undo(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tasks k where k.id = t and k.done_by = my_member(k.team_id) and (
    (k.kind in ('guion', 'storyboard') and (pre_due(k.video_id) is null or now() <= pre_due(k.video_id)))
    or (k.kind not in ('guion', 'storyboard') and now() <= k.done_at + interval '10 minutes')))
$$;
drop policy if exists tasks_delete on tasks;
create policy tasks_delete on tasks for delete using (is_admin(team_id) or can_undo(id));

-- ---------- Llegada: el socio la marca y el administrador la confirma ----------
create or replace function guard_attendance() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := my_member(new.team_id); mrole text; ev events;
begin
  select role into mrole from members where id = me;
  select * into ev from events where id = new.event_id;
  if new.claimed_at is not null and (tg_op = 'INSERT' or old.claimed_at is distinct from new.claimed_at) then
    if new.member_id <> me then raise exception 'Solo puedes registrar tu propia llegada'; end if;
    if now() < ev.starts_at - interval '15 minutes' then raise exception 'El registro se abre 15 minutos antes'; end if;
    new.claimed_at := now();
    if mrole = 'admin' or admin_absent(new.event_id) then new.arrived_at := new.claimed_at; end if;
  end if;
  if new.arrived_at is not null and (tg_op = 'INSERT' or new.arrived_at is distinct from old.arrived_at) then
    if mrole = 'admin' and new.member_id <> me then
      if new.claimed_at is null or new.arrived_at is distinct from new.claimed_at then new.arrived_at := now(); end if;
      new.confirmed_by := me;
    elsif new.member_id = me and (mrole = 'admin' or admin_absent(new.event_id)) then
      new.arrived_at := coalesce(new.claimed_at, now());
    else
      raise exception 'Tu llegada la confirma el administrador';
    end if;
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

-- ---------- Reuniones y rodajes: una reunión por rodaje, finalizar, cancelar ----------
create or replace function guard_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := my_member(new.team_id); mrole text; rstart timestamptz;
begin
  select role into mrole from members where id = me;
  if tg_op = 'INSERT' then
    new.status := 'activo'; new.ended_at := null; new.end_requested_at := null;
    if new.kind = 'reunion' then
      if new.rodaje_id is null then raise exception 'Primero agenda el rodaje'; end if;
      select starts_at into rstart from events where id = new.rodaje_id and kind = 'rodaje' and status = 'activo';
      if rstart is null then raise exception 'El rodaje no existe o fue cancelado'; end if;
      if exists (select 1 from events where rodaje_id = new.rodaje_id and kind = 'reunion' and status = 'activo' and ended_at is null) then
        raise exception 'Ese rodaje ya tiene una reunión sin finalizar';
      end if;
      if new.starts_at >= lima_at(lima_day(rstart) - 1, '18:00') then
        raise exception 'La reunión tiene que ser antes del plazo de preproducción (día antes del rodaje, 18:00)';
      end if;
    end if;
    return new;
  end if;
  if new.end_requested_at is distinct from old.end_requested_at and new.end_requested_at is not null then
    new.end_requested_at := now(); new.end_requested_by := me;
  end if;
  if new.ended_at is distinct from old.ended_at and new.ended_at is not null then
    if mrole <> 'admin' and not admin_absent(new.id) then raise exception 'La reunión la finaliza el administrador'; end if;
    new.ended_at := coalesce(old.end_requested_at, new.end_requested_at, now());
  end if;
  if new.status is distinct from old.status then
    if new.status = 'cancelado' and mrole <> 'admin' then raise exception 'Solo el administrador cancela'; end if;
    if old.status <> 'activo' then raise exception 'Ya no está activo'; end if;
  end if;
  if new.starts_at is distinct from old.starts_at then
    if exists (select 1 from attendance where event_id = new.id and (arrived_at is not null or claimed_at is not null)) then
      raise exception 'Ya hay llegadas registradas: reprograma en vez de cambiar la hora';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists events_guard on events;
create trigger events_guard before insert or update on events for each row execute function guard_event();

-- Borrar solo lo vacío (lo que tiene datos se cancela o se archiva).
create or replace function guard_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'events' then
    if exists (select 1 from attendance where event_id = old.id) or exists (select 1 from hires where event_id = old.id) or coalesce(array_length(old.video_ids, 1), 0) > 0 then
      raise exception 'Tiene registros: cancélala en vez de borrarla';
    end if;
  elsif tg_table_name = 'projects' then
    if exists (select 1 from videos where project_id = old.id) or exists (select 1 from events where project_id = old.id) then
      raise exception 'El proyecto tiene registros: archívalo en vez de borrarlo';
    end if;
  end if;
  return old;
end $$;
drop trigger if exists events_del_guard on events;
create trigger events_del_guard before delete on events for each row execute function guard_delete();
drop trigger if exists projects_del_guard on projects;
create trigger projects_del_guard before delete on projects for each row execute function guard_delete();
drop policy if exists projects_delete on projects;
create policy projects_delete on projects for delete using (is_admin(team_id));

grant execute on function lima_day, lima_at, video_rodaje, pre_due, admin_absent, can_undo to authenticated;

-- =====================================================================
-- Versión 1.2: tema del video, ajustes del equipo, propuestas y reglas configurables
-- =====================================================================
alter table videos add column if not exists title text;
alter table teams add column if not exists settings jsonb not null default '{}';

-- Regla del equipo (con su valor por defecto si nadie la cambió).
create or replace function rule_int(t uuid, k text, d int) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select (settings->'rules'->>k)::int from teams where id = t), d)
$$;

-- Plazo de preproducción: el día antes del rodaje, a la hora acordada (por defecto 18:00).
create or replace function pre_due(v uuid) returns timestamptz
language sql stable security definer set search_path = public as $$
  select lima_at(lima_day(starts_at) - 1, '00:00') + make_interval(mins => rule_int(team_id, 'pre', 1080))
  from events where kind = 'rodaje' and status = 'activo' and v = any(video_ids) order by starts_at limit 1
$$;

create or replace function guard_task() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me uuid := my_member(new.team_id); mrole text; v videos; vowner members; r events; h hires;
  due timestamptz; att attendance; oatt attendance; md timestamptz;
begin
  if new.done_by is distinct from me then raise exception 'Solo puedes marcar tus propias tareas'; end if;
  select role into mrole from members where id = me;
  select * into v from videos where id = new.video_id;
  select * into vowner from members where id = v.owner;
  if new.hire_id is not null then
    select * into h from hires where id = new.hire_id;
    if h.status <> 'aceptada' or h.present <> new.done_by then raise exception 'Contratación de Guillermo no válida'; end if;
    if new.kind not in ('guion', 'storyboard') then raise exception 'Guillermo solo hace guiones y storyboards'; end if;
  end if;
  if new.kind in ('guion', 'storyboard') then
    due := pre_due(v.id);
    if me = v.owner and new.hire_id is null and due is not null and now() > due then
      raise exception 'Venció el plazo: esta tarea pasó a tu compañero';
    end if;
    if me <> v.owner and new.hire_id is null and (due is null or now() <= due) then
      raise exception 'La preproducción de tu compañero solo se puede tomar después de su plazo';
    end if;
  elsif new.kind = 'rodaje' then
    r := video_rodaje(v.id);
    if r.id is null then raise exception 'Este video no tiene rodaje agendado'; end if;
    if now() < r.starts_at - make_interval(mins => rule_int(new.team_id, 'open', 15)) or lima_day(now()) <> lima_day(r.starts_at) then
      raise exception 'El rodaje solo se marca el día del rodaje, desde que se abre la llegada';
    end if;
    if not exists (select 1 from tasks where video_id = v.id and kind = 'guion') or not exists (select 1 from tasks where video_id = v.id and kind = 'storyboard') then
      raise exception 'Primero se necesitan el guion y el storyboard';
    end if;
    select * into att from attendance where event_id = r.id and member_id = me;
    if att.arrived_at is null then raise exception 'Primero tu llegada al rodaje tiene que estar confirmada'; end if;
    if me <> v.owner then
      select * into oatt from attendance where event_id = r.id and member_id = v.owner;
      if oatt.arrived_at is not null then raise exception 'El dueño del video está en el rodaje: lo marca él'; end if;
      if (oatt.notice->>'sent_at') is not null
         and (oatt.notice->>'sent_at')::timestamptz <= lima_at(lima_day(r.starts_at) - 1, '00:00') + make_interval(mins => rule_int(new.team_id, 'avr', 1080))
         and coalesce(oatt.notice->>'choice', '') <> 'other' then
        raise exception 'Avisó a tiempo: sus videos se reprograman, salvo que acepte que los grabes';
      end if;
    end if;
  elsif new.kind = 'montaje' then
    if not exists (select 1 from tasks where video_id = v.id and kind = 'rodaje') then raise exception 'Primero tiene que grabarse el video'; end if;
    md := case when vowner.apoyo then lima_at(v.publish_date - rule_int(new.team_id, 'mon', 2), '21:00') end;
    if me = v.owner then
      if md is not null and now() > md then raise exception 'Venció el plazo del montaje: el video pasa al administrador (5.7)'; end if;
    elsif mrole <> 'admin' or md is null or now() <= md then
      raise exception 'Este montaje le corresponde al dueño del video';
    end if;
  elsif new.kind = 'acabado' then
    if not exists (select 1 from tasks where video_id = v.id and kind = 'montaje') then raise exception 'Primero tiene que estar el montaje'; end if;
    if me <> v.owner and mrole <> 'admin' then raise exception 'El video final lo hace el dueño o el administrador'; end if;
  end if;
  new.done_at := now();
  return new;
end $$;

create or replace function can_undo(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tasks k where k.id = t and k.done_by = my_member(k.team_id) and (
    (k.kind in ('guion', 'storyboard') and (pre_due(k.video_id) is null or now() <= pre_due(k.video_id)))
    or (k.kind not in ('guion', 'storyboard') and now() <= k.done_at + make_interval(mins => rule_int(k.team_id, 'undo', 10)))))
$$;

-- Ajustes que el administrador cambia solo (apariencia y recordatorios).
create or replace function save_settings(t uuid, k text, v jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s jsonb;
begin
  if not is_admin(t) then raise exception 'Solo el administrador cambia los ajustes'; end if;
  if k not in ('look', 'reminders') then raise exception 'Ese ajuste se cambia con una propuesta'; end if;
  update teams set settings = jsonb_set(coalesce(settings, '{}'), array[k], v) where id = t returning settings into s;
  insert into log (team_id, actor, type, data) values (t, my_member(t), 'settings.' || k, jsonb_build_object('new', v));
  return s;
end $$;
grant execute on function save_settings, rule_int to authenticated;

create or replace function team_settings(t uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when is_partner(t) then (select settings from teams where id = t) end
$$;
grant execute on function team_settings to authenticated;

-- Propuestas: reglas y porcentajes del acuerdo. Se aplican cuando el socio las aprueba.
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  kind text not null check (kind in ('rules', 'pct')),
  data jsonb not null,
  old jsonb,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobada', 'rechazada', 'retirada')),
  proposed_by uuid references members(id),
  decided_by uuid references members(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
alter table proposals enable row level security;
drop policy if exists proposals_read on proposals;
create policy proposals_read on proposals for select using (is_partner(team_id));
drop policy if exists proposals_insert on proposals;
create policy proposals_insert on proposals for insert with check (is_admin(team_id));
drop policy if exists proposals_update on proposals;
create policy proposals_update on proposals for update using (is_partner(team_id));

create or replace function guard_proposal() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := my_member(new.team_id); s int;
begin
  if tg_op = 'INSERT' then
    if exists (select 1 from proposals where team_id = new.team_id and kind = new.kind and status = 'pendiente') then
      raise exception 'Ya hay una propuesta pendiente de ese tipo: retírala primero';
    end if;
    if new.kind = 'pct' then
      s := coalesce((new.data->>'pre')::int, 0) + coalesce((new.data->>'rod')::int, 0) + coalesce((new.data->>'mon')::int, 0) + coalesce((new.data->>'aca')::int, 0);
      if s <> 100 then raise exception 'Los porcentajes tienen que sumar 100'; end if;
    end if;
    new.status := 'pendiente'; new.proposed_by := me; new.decided_by := null; new.decided_at := null; new.created_at := now();
    new.old := (select settings->new.kind from teams where id = new.team_id);
    return new;
  end if;
  if new.data is distinct from old.data or new.kind is distinct from old.kind then raise exception 'Una propuesta no se edita: retírala y haz otra'; end if;
  if new.status is distinct from old.status then
    if old.status <> 'pendiente' then raise exception 'Esa propuesta ya se decidió'; end if;
    if new.status = 'retirada' and me <> old.proposed_by then raise exception 'Solo quien propuso puede retirarla'; end if;
    if new.status in ('aprobada', 'rechazada') and me = old.proposed_by then raise exception 'La aprueba tu compañero'; end if;
    new.decided_by := me; new.decided_at := now();
    if new.status = 'aprobada' then
      update teams set settings = jsonb_set(coalesce(settings, '{}'), array[new.kind], coalesce(settings->new.kind, '{}') || new.data) where id = new.team_id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists proposals_guard on proposals;
create trigger proposals_guard before insert or update on proposals for each row execute function guard_proposal();
drop trigger if exists proposals_log on proposals;
create trigger proposals_log after insert or update on proposals for each row execute function log_change();

-- =====================================================================
-- Versión 1.3: Tomar = comprometerse, confirmación de asistencia, storyboard repartido,
-- reprogramar un video y WhatsApp de cada integrante
-- =====================================================================
alter table tasks add column if not exists split boolean not null default false;   -- storyboard repartido mitad y mitad
alter table tasks add column if not exists split_with uuid references members(id);
alter table attendance add column if not exists rsvp text;                          -- 'voy' (el "no iré" es el aviso)
alter table attendance add column if not exists rsvp_at timestamptz;
alter table members add column if not exists phone text;                            -- WhatsApp: 9 dígitos, empieza con 9
alter table hires add column if not exists created_at timestamptz not null default now();
do $$ begin
  alter table attendance add constraint attendance_rsvp_chk check (rsvp is null or rsvp in ('voy'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table members add constraint members_phone_chk check (phone is null or phone ~ '^9[0-9]{8}$');
exception when duplicate_object then null; end $$;
grant update (name, active, phone) on members to authenticated;

-- El número de WhatsApp lo cambia el administrador o cada uno el suyo.
create or replace function guard_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.phone is distinct from old.phone and not is_admin(new.team_id) and old.user_id is distinct from auth.uid() then
    raise exception 'Solo el administrador o el propio integrante cambian su WhatsApp';
  end if;
  return new;
end $$;
drop trigger if exists members_guard on members;
create trigger members_guard before update on members for each row execute function guard_member();

-- Plazo para confirmar asistencia (y para avisar a tiempo que no irá).
-- Rodaje: día anterior a las 18:00. Reunión: 12 h antes; si cae de madrugada (antes de las 05:00), 23:59 del día anterior.
create or replace function confirm_due(e uuid) returns timestamptz
language sql stable security definer set search_path = public as $$
  select case when ev.kind = 'rodaje'
    then lima_at(lima_day(ev.starts_at) - 1, '00:00') + make_interval(mins => rule_int(ev.team_id, 'avr', 1080))
    else (select case when (x.t at time zone 'America/Lima')::time < time '00:00' + make_interval(mins => rule_int(ev.team_id, 'madr', 300))
                      then lima_at(lima_day(x.t) - 1, '23:59') else x.t end
          from (select ev.starts_at - make_interval(hours => rule_int(ev.team_id, 'conf', 12)) as t) x)
  end
  from events ev where ev.id = e
$$;

-- Hasta cuándo se puede tomar (y entregar) lo del compañero.
create or replace function take_limit(v uuid, k text) returns timestamptz
language sql stable security definer set search_path = public as $$
  select case when k in ('guion', 'storyboard')
    then (select r.starts_at - make_interval(hours => rule_int(r.team_id, 'take', 5)) from events r where r.kind = 'rodaje' and r.status = 'activo' and v = any(r.video_ids) order by r.starts_at limit 1)
    else (select lima_at(vv.publish_date - rule_int(vv.team_id, 'fin', 1), '21:00') from videos vv where vv.id = v)
  end
$$;

-- ---------- Tomar = comprometerse ----------
create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  kind text not null check (kind in ('guion', 'storyboard', 'montaje')),
  member_id uuid not null references members(id),
  rodaje_id uuid references events(id) on delete set null,
  limit_at timestamptz,
  status text not null default 'activa' check (status in ('activa')),
  created_at timestamptz not null default now()
);
create unique index if not exists claims_one on claims (video_id, kind, coalesce(rodaje_id, '00000000-0000-0000-0000-000000000000'::uuid));
alter table claims enable row level security;
drop policy if exists claims_read on claims;
create policy claims_read on claims for select using (is_partner(team_id));
drop policy if exists claims_insert on claims;
create policy claims_insert on claims for insert with check (is_partner(team_id) and member_id = my_member(team_id));
-- Deshacer un "Tomar" solo en los primeros minutos y si todavía no se entregó.
drop policy if exists claims_delete on claims;
create policy claims_delete on claims for delete using (member_id = my_member(team_id)
  and now() <= created_at + make_interval(mins => rule_int(team_id, 'undo', 10))
  and not exists (select 1 from tasks t where t.video_id = claims.video_id and t.kind = claims.kind));
drop trigger if exists claims_log on claims;
create trigger claims_log after insert or delete on claims for each row execute function log_change();

create or replace function guard_claim() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := my_member(new.team_id); mrole text; v videos; vowner members; r events; md timestamptz;
begin
  select role into mrole from members where id = me;
  select * into v from videos where id = new.video_id;
  select * into vowner from members where id = v.owner;
  if mrole not in ('admin', 'socio') then raise exception 'Solo los socios toman tareas'; end if;
  if me = v.owner then raise exception 'Es tu propia tarea'; end if;
  if exists (select 1 from tasks where video_id = v.id and kind = new.kind) then raise exception 'Esa tarea ya está hecha'; end if;
  if new.kind in ('guion', 'storyboard') then
    r := video_rodaje(v.id);
    if r.id is null then raise exception 'Este video no tiene rodaje agendado'; end if;
    if now() <= pre_due(v.id) then raise exception 'Todavía está en el plazo de tu compañero'; end if;
    new.rodaje_id := r.id;
  else
    md := case when vowner.apoyo then lima_at(v.publish_date - rule_int(new.team_id, 'mon', 2), '21:00') end;
    if mrole <> 'admin' or md is null or now() <= md then raise exception 'Este montaje le corresponde al dueño del video'; end if;
    new.rodaje_id := null;
  end if;
  new.limit_at := take_limit(v.id, new.kind);
  if now() > new.limit_at then raise exception 'Pasó el límite para tomarlo'; end if;
  new.member_id := me; new.project_id := v.project_id; new.status := 'activa'; new.created_at := now();
  return new;
end $$;
drop trigger if exists claims_guard on claims;
create trigger claims_guard before insert on claims for each row execute function guard_claim();

-- Compromiso vigente de una persona sobre una tarea (el de un rodaje anterior ya no cuenta).
create or replace function has_claim(v uuid, k text, m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from claims c where c.video_id = v and c.kind = k and c.member_id = m and c.status = 'activa'
    and (k = 'montaje' or c.rodaje_id = (video_rodaje(v)).id) and now() <= c.limit_at)
$$;

-- ---------- Tareas (1.3) ----------
create or replace function guard_task() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me uuid := my_member(new.team_id); mrole text; v videos; vowner members; r events; h hires;
  due timestamptz; att attendance; oatt attendance; md timestamptz;
begin
  -- El storyboard repartido lo crea la base al grabar (no se marca desde la app).
  if new.split then
    if pg_trigger_depth() < 2 then raise exception 'El storyboard repartido lo registra la app al grabar'; end if;
    new.done_at := now();
    return new;
  end if;
  if new.done_by is distinct from me then raise exception 'Solo puedes marcar tus propias tareas'; end if;
  select role into mrole from members where id = me;
  select * into v from videos where id = new.video_id;
  select * into vowner from members where id = v.owner;
  if new.hire_id is not null then
    select * into h from hires where id = new.hire_id;
    if h.status <> 'aceptada' or h.present <> new.done_by then raise exception 'Contratación de Guillermo no válida'; end if;
    if new.kind not in ('guion', 'storyboard') then raise exception 'Guillermo solo hace guiones y storyboards'; end if;
  end if;
  if new.kind in ('guion', 'storyboard') then
    due := pre_due(v.id);
    if me = v.owner and new.hire_id is null and due is not null and now() > due then
      raise exception 'Venció el plazo: esta tarea pasó a tu compañero';
    end if;
    if me <> v.owner and new.hire_id is null then
      if due is null or now() <= due then raise exception 'La preproducción de tu compañero solo se puede tomar después de su plazo'; end if;
      if not has_claim(v.id, new.kind, me) then raise exception 'Primero tómala (o pasó el límite para entregarla)'; end if;
    end if;
  elsif new.kind = 'rodaje' then
    r := video_rodaje(v.id);
    if r.id is null then raise exception 'Este video no tiene rodaje agendado'; end if;
    if now() < r.starts_at - make_interval(mins => rule_int(new.team_id, 'open', 15)) or lima_day(now()) <> lima_day(r.starts_at) then
      raise exception 'El rodaje solo se marca el día del rodaje, desde que se abre la llegada';
    end if;
    if not exists (select 1 from tasks where video_id = v.id and kind = 'guion') then
      raise exception 'Sin guion no se graba: reprograma el video';
    end if;
    select * into att from attendance where event_id = r.id and member_id = me;
    if att.arrived_at is null then raise exception 'Primero tu llegada al rodaje tiene que estar confirmada'; end if;
    if me <> v.owner then
      select * into oatt from attendance where event_id = r.id and member_id = v.owner;
      if oatt.arrived_at is not null then raise exception 'El dueño del video está en el rodaje: lo marca él'; end if;
      if (oatt.notice->>'sent_at') is not null
         and (oatt.notice->>'sent_at')::timestamptz <= confirm_due(r.id)
         and coalesce(oatt.notice->>'choice', '') <> 'other' then
        raise exception 'Avisó a tiempo: sus videos se reprograman, salvo que acepte que los grabes';
      end if;
    end if;
  elsif new.kind = 'montaje' then
    if not exists (select 1 from tasks where video_id = v.id and kind = 'rodaje') then raise exception 'Primero tiene que grabarse el video'; end if;
    md := case when vowner.apoyo then lima_at(v.publish_date - rule_int(new.team_id, 'mon', 2), '21:00') end;
    if me = v.owner then
      if md is not null and now() > md then raise exception 'Venció el plazo del montaje: el video pasa al administrador (5.7)'; end if;
    elsif mrole <> 'admin' or md is null or now() <= md then
      raise exception 'Este montaje le corresponde al dueño del video';
    elsif not has_claim(v.id, 'montaje', me) then
      raise exception 'Primero toma el montaje';
    end if;
  elsif new.kind = 'acabado' then
    if not exists (select 1 from tasks where video_id = v.id and kind = 'montaje') then raise exception 'Primero tiene que estar el montaje'; end if;
    if me <> v.owner and mrole <> 'admin' then raise exception 'El video final lo hace el dueño o el administrador'; end if;
  end if;
  new.split := false; new.split_with := null;
  new.done_at := now();
  return new;
end $$;

-- Al grabar sin storyboard: su valor se reparte mitad y mitad y el storyboard queda cerrado.
-- Si se deshace el rodaje, se deshace también el reparto.
create or replace function split_storyboard() returns trigger
language plpgsql security definer set search_path = public as $$
declare v videos; oth uuid;
begin
  if tg_op = 'INSERT' then
    if new.kind = 'rodaje' and not exists (select 1 from tasks where video_id = new.video_id and kind = 'storyboard') then
      select * into v from videos where id = new.video_id;
      select id into oth from members where team_id = new.team_id and role in ('admin', 'socio') and active and id <> v.owner order by created_at limit 1;
      insert into tasks (team_id, project_id, video_id, kind, done_by, split, split_with)
      values (new.team_id, new.project_id, new.video_id, 'storyboard', v.owner, true, coalesce(oth, v.owner));
    end if;
  elsif tg_op = 'DELETE' then
    if old.kind = 'rodaje' then delete from tasks where video_id = old.video_id and kind = 'storyboard' and split; end if;
  end if;
  return null;
end $$;
drop trigger if exists tasks_split on tasks;
create trigger tasks_split after insert or delete on tasks for each row execute function split_storyboard();

-- ---------- Confirmación de asistencia ----------
create or replace function guard_attendance() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := my_member(new.team_id); mrole text; ev events;
begin
  select role into mrole from members where id = me;
  select * into ev from events where id = new.event_id;
  if new.rsvp is distinct from (case when tg_op = 'INSERT' then null else old.rsvp end) then
    if new.member_id <> me then raise exception 'Solo puedes confirmar tu propia asistencia'; end if;
    if now() > confirm_due(ev.id) then raise exception 'Venció el plazo para confirmar'; end if;
    new.rsvp_at := now();
  end if;
  if new.claimed_at is not null and (tg_op = 'INSERT' or old.claimed_at is distinct from new.claimed_at) then
    if new.member_id <> me then raise exception 'Solo puedes registrar tu propia llegada'; end if;
    if now() < ev.starts_at - make_interval(mins => rule_int(new.team_id, 'open', 15)) then raise exception 'El registro se abre 15 minutos antes'; end if;
    new.claimed_at := now();
    if mrole = 'admin' or admin_absent(new.event_id) then new.arrived_at := new.claimed_at; end if;
  end if;
  if new.arrived_at is not null and (tg_op = 'INSERT' or new.arrived_at is distinct from old.arrived_at) then
    if mrole = 'admin' and new.member_id <> me then
      if new.claimed_at is null or new.arrived_at is distinct from new.claimed_at then new.arrived_at := now(); end if;
      new.confirmed_by := me;
    elsif new.member_id = me and (mrole = 'admin' or admin_absent(new.event_id)) then
      new.arrived_at := coalesce(new.claimed_at, now());
    else
      raise exception 'Tu llegada la confirma el administrador';
    end if;
  end if;
  if new.notice ? 'sent_at' and (new.notice->>'sent_at') is not null
     and (tg_op = 'INSERT' or (old.notice->>'sent_at') is distinct from (new.notice->>'sent_at')) then
    if new.member_id <> me then raise exception 'Solo puedes enviar tu propio aviso'; end if;
    new.notice := jsonb_set(new.notice, '{sent_at}', to_jsonb(now()));
  end if;
  -- Retirar el "no iré" (cambiar a "voy") solo dentro del plazo.
  if tg_op = 'UPDATE' and (old.notice->>'sent_at') is not null and (new.notice is null or (new.notice->>'sent_at') is null) then
    if new.member_id <> me then raise exception 'Solo puedes cambiar tu propio aviso'; end if;
    if now() > confirm_due(ev.id) then raise exception 'Venció el plazo para cambiar tu respuesta'; end if;
  end if;
  if tg_op = 'UPDATE' and (new.notice->>'decision') is not null and (old.notice->>'decision') is distinct from (new.notice->>'decision') then
    if new.member_id = me then raise exception 'El aviso lo responde tu compañero'; end if;
    new.notice := jsonb_set(new.notice, '{decided_at}', to_jsonb(now()));
  end if;
  return new;
end $$;

-- ---------- Reprogramar un video (sin guion no se graba) ----------
-- Lo pasa a otro rodaje activo del mismo proyecto que aún no empezó; así se reabre el plazo de su dueño.
create or replace function move_video(v uuid, to_rodaje uuid) returns void
language plpgsql security definer set search_path = public as $$
declare vv videos; src events; dst events;
begin
  select * into vv from videos where id = v;
  if vv.id is null or not is_partner(vv.team_id) then raise exception 'Sin permiso'; end if;
  if exists (select 1 from tasks where video_id = v and kind = 'rodaje') then raise exception 'Ese video ya se grabó'; end if;
  select * into dst from events where id = to_rodaje and kind = 'rodaje' and status = 'activo' and project_id = vv.project_id;
  if dst.id is null then raise exception 'Elige un rodaje activo del mismo proyecto'; end if;
  if dst.starts_at <= now() then raise exception 'Ese rodaje ya empezó'; end if;
  src := video_rodaje(v);
  if src.id = dst.id then raise exception 'El video ya está en ese rodaje'; end if;
  update events set video_ids = array_remove(video_ids, v) where kind = 'rodaje' and status = 'activo' and v = any(video_ids) and id <> dst.id;
  update events set video_ids = array_append(video_ids, v) where id = dst.id;
  insert into log (team_id, project_id, actor, type, data) values (vv.team_id, vv.project_id, my_member(vv.team_id), 'video.reprogramado', jsonb_build_object('video', vv.num, 'from', src.starts_at, 'to', dst.starts_at));
end $$;

grant execute on function confirm_due, take_limit, has_claim, move_video to authenticated;

-- =====================================================================
-- Versión 1.4: entregas al límite (apoyo, entrega por su cuenta, revisión y rescate)
-- y deshacer en 10 minutos (nunca después del plazo de esa acción)
-- =====================================================================
alter table tasks add column if not exists review text;              -- entrega por su cuenta: pendiente | aprobada | cambios | rechazada
alter table tasks add column if not exists review_at timestamptz;
alter table tasks add column if not exists review_by uuid references members(id);
alter table tasks add column if not exists review_note text;
alter table tasks add column if not exists review_round int not null default 0;
alter table tasks add column if not exists redelivered_at timestamptz;
alter table tasks add column if not exists void boolean not null default false;   -- lo que marcó el dueño de un video que pasó al administrador
alter table tasks add column if not exists voided_at timestamptz;
alter table videos add column if not exists apoyo_due timestamptz;     -- montaje adelantado por un choque de fechas
alter table videos add column if not exists reprog jsonb not null default '[]';  -- entregas reprogramadas (de, a, cuándo, quién, si estaba vencida)
alter table videos add column if not exists handoff jsonb;             -- el video ya había pasado al administrador cuando se reprogramó
alter table attendance add column if not exists confirmed_at timestamptz;
alter table events add column if not exists ended_set_at timestamptz;
alter table events add column if not exists ended_by uuid references members(id);
alter table events add column if not exists canceled_at timestamptz;
do $$ begin
  alter table tasks add constraint tasks_review_chk check (review is null or review in ('pendiente', 'aprobada', 'cambios', 'rechazada'));
exception when duplicate_object then null; end $$;
-- Una sola tarea vigente por video y tipo (las anuladas quedan como registro).
alter table tasks drop constraint if exists tasks_video_id_kind_key;
create unique index if not exists tasks_one on tasks (video_id, kind) where not void;

-- Plazos de la posproducción de un video (zona de Lima). Los días de apoyo pueden ser propios del cliente.
create or replace function post_dues(v uuid) returns table (apoyo timestamptz, self timestamptz, auto timestamptz, fix timestamptz, fin timestamptz)
language sql stable security definer set search_path = public as $$
  select coalesce(vv.apoyo_due, lima_at(vv.publish_date - x.mon, '00:00') + make_interval(mins => rule_int(vv.team_id, 'monh', 1260))),
         lima_at(x.eve, '00:00') + make_interval(mins => rule_int(vv.team_id, 'self', 480)),
         lima_at(x.eve, '00:00') + make_interval(mins => rule_int(vv.team_id, 'auto', 720)),
         lima_at(x.eve, '00:00') + make_interval(mins => rule_int(vv.team_id, 'fix', 1020)),
         lima_at(x.eve, '23:59')
  from videos vv
  join projects p on p.id = vv.project_id
  join teams tm on tm.id = vv.team_id
  cross join lateral (select greatest(2, coalesce(nullif(tm.settings->'rules'->'cli'->>p.client, '')::int, rule_int(vv.team_id, 'mon', 2))) as mon,
                             vv.publish_date - rule_int(vv.team_id, 'fin', 1) as eve) x
  where vv.id = v
$$;

-- En qué momento está la posproducción de un video (igual que postState en js/rules.js).
create or replace function post_phase(v uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare vv videos; ow members; d record; mo tasks; ac tasks; rv text;
begin
  select * into vv from videos where id = v;
  select * into ow from members where id = vv.owner;
  if exists (select 1 from jobs j where v = any(j.video_ids) and j.status in ('invitado', 'activo', 'finalizado', 'cerrado')) then return 'colab'; end if;
  if not coalesce(ow.apoyo, false) then return 'normal'; end if;
  if vv.handoff is not null then return 'pasado'; end if;
  select * into d from post_dues(v);
  select * into mo from tasks where video_id = v and kind = 'montaje' and not void;
  select * into ac from tasks where video_id = v and kind = 'acabado' and not void;
  if mo.id is not null and mo.done_by = vv.owner and mo.done_at <= d.apoyo and not (ac.id is not null and ac.done_by = vv.owner and ac.review is not null) then return 'apoyo'; end if;
  if ac.id is not null and ac.done_by = vv.owner then
    rv := case when ac.review = 'pendiente' and now() > d.fin then 'aprobada' else ac.review end;
  end if;
  if mo.id is not null and mo.done_by <> vv.owner and coalesce((select role from members where id = mo.done_by), '') <> 'colaborador' then return 'pasado'; end if;
  if exists (select 1 from claims where video_id = v and kind = 'montaje' and status = 'activa') then return 'pasado'; end if;
  if rv = 'rechazada' then return 'pasado'; end if;
  if rv = 'cambios' and now() > d.fix then return 'pasado'; end if;
  if rv is null and now() > d.auto then return 'pasado'; end if;
  if rv = 'aprobada' then return 'aprobado'; end if;
  if rv = 'pendiente' then return 'revision'; end if;
  if rv = 'cambios' then return 'cambios'; end if;
  if now() <= d.apoyo then return 'abierto'; end if;
  if now() <= d.self then return 'solo'; end if;
  return 'riesgo';
end $$;

-- Tomar el video: hasta el plazo del video final.
create or replace function take_limit(v uuid, k text) returns timestamptz
language sql stable security definer set search_path = public as $$
  select case when k in ('guion', 'storyboard')
    then (select r.starts_at - make_interval(hours => rule_int(r.team_id, 'take', 5)) from events r where r.kind = 'rodaje' and r.status = 'activo' and v = any(r.video_ids) order by r.starts_at limit 1)
    else (select fin from post_dues(v))
  end
$$;

-- ---------- Tareas (1.4): entregas al límite ----------
create or replace function guard_task() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me uuid := my_member(new.team_id); mrole text; v videos; vowner members; r events; h hires;
  due timestamptz; att attendance; oatt attendance; md timestamptz; ph text; pd record;
begin
  -- El storyboard repartido lo crea la base al grabar (no se marca desde la app).
  if new.split then
    if pg_trigger_depth() < 2 then raise exception 'El storyboard repartido lo registra la app al grabar'; end if;
    new.done_at := now();
    return new;
  end if;
  if new.done_by is distinct from me then raise exception 'Solo puedes marcar tus propias tareas'; end if;
  select role into mrole from members where id = me;
  -- El colaborador solo marca desde su encargo (funciones job_*).
  if mrole = 'colaborador' then
    if coalesce(current_setting('app.job', true), '') <> '1' or new.kind not in ('montaje', 'acabado') then raise exception 'Los colaboradores entregan desde su encargo'; end if;
    new.void := false; new.review := null; new.review_round := 0; new.split := false; new.done_at := now();
    return new;
  end if;
  if new.kind in ('montaje', 'acabado') and post_phase(new.video_id) = 'colab' then raise exception 'Este video lo edita un colaborador'; end if;
  -- Estos campos los pone solo la base.
  new.void := false; new.voided_at := null; new.review := null; new.review_at := null; new.review_by := null;
  new.review_note := null; new.review_round := 0; new.redelivered_at := null;
  select role into mrole from members where id = me;
  select * into v from videos where id = new.video_id;
  select * into vowner from members where id = v.owner;
  if new.hire_id is not null then
    select * into h from hires where id = new.hire_id;
    if h.status <> 'aceptada' or h.present <> new.done_by then raise exception 'Contratación de Guillermo no válida'; end if;
    if new.kind not in ('guion', 'storyboard') then raise exception 'Guillermo solo hace guiones y storyboards'; end if;
  end if;
  if new.kind in ('guion', 'storyboard') then
    due := pre_due(v.id);
    if me = v.owner and new.hire_id is null and due is not null and now() > due then
      raise exception 'Venció el plazo: esta tarea pasó a tu compañero';
    end if;
    if me <> v.owner and new.hire_id is null then
      if due is null or now() <= due then raise exception 'La preproducción de tu compañero solo se puede tomar después de su plazo'; end if;
      if not has_claim(v.id, new.kind, me) then raise exception 'Primero tómala (o pasó el límite para entregarla)'; end if;
    end if;
  elsif new.kind = 'rodaje' then
    r := video_rodaje(v.id);
    if r.id is null then raise exception 'Este video no tiene rodaje agendado'; end if;
    if now() < r.starts_at - make_interval(mins => rule_int(new.team_id, 'open', 15)) or lima_day(now()) <> lima_day(r.starts_at) then
      raise exception 'El rodaje solo se marca el día del rodaje, desde que se abre la llegada';
    end if;
    if not exists (select 1 from tasks where video_id = v.id and kind = 'guion') then
      raise exception 'Sin guion no se graba: reprograma el video';
    end if;
    select * into att from attendance where event_id = r.id and member_id = me;
    if att.arrived_at is null then raise exception 'Primero tu llegada al rodaje tiene que estar confirmada'; end if;
    if me <> v.owner then
      select * into oatt from attendance where event_id = r.id and member_id = v.owner;
      if oatt.arrived_at is not null then raise exception 'El dueño del video está en el rodaje: lo marca él'; end if;
      if (oatt.notice->>'sent_at') is not null
         and (oatt.notice->>'sent_at')::timestamptz <= confirm_due(r.id)
         and coalesce(oatt.notice->>'choice', '') <> 'other' then
        raise exception 'Avisó a tiempo: sus videos se reprograman, salvo que acepte que los grabes';
      end if;
    end if;
  elsif new.kind = 'montaje' then
    if not exists (select 1 from tasks where video_id = v.id and kind = 'rodaje' and not void) then raise exception 'Primero tiene que grabarse el video'; end if;
    if vowner.apoyo then
      ph := post_phase(v.id);
      if me = v.owner then
        if ph = 'pasado' then raise exception 'El video pasó al administrador: ya no puedes entregarlo'; end if;
      elsif mrole <> 'admin' then
        raise exception 'Este montaje le corresponde al dueño del video';
      elsif ph <> 'pasado' then
        raise exception 'Todavía es de tu socio: si no entrega, podrás tomarlo desde las 08:00';
      else
        -- 1.4: nunca se bloquea: vencido se entrega igual (resta puntos) o se reprograma la entrega.
        if exists (select 1 from claims where video_id = v.id and kind = 'montaje' and status = 'activa' and member_id <> me) then raise exception 'Ya lo tomó otra persona'; end if;
        -- Lo que marcó el dueño deja de contar (queda en el historial).
        update tasks set void = true, voided_at = now() where video_id = v.id and kind in ('montaje', 'acabado') and done_by = v.owner and not void;
      end if;
    elsif me <> v.owner then
      raise exception 'Este montaje le corresponde al dueño del video';
    end if;
  elsif new.kind = 'acabado' then
    if not exists (select 1 from tasks where video_id = v.id and kind = 'montaje' and not void) then raise exception 'Primero tiene que estar el montaje'; end if;
    if vowner.apoyo then
      ph := post_phase(v.id);
      if me = v.owner then
        if ph = 'pasado' then raise exception 'El video pasó al administrador: ya no puedes entregarlo'; end if;
        if ph = 'apoyo' then raise exception 'Tu video final lo hace el administrador como apoyo'; end if;
        if ph in ('revision', 'cambios', 'aprobado') then raise exception 'Ya entregaste este video'; end if;
        new.review := 'pendiente'; -- entrega por su cuenta: el administrador la revisa
      elsif mrole = 'admin' then
        if ph = 'pasado' then
          if not exists (select 1 from tasks where video_id = v.id and kind = 'montaje' and not void and done_by = me) then raise exception 'Primero haz el montaje'; end if;
        elsif ph <> 'apoyo' then
          raise exception 'Tu socio entrega este video por su cuenta: revísalo cuando lo entregue';
        end if;
      else
        raise exception 'El video final lo hace el dueño o el administrador';
      end if;
    elsif me <> v.owner and mrole <> 'admin' then
      raise exception 'El video final lo hace el dueño o el administrador';
    end if;
  end if;
  new.split := false; new.split_with := null;
  new.done_at := now();
  return new;
end $$;


-- ---------- Tomar (1.4): el video en riesgo se toma desde las 08:00 hasta que pasa solo a las 12:00 ----------
create or replace function guard_claim() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := my_member(new.team_id); mrole text; v videos; vowner members; r events;
begin
  select role into mrole from members where id = me;
  select * into v from videos where id = new.video_id;
  select * into vowner from members where id = v.owner;
  if mrole not in ('admin', 'socio') then raise exception 'Solo los socios toman tareas'; end if;
  if me = v.owner then raise exception 'Es tu propia tarea'; end if;
  if new.kind in ('guion', 'storyboard') then
    if exists (select 1 from tasks where video_id = v.id and kind = new.kind and not void) then raise exception 'Esa tarea ya está hecha'; end if;
    r := video_rodaje(v.id);
    if r.id is null then raise exception 'Este video no tiene rodaje agendado'; end if;
    if now() <= pre_due(v.id) then raise exception 'Todavía está en el plazo de tu compañero'; end if;
    new.rodaje_id := r.id;
  else
    if mrole <> 'admin' or not coalesce(vowner.apoyo, false) then raise exception 'Este video le corresponde a su dueño'; end if;
    if post_phase(v.id) <> 'riesgo' then raise exception 'Solo se puede tomar si no entregó el video completo a las 08:00, hasta las 12:00'; end if;
    new.rodaje_id := null;
  end if;
  new.limit_at := take_limit(v.id, new.kind);
  if now() > new.limit_at then raise exception 'Pasó el límite para tomarlo'; end if;
  new.member_id := me; new.project_id := v.project_id; new.status := 'activa'; new.created_at := now();
  return new;
end $$;
drop trigger if exists claims_guard on claims;
create trigger claims_guard before insert on claims for each row execute function guard_claim();
-- Deshacer un "Tomar": 10 minutos y si todavía no entregó nada.
drop policy if exists claims_delete on claims;
create policy claims_delete on claims for delete using (member_id = my_member(team_id)
  and now() <= created_at + make_interval(mins => rule_int(team_id, 'undo', 10))
  and not exists (select 1 from tasks t where t.video_id = claims.video_id and t.kind = claims.kind and not t.void and t.done_by = claims.member_id));

-- ---------- Deshacer (1.4): 10 minutos y nunca después del plazo de esa acción ----------
create or replace function undo_limit(t uuid) returns timestamptz
language plpgsql stable security definer set search_path = public as $$
declare k tasks; vv videos; ow members; d record; lim timestamptz;
begin
  select * into k from tasks where id = t;
  select * into vv from videos where id = k.video_id;
  select * into ow from members where id = vv.owner;
  if k.kind = 'rodaje' then return lima_at(lima_day(k.done_at) + 1, '00:00'); end if;
  if k.kind not in ('montaje', 'acabado') then return null; end if;
  select * into d from post_dues(vv.id);
  if coalesce(ow.apoyo, false) and k.done_by = vv.owner then
    lim := case when k.kind = 'montaje' then case when k.done_at <= d.apoyo then d.apoyo else d.auto end when k.review_round > 0 then d.fix else d.auto end;
  else
    lim := d.fin;
  end if;
  return case when lim < k.done_at then null else lim end; -- ya estaba vencido: solo los 10 minutos
end $$;
create or replace function can_undo(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tasks k where k.id = t and k.done_by = my_member(k.team_id) and is_partner(k.team_id) and not k.split and not k.void and (
    (k.kind in ('guion', 'storyboard') and (pre_due(k.video_id) is null or now() <= pre_due(k.video_id)))
    or (k.kind not in ('guion', 'storyboard')
        and now() <= least(k.done_at + make_interval(mins => rule_int(k.team_id, 'undo', 10)), undo_limit(k.id))
        and not (k.kind = 'acabado' and (coalesce(k.review, 'pendiente') <> 'pendiente' or k.redelivered_at is not null))
        and not (k.kind = 'montaje' and exists (select 1 from tasks a where a.video_id = k.video_id and a.kind = 'acabado' and not a.void)))))
$$;
drop policy if exists tasks_delete on tasks;
create policy tasks_delete on tasks for delete using (is_admin(team_id) or can_undo(id));

-- ---------- Revisar la entrega por su cuenta (solo el administrador) ----------
-- ok = aprobar. Si no: la primera vez y antes de las 17:00 pide cambios; si no, la rechaza (el video pasa al administrador).
drop function if exists review_video(uuid, boolean, text);
create or replace function review_video(v uuid, ok boolean, motivo text default null) returns text
language plpgsql security definer set search_path = public as $$
declare vv videos; k tasks; d record; me uuid; res text;
begin
  select * into vv from videos where id = v;
  if vv.id is null or not is_admin(vv.team_id) then raise exception 'Solo el administrador revisa las entregas'; end if;
  me := my_member(vv.team_id);
  select * into k from tasks where video_id = v and kind = 'acabado' and not void and done_by = vv.owner;
  if k.id is null or k.review is distinct from 'pendiente' then raise exception 'No hay una entrega por revisar'; end if;
  select * into d from post_dues(v);
  if now() > d.fin then raise exception 'Venció el plazo de revisión: la entrega se aprobó sola'; end if;
  if ok then res := 'aprobada';
  elsif coalesce(trim(motivo), '') = '' then raise exception 'Escribe qué debe corregir';
  elsif k.review_round = 0 and now() <= d.fix then res := 'cambios';
  else res := 'rechazada';
  end if;
  update tasks set review = res, review_at = now(), review_by = me, review_note = case when ok then review_note else trim(motivo) end,
    review_round = case when res = 'cambios' then 1 else review_round end where id = k.id;
  return res;
end $$;
create or replace function review_undo(v uuid) returns void
language plpgsql security definer set search_path = public as $$
declare vv videos; k tasks; d record;
begin
  select * into vv from videos where id = v;
  if vv.id is null or not is_admin(vv.team_id) then raise exception 'Sin permiso'; end if;
  select * into k from tasks where video_id = v and kind = 'acabado' and not void and done_by = vv.owner;
  select * into d from post_dues(v);
  if k.id is null or k.review not in ('aprobada', 'cambios', 'rechazada') or k.review_by is distinct from my_member(vv.team_id) then raise exception 'No hay una decisión tuya para deshacer'; end if;
  if now() > k.review_at + make_interval(mins => rule_int(vv.team_id, 'undo', 10)) or now() > d.fin then raise exception 'Solo se deshace en los primeros 10 minutos'; end if;
  if k.redelivered_at is not null and k.redelivered_at > k.review_at then raise exception 'Tu socio ya entregó la corrección'; end if;
  if exists (select 1 from tasks where video_id = v and kind = 'montaje' and not void and done_by <> vv.owner) then raise exception 'Ya empezaste a editar el video'; end if;
  update tasks set review = 'pendiente', review_at = null, review_by = null,
    review_round = case when k.review = 'cambios' then 0 else review_round end,
    review_note = case when k.review = 'cambios' then null else review_note end where id = k.id;
end $$;
-- El dueño entrega la corrección (hasta las 17:00) y la puede deshacer 10 minutos.
create or replace function redeliver(v uuid) returns void
language plpgsql security definer set search_path = public as $$
declare vv videos; k tasks; d record;
begin
  select * into vv from videos where id = v;
  if vv.id is null or vv.owner is distinct from my_member(vv.team_id) then raise exception 'Solo el dueño entrega su video'; end if;
  if post_phase(v) <> 'cambios' then raise exception 'No hay cambios pendientes o venció el plazo para corregir'; end if;
  select * into k from tasks where video_id = v and kind = 'acabado' and not void and done_by = vv.owner;
  update tasks set review = 'pendiente', redelivered_at = now() where id = k.id;
end $$;
create or replace function redeliver_undo(v uuid) returns void
language plpgsql security definer set search_path = public as $$
declare vv videos; k tasks; d record;
begin
  select * into vv from videos where id = v;
  if vv.id is null or vv.owner is distinct from my_member(vv.team_id) then raise exception 'Sin permiso'; end if;
  select * into k from tasks where video_id = v and kind = 'acabado' and not void and done_by = vv.owner;
  select * into d from post_dues(v);
  if k.id is null or k.review <> 'pendiente' or k.redelivered_at is null then raise exception 'No hay una corrección para deshacer'; end if;
  if now() > k.redelivered_at + make_interval(mins => rule_int(vv.team_id, 'undo', 10)) or now() > d.fix then raise exception 'Solo se deshace en los primeros 10 minutos'; end if;
  update tasks set review = 'cambios', redelivered_at = null where id = k.id;
end $$;
grant execute on function post_dues, post_phase, undo_limit, review_video, review_undo, redeliver, redeliver_undo to authenticated;

-- ---------- Asistencia (1.4): deshacer la llegada, su confirmación y la respuesta a un aviso en 10 minutos ----------
create or replace function guard_attendance() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := my_member(new.team_id); mrole text; ev events; undo interval := make_interval(mins => rule_int(new.team_id, 'undo', 10));
begin
  select role into mrole from members where id = me;
  select * into ev from events where id = new.event_id;
  if new.rsvp is distinct from (case when tg_op = 'INSERT' then null else old.rsvp end) then
    if new.member_id <> me then raise exception 'Solo puedes confirmar tu propia asistencia'; end if;
    if now() > confirm_due(ev.id) then raise exception 'Venció el plazo para confirmar'; end if;
    new.rsvp_at := now();
  end if;
  -- Deshacer "Llegué" (propio, 10 min) o la confirmación del administrador (10 min).
  if tg_op = 'UPDATE' and old.arrived_at is not null and new.arrived_at is null then
    if new.member_id <> me and not (mrole = 'admin' and old.confirmed_by = me and now() <= coalesce(old.confirmed_at, old.arrived_at) + undo) then
      raise exception 'Solo se deshace en los primeros 10 minutos';
    end if;
    if new.member_id = me and now() > coalesce(old.claimed_at, old.arrived_at) + undo then raise exception 'Solo se deshace en los primeros 10 minutos'; end if;
    new.confirmed_by := null; new.confirmed_at := null;
  end if;
  if tg_op = 'UPDATE' and old.claimed_at is not null and new.claimed_at is null then
    if new.member_id <> me or now() > old.claimed_at + undo then raise exception 'Solo se deshace en los primeros 10 minutos'; end if;
    if new.arrived_at is not null and new.member_id <> me then raise exception 'Primero deshaz la confirmación'; end if;
    new.arrived_at := null;
  end if;
  if tg_op = 'UPDATE' and (old.notice->>'decision') is not null and (new.notice is not null and (new.notice->>'decision') is null) then
    if new.member_id = me or now() > (old.notice->>'decided_at')::timestamptz + undo then raise exception 'La respuesta solo se deshace en los primeros 10 minutos'; end if;
  end if;
  if new.claimed_at is not null and (tg_op = 'INSERT' or old.claimed_at is distinct from new.claimed_at) then
    if new.member_id <> me then raise exception 'Solo puedes registrar tu propia llegada'; end if;
    if now() < ev.starts_at - make_interval(mins => rule_int(new.team_id, 'open', 15)) then raise exception 'El registro se abre 15 minutos antes'; end if;
    new.claimed_at := now();
    if mrole = 'admin' or admin_absent(new.event_id) then new.arrived_at := new.claimed_at; end if;
  end if;
  if new.arrived_at is not null and (tg_op = 'INSERT' or new.arrived_at is distinct from old.arrived_at) then
    if mrole = 'admin' and new.member_id <> me then
      if new.claimed_at is null or new.arrived_at is distinct from new.claimed_at then new.arrived_at := now(); end if;
      new.confirmed_by := me; new.confirmed_at := now();
    elsif new.member_id = me and (mrole = 'admin' or admin_absent(new.event_id)) then
      new.arrived_at := coalesce(new.claimed_at, now());
    else
      raise exception 'Tu llegada la confirma el administrador';
    end if;
  end if;
  if new.notice ? 'sent_at' and (new.notice->>'sent_at') is not null
     and (tg_op = 'INSERT' or (old.notice->>'sent_at') is distinct from (new.notice->>'sent_at')) then
    if new.member_id <> me then raise exception 'Solo puedes enviar tu propio aviso'; end if;
    new.notice := jsonb_set(new.notice, '{sent_at}', to_jsonb(now()));
  end if;
  -- Retirar el "no iré" (cambiar a "voy") solo dentro del plazo.
  if tg_op = 'UPDATE' and (old.notice->>'sent_at') is not null and (new.notice is null or (new.notice->>'sent_at') is null) then
    if new.member_id <> me then raise exception 'Solo puedes cambiar tu propio aviso'; end if;
    if now() > confirm_due(ev.id) then raise exception 'Venció el plazo para cambiar tu respuesta'; end if;
  end if;
  if tg_op = 'UPDATE' and (new.notice->>'decision') is not null and (old.notice->>'decision') is distinct from (new.notice->>'decision') then
    if new.member_id = me then raise exception 'El aviso lo responde tu compañero'; end if;
    new.notice := jsonb_set(new.notice, '{decided_at}', to_jsonb(now()));
  end if;
  return new;
end $$;


-- ---------- Reuniones y rodajes (1.4): deshacer "Finalizar" y "Cancelar" en 10 minutos ----------
create or replace function guard_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := my_member(new.team_id); mrole text; rstart timestamptz; undo interval := make_interval(mins => rule_int(new.team_id, 'undo', 10));
begin
  select role into mrole from members where id = me;
  if tg_op = 'INSERT' then
    new.status := 'activo'; new.ended_at := null; new.end_requested_at := null; new.ended_set_at := null; new.ended_by := null; new.canceled_at := null;
    if new.kind = 'reunion' then
      if new.rodaje_id is null then raise exception 'Primero agenda el rodaje'; end if;
      select starts_at into rstart from events where id = new.rodaje_id and kind = 'rodaje' and status = 'activo';
      if rstart is null then raise exception 'El rodaje no existe o fue cancelado'; end if;
      if exists (select 1 from events where rodaje_id = new.rodaje_id and kind = 'reunion' and status = 'activo' and ended_at is null) then
        raise exception 'Ese rodaje ya tiene una reunión sin finalizar';
      end if;
      if new.starts_at >= lima_at(lima_day(rstart) - 1, '00:00') + make_interval(mins => rule_int(new.team_id, 'pre', 1080)) then
        raise exception 'La reunión tiene que ser antes del plazo de preproducción';
      end if;
    end if;
    return new;
  end if;
  if new.end_requested_at is distinct from old.end_requested_at and new.end_requested_at is not null then
    new.end_requested_at := now(); new.end_requested_by := me;
  end if;
  if new.ended_at is distinct from old.ended_at and new.ended_at is not null and old.ended_at is null then
    if mrole <> 'admin' and not admin_absent(new.id) then raise exception 'La reunión la finaliza el administrador'; end if;
    new.ended_at := coalesce(old.end_requested_at, new.end_requested_at, now());
    new.ended_set_at := now(); new.ended_by := me;
  end if;
  if old.ended_at is not null and new.ended_at is null then
    if old.ended_by is distinct from me or now() > coalesce(old.ended_set_at, old.ended_at) + undo then raise exception 'Solo se deshace en los primeros 10 minutos'; end if;
    new.ended_set_at := null; new.ended_by := null;
  end if;
  if new.status is distinct from old.status then
    if old.status = 'cancelado' and new.status = 'activo' then
      if mrole <> 'admin' or old.canceled_at is null or now() > old.canceled_at + undo then raise exception 'Solo se deshace en los primeros 10 minutos'; end if;
      new.canceled_at := null; new.cancel_note := null;
    else
      if new.status = 'cancelado' and mrole <> 'admin' then raise exception 'Solo el administrador cancela'; end if;
      if old.status <> 'activo' then raise exception 'Ya no está activo'; end if;
      if new.status = 'cancelado' then new.canceled_at := now(); end if;
    end if;
  end if;
  if new.starts_at is distinct from old.starts_at then
    if exists (select 1 from attendance where event_id = new.id and (arrived_at is not null or claimed_at is not null)) then
      raise exception 'Ya hay llegadas registradas: reprograma en vez de cambiar la hora';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists events_guard on events;
create trigger events_guard before insert or update on events for each row execute function guard_event();

-- ---------- Fecha de publicación y montaje adelantado ----------
-- Antes del rodaje los cambian los socios (al programar o repartir); después, solo el administrador.
create or replace function guard_video() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.publish_date is distinct from old.publish_date or new.apoyo_due is distinct from old.apoyo_due)
     and not is_admin(new.team_id)
     and exists (select 1 from tasks where video_id = new.id and kind = 'rodaje' and not void) then
    raise exception 'Después del rodaje, la fecha de publicación la cambia el administrador';
  end if;
  return new;
end $$;
drop trigger if exists videos_guard on videos;
create trigger videos_guard before update on videos for each row execute function guard_video();

-- ---------- Propuestas (1.4): validar "Entregas al límite" ----------
create or replace function check_rules(r jsonb) returns void
language plpgsql immutable as $$
begin
  if r ? 'mon' and (r->>'mon')::int < 2 then raise exception 'El apoyo tiene que ser de al menos 2 días'; end if;
  if coalesce((r->>'self')::int, 480) >= coalesce((r->>'auto')::int, 720) or coalesce((r->>'auto')::int, 720) >= coalesce((r->>'fix')::int, 1020) or coalesce((r->>'fix')::int, 1020) >= 1439 then
    raise exception 'Las horas tienen que ir en orden: entrega por su cuenta, pasa al administrador, corregir';
  end if;
end $$;
create or replace function guard_proposal_rules() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.kind = 'rules' then
    perform check_rules(coalesce((select settings->'rules' from teams where id = new.team_id), '{}') || new.data);
  end if;
  return new;
end $$;
drop trigger if exists proposals_rules_guard on proposals;
create trigger proposals_rules_guard before insert on proposals for each row execute function guard_proposal_rules();

-- ---------- 1.4 · Invitaciones (arreglo) e Integrantes ----------
-- El código ya no depende de pgcrypto (en Supabase vive en otro esquema y daba "gen_random_bytes does not exist").
create or replace function create_invite(t uuid, invite_name text, invite_role text, gets_apoyo boolean default false) returns text
language plpgsql security definer set search_path = public as $$
declare c text := upper(substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 8));
begin
  if not is_admin(t) then raise exception 'Solo el administrador invita'; end if;
  if invite_role not in ('socio', 'colaborador') then raise exception 'Rol no válido'; end if;
  if coalesce(trim(invite_name), '') = '' then raise exception 'Escribe un nombre'; end if;
  insert into members (team_id, name, role, apoyo, invite_code, invite_expires)
  values (t, trim(invite_name), invite_role, invite_role = 'socio' and gets_apoyo, c, now() + interval '7 days');
  insert into log (team_id, actor, type, data) values (t, my_member(t), 'invite', jsonb_build_object('name', trim(invite_name), 'role', invite_role));
  return c;
end $$;
-- Nuevo enlace para una invitación vencida o perdida.
create or replace function renew_invite(m uuid) returns text
language plpgsql security definer set search_path = public as $$
declare mm members; c text := upper(substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 8));
begin
  select * into mm from members where id = m;
  if mm.id is null or not is_admin(mm.team_id) then raise exception 'Solo el administrador invita'; end if;
  if mm.user_id is not null then raise exception 'Ya entró al equipo'; end if;
  update members set invite_code = c, invite_expires = now() + interval '7 days', active = true where id = m;
  return c;
end $$;
grant execute on function create_invite, renew_invite to authenticated;

create or replace function save_settings(t uuid, k text, v jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s jsonb;
begin
  if not is_admin(t) then raise exception 'Solo el administrador cambia los ajustes'; end if;
  if k not in ('look', 'reminders', 'guillermo') then raise exception 'Ese ajuste se cambia con una propuesta'; end if;
  update teams set settings = jsonb_set(coalesce(settings, '{}'), array[k], v) where id = t returning settings into s;
  insert into log (team_id, actor, type, data) values (t, my_member(t), 'settings.' || k, jsonb_build_object('new', v));
  return s;
end $$;

-- ---------- 1.4 · Reprogramar la entrega (solo el administrador, cualquier video sin entregar) ----------
-- Los plazos se mueven con la fecha. Si ya estaba vencida, resta 3 puntos a quien la tenía en sus manos.
create or replace function reprogram_delivery(v uuid, new_date date, note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare vv videos; ow members; d record; ph text; me uuid; adm uuid; ac tasks; cl claims; mo tasks; charge uuid; hand jsonb; late boolean; jm uuid;
begin
  select * into vv from videos where id = v;
  if vv.id is null or not is_admin(vv.team_id) then raise exception 'Solo el administrador reprograma la entrega'; end if;
  me := my_member(vv.team_id); adm := me;
  select * into ow from members where id = vv.owner;
  if new_date is null or new_date <= lima_day(now()) then raise exception 'Elige una fecha desde mañana'; end if;
  if new_date = vv.publish_date then raise exception 'Es la misma fecha'; end if;
  ph := post_phase(v);
  select * into ac from tasks where video_id = v and kind = 'acabado' and not void;
  if ph = 'aprobado' or (ac.id is not null and ph not in ('revision', 'cambios')) then raise exception 'Ese video ya se entregó'; end if;
  select * into d from post_dues(v);
  late := now() > d.fin and exists (select 1 from tasks where video_id = v and kind = 'rodaje' and not void);
  select * into mo from tasks where video_id = v and kind = 'montaje' and not void;
  select j.member_id into jm from jobs j where v = any(j.video_ids) and j.status in ('invitado', 'activo', 'finalizado', 'cerrado') limit 1;
  charge := case when jm is not null then jm
                 when ph = 'pasado' or vv.owner = adm or (ph = 'apoyo' and mo.id is not null) then adm
                 else vv.owner end;
  hand := vv.handoff;
  if ph = 'pasado' and hand is null and coalesce(ow.apoyo, false) then
    select * into cl from claims where video_id = v and kind = 'montaje' and status = 'activa' order by created_at limit 1;
    hand := jsonb_build_object('at', case when cl.id is not null then cl.created_at
                                          when mo.id is not null and mo.done_by <> vv.owner then mo.done_at
                                          when ac.review = 'rechazada' then ac.review_at
                                          when ac.review = 'cambios' then d.fix
                                          else d.auto end,
                               'why', case when cl.id is not null or (mo.id is not null and mo.done_by <> vv.owner) then 'tomado' when ac.review = 'rechazada' then 'rechazo' else 'auto' end);
  end if;
  update videos set
    apoyo_due = case when apoyo_due is null then null else apoyo_due + make_interval(days => new_date - publish_date) end,
    handoff = hand,
    reprog = coalesce(reprog, '[]') || jsonb_build_array(jsonb_build_object('from', publish_date, 'to', new_date, 'at', now(), 'by', me, 'late', late, 'charge', charge, 'note', nullif(trim(coalesce(note, '')), ''))),
    publish_date = new_date
  where id = v;
  update claims set limit_at = (select fin from post_dues(v)) where video_id = v and kind = 'montaje';
end $$;
grant execute on function reprogram_delivery to authenticated;

-- ---------- 1.4 · Colaborador externo: encargos, revisiones como checklist y entrega en Drive ----------
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  member_id uuid not null references members(id),
  service text not null default 'edicion',
  video_ids uuid[] not null default '{}',
  price numeric(10,2) not null,                 -- monto acordado por video (montaje + final)
  payer text not null default 'owner',          -- quién pone el excedente sobre S/ 25: owner (dueño de los videos) | half | tbd
  drive_url text,
  status text not null default 'propuesto' check (status in ('propuesto', 'invitado', 'activo', 'finalizado', 'cerrado', 'rechazado', 'cancelado')),
  proposed_by uuid references members(id),
  decided_by uuid references members(id),
  decided_at timestamptz,
  accepted_at timestamptz,
  finished_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists job_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  stage text not null default 'montaje' check (stage in ('montaje', 'rev1', 'aj1', 'final', 'rev2', 'aj2', 'upload', 'done')),
  obs1 jsonb not null default '[]',
  obs2 jsonb not null default '[]',
  montaje_at timestamptz,
  final_at timestamptz,
  uploaded_at timestamptz,
  prev jsonb,                                   -- para deshacer el último paso (10 min)
  unique (job_id, video_id)
);
alter table jobs enable row level security;
alter table job_items enable row level security;
drop policy if exists jobs_read on jobs;
create policy jobs_read on jobs for select using (is_partner(team_id));
drop policy if exists jobs_insert on jobs;
create policy jobs_insert on jobs for insert with check (is_admin(team_id));
drop policy if exists jobs_update on jobs;
create policy jobs_update on jobs for update using (is_partner(team_id));
drop policy if exists job_items_read on job_items;
create policy job_items_read on job_items for select using (is_partner(team_id));
drop trigger if exists jobs_log on jobs;
create trigger jobs_log after insert or update on jobs for each row execute function log_change();
drop trigger if exists job_items_log on job_items;
create trigger job_items_log after update on job_items for each row execute function log_change();

create or replace function guard_job() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := my_member(new.team_id); n int; rpc boolean := coalesce(current_setting('app.job', true), '') = '1';
begin
  if tg_op = 'INSERT' then
    if not is_admin(new.team_id) then raise exception 'El encargo lo arma el administrador'; end if;
    if (select role from members where id = new.member_id) <> 'colaborador' then raise exception 'Elige un colaborador'; end if;
    if coalesce(array_length(new.video_ids, 1), 0) = 0 then raise exception 'Elige al menos un video'; end if;
    if new.price is null or new.price <= 0 then raise exception 'Escribe el monto por video'; end if;
    if new.payer not in ('owner', 'half', 'tbd') then raise exception 'Quién cubre el excedente no es válido'; end if;
    if exists (select 1 from videos x where x.id = any(new.video_ids) and x.project_id <> new.project_id) then raise exception 'Los videos tienen que ser del proyecto'; end if;
    if exists (select 1 from tasks t where t.video_id = any(new.video_ids) and t.kind in ('montaje', 'acabado') and not t.void) then raise exception 'Algún video ya tiene montaje o final'; end if;
    if exists (select 1 from jobs j where j.video_ids && new.video_ids and j.status in ('propuesto', 'invitado', 'activo', 'finalizado', 'cerrado')) then raise exception 'Algún video ya está en otro encargo'; end if;
    select count(*) into n from members where team_id = new.team_id and role in ('admin', 'socio') and active and user_id is not null and id <> me;
    new.status := case when n = 0 then 'invitado' else 'propuesto' end;
    new.proposed_by := me; new.decided_by := null; new.decided_at := null; new.accepted_at := null; new.finished_at := null; new.closed_at := null; new.created_at := now();
    return new;
  end if;
  if (new.price, new.payer, new.video_ids, new.member_id, new.service) is distinct from (old.price, old.payer, old.video_ids, old.member_id, old.service) then
    if old.status <> 'propuesto' or not is_admin(new.team_id) then raise exception 'El encargo ya se aprobó: no se cambia'; end if;
  end if;
  if new.status is distinct from old.status then
    if old.status = 'propuesto' and new.status in ('invitado', 'rechazado') then
      if me = old.proposed_by then raise exception 'Lo aprueba tu socio'; end if;
      new.decided_by := me; new.decided_at := now();
    elsif new.status = 'cancelado' and old.status in ('propuesto', 'invitado') then
      if not is_admin(new.team_id) then raise exception 'Solo el administrador cancela'; end if;
    elsif old.status = 'invitado' and new.status = 'activo' and rpc then new.accepted_at := now();
    elsif old.status = 'activo' and new.status = 'finalizado' and rpc then new.finished_at := now();
    elsif old.status = 'finalizado' and new.status = 'activo' and rpc then new.finished_at := null;
    elsif old.status = 'finalizado' and new.status = 'cerrado' then
      if not is_partner(new.team_id) then raise exception 'Sin permiso'; end if;
      new.closed_at := now();
    else raise exception 'Ese cambio de estado no se puede';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists jobs_guard on jobs;
create trigger jobs_guard before insert or update on jobs for each row execute function guard_job();
-- Un renglón por video del encargo.
create or replace function job_make_items() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into job_items (team_id, job_id, video_id) select new.team_id, new.id, x from unnest(new.video_ids) x on conflict do nothing;
  return null;
end $$;
drop trigger if exists jobs_items on jobs;
create trigger jobs_items after insert on jobs for each row execute function job_make_items();

-- Lo que ve el colaborador (sin presupuesto, tope ni quién cubre el excedente).
create or replace function colab_home(t uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'me', (select jsonb_build_object('id', m.id, 'name', m.name, 'phone', m.phone, 'role', m.role) from members m where m.id = my_member(t)),
    'team', (select name from teams where id = t),
    'partners', (select coalesce(jsonb_agg(jsonb_build_object('name', p.name, 'role', p.role, 'phone', p.phone)), '[]') from members p where p.team_id = t and p.role in ('admin', 'socio') and p.active and p.user_id is not null),
    'jobs', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', j.id, 'status', j.status, 'service', j.service, 'price', j.price, 'drive_url', j.drive_url,
        'accepted_at', j.accepted_at, 'finished_at', j.finished_at, 'closed_at', j.closed_at,
        'project', (select jsonb_build_object('client', pr.client, 'name', pr.name) from projects pr where pr.id = j.project_id),
        'videos', (select coalesce(jsonb_agg(jsonb_build_object(
            'id', v.id, 'num', v.num, 'title', v.title, 'publish_date', v.publish_date,
            'montaje_due', lima_at(v.publish_date - 3, '21:00'), 'final_due', lima_at(v.publish_date - 1, '18:00'),
            'shot', exists (select 1 from tasks k where k.video_id = v.id and k.kind = 'rodaje' and not k.void),
            'item', (select jsonb_build_object('id', i.id, 'stage', i.stage, 'obs1', i.obs1, 'obs2', i.obs2, 'montaje_at', i.montaje_at, 'final_at', i.final_at, 'uploaded_at', i.uploaded_at, 'prev_at', i.prev->>'at', 'prev_by', i.prev->>'by') from job_items i where i.job_id = j.id and i.video_id = v.id)
          ) order by v.num), '[]') from videos v where v.id = any(j.video_ids))
      ) order by j.created_at), '[]') from jobs j where j.member_id = my_member(t) and j.status in ('invitado', 'activo', 'finalizado', 'cerrado'))
  )
$$;

-- Paso de un video del encargo. Lo hace el colaborador (entregas, checklist, Drive) o un socio (revisiones).
-- Guarda el estado anterior para poder deshacerlo 10 minutos.
create or replace function job_step(item uuid, act text, obs text[] default null, idx int default null) returns text
language plpgsql security definer set search_path = public as $$
declare i job_items; j jobs; me uuid; mrole text; nx text; tk uuid; arr jsonb; pv jsonb;
begin
  select * into i from job_items where id = item;
  select * into j from jobs where id = i.job_id;
  if i.id is null then raise exception 'No encontrado'; end if;
  me := my_member(j.team_id);
  select role into mrole from members where id = me;
  pv := jsonb_build_object('stage', i.stage, 'obs1', i.obs1, 'obs2', i.obs2, 'montaje_at', i.montaje_at, 'final_at', i.final_at, 'uploaded_at', i.uploaded_at, 'at', now(), 'by', me, 'act', act);
  perform set_config('app.job', '1', true);
  if act in ('montaje', 'final', 'check', 'upload', 'uploaded') then
    if me <> j.member_id then raise exception 'Solo el colaborador del encargo'; end if;
    if j.status <> 'activo' then raise exception 'El encargo no está activo'; end if;
    if act = 'montaje' then
      if i.stage <> 'montaje' then raise exception 'El montaje ya se entregó'; end if;
      if not exists (select 1 from tasks where video_id = i.video_id and kind = 'rodaje' and not void) then raise exception 'Primero tiene que grabarse el video'; end if;
      insert into tasks (team_id, project_id, video_id, kind, done_by) values (j.team_id, j.project_id, i.video_id, 'montaje', me) returning id into tk;
      update job_items set stage = 'rev1', montaje_at = now(), prev = pv || jsonb_build_object('task', tk) where id = item;
      return 'rev1';
    elsif act = 'final' then
      if not (i.stage = 'final' or (i.stage = 'aj1' and not exists (select 1 from jsonb_array_elements(i.obs1) o where not coalesce((o->>'done')::boolean, false)))) then raise exception 'Primero marca todos los ajustes'; end if;
      update job_items set stage = 'rev2', final_at = coalesce(final_at, now()), prev = pv where id = item;
      return 'rev2';
    elsif act = 'check' then
      if i.stage not in ('aj1', 'aj2') or idx is null then raise exception 'No hay ajustes por marcar'; end if;
      arr := case when i.stage = 'aj1' then i.obs1 else i.obs2 end;
      if idx < 0 or idx >= jsonb_array_length(arr) then raise exception 'Ajuste no válido'; end if;
      arr := jsonb_set(arr, array[idx::text, 'done'], to_jsonb(not coalesce((arr->idx->>'done')::boolean, false)));
      if i.stage = 'aj1' then update job_items set obs1 = arr where id = item; else update job_items set obs2 = arr where id = item; end if;
      return i.stage;
    elsif act = 'upload' then
      if not (i.stage = 'aj2' and not exists (select 1 from jsonb_array_elements(i.obs2) o where not coalesce((o->>'done')::boolean, false))) then raise exception 'Primero marca todos los ajustes'; end if;
      update job_items set stage = 'upload', prev = pv where id = item;
      return 'upload';
    else
      if i.stage <> 'upload' then raise exception 'Todavía no está aprobado'; end if;
      insert into tasks (team_id, project_id, video_id, kind, done_by) values (j.team_id, j.project_id, i.video_id, 'acabado', me) returning id into tk;
      update job_items set stage = 'done', uploaded_at = now(), prev = pv || jsonb_build_object('task', tk) where id = item;
      return 'done';
    end if;
  elsif act in ('ok', 'obs') then
    if not is_partner(j.team_id) then raise exception 'Revisan los socios'; end if;
    if j.status not in ('activo', 'finalizado') then raise exception 'El encargo no está activo'; end if;
    if i.stage not in ('rev1', 'rev2') then raise exception 'No hay nada por revisar'; end if;
    if act = 'obs' then
      if obs is null or array_length(obs, 1) is null then raise exception 'Escribe al menos una observación'; end if;
      arr := (select jsonb_agg(jsonb_build_object('t', trim(x), 'done', false)) from unnest(obs) x where trim(x) <> '');
      if arr is null then raise exception 'Escribe al menos una observación'; end if;
    end if;
    nx := case when i.stage = 'rev1' then (case when act = 'ok' then 'final' else 'aj1' end) else (case when act = 'ok' then 'upload' else 'aj2' end) end;
    update job_items set stage = nx, prev = pv,
      obs1 = case when i.stage = 'rev1' and act = 'obs' then arr else obs1 end,
      obs2 = case when i.stage = 'rev2' and act = 'obs' then arr else obs2 end where id = item;
    return nx;
  end if;
  raise exception 'Acción no válida';
end $$;
-- Deshacer el último paso: 10 minutos y solo quien lo hizo.
create or replace function job_undo(item uuid) returns text
language plpgsql security definer set search_path = public as $$
declare i job_items; j jobs; me uuid;
begin
  select * into i from job_items where id = item;
  select * into j from jobs where id = i.job_id;
  me := my_member(j.team_id);
  if i.prev is null or (i.prev->>'by')::uuid is distinct from me or now() > (i.prev->>'at')::timestamptz + make_interval(mins => rule_int(j.team_id, 'undo', 10)) then
    raise exception 'Solo se deshace en los primeros 10 minutos';
  end if;
  if j.status not in ('activo', 'finalizado') then raise exception 'El encargo ya se cerró'; end if;
  if i.prev ? 'task' then delete from tasks where id = (i.prev->>'task')::uuid; end if;
  update job_items set stage = i.prev->>'stage', obs1 = i.prev->'obs1', obs2 = i.prev->'obs2',
    montaje_at = (i.prev->>'montaje_at')::timestamptz, final_at = (i.prev->>'final_at')::timestamptz, uploaded_at = (i.prev->>'uploaded_at')::timestamptz, prev = null where id = item;
  if j.status = 'finalizado' then perform set_config('app.job', '1', true); update jobs set status = 'activo' where id = j.id; end if;
  return i.prev->>'stage';
end $$;
-- El colaborador acepta las condiciones y, al terminar todo, marca el servicio como finalizado.
create or replace function job_accept(job uuid) returns void
language plpgsql security definer set search_path = public as $$
declare j jobs;
begin
  select * into j from jobs where id = job;
  if j.member_id is distinct from my_member(j.team_id) then raise exception 'Este encargo no es tuyo'; end if;
  if j.status <> 'invitado' then raise exception 'El encargo no está esperando tu respuesta'; end if;
  perform set_config('app.job', '1', true);
  update jobs set status = 'activo' where id = job;
end $$;
create or replace function job_finish(job uuid) returns void
language plpgsql security definer set search_path = public as $$
declare j jobs;
begin
  select * into j from jobs where id = job;
  if j.member_id is distinct from my_member(j.team_id) then raise exception 'Este encargo no es tuyo'; end if;
  if exists (select 1 from job_items where job_id = job and stage <> 'done') then raise exception 'Faltan videos por terminar'; end if;
  perform set_config('app.job', '1', true);
  update jobs set status = 'finalizado' where id = job;
end $$;
grant execute on function colab_home, job_step, job_undo, job_accept, job_finish to authenticated;
