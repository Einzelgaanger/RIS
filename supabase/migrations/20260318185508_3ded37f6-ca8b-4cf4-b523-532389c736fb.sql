-- Workspace setup for admin and manager tooling
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (name)
);

alter table public.departments enable row level security;

create policy "Authenticated users can view departments"
on public.departments
for select
to authenticated
using (true);

create policy "Admins and managers can create departments"
on public.departments
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'manager')
  )
);

create policy "Admins and managers can update departments"
on public.departments
for update
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
)
with check (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
);

create policy "Admins can delete departments"
on public.departments
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  description text,
  manager_user_id uuid,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (department_id, name)
);

alter table public.teams enable row level security;

create policy "Authenticated users can view teams"
on public.teams
for select
to authenticated
using (true);

create policy "Admins and managers can create teams"
on public.teams
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'manager')
  )
);

create policy "Admins and managers can update teams"
on public.teams
for update
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
)
with check (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
);

create policy "Admins can delete teams"
on public.teams
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create table public.management_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  title text,
  phone text,
  office_location text,
  bio text,
  responsibilities text[] not null default '{}',
  department_id uuid references public.departments(id) on delete set null,
  primary_team_id uuid references public.teams(id) on delete set null,
  manager_user_id uuid,
  onboarding_completed boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.management_profiles enable row level security;

create policy "Admins and managers can view management profiles"
on public.management_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
);

create policy "Admins and managers can create management profiles"
on public.management_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

create policy "Admins and managers can update management profiles"
on public.management_profiles
for update
to authenticated
using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
)
with check (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

create policy "Admins can delete management profiles"
on public.management_profiles
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null,
  department_id uuid references public.departments(id) on delete set null,
  job_title text,
  is_team_lead boolean not null default false,
  joined_at timestamp with time zone not null default now(),
  created_by uuid not null,
  unique (team_id, user_id)
);

alter table public.team_members enable row level security;

create policy "Authenticated users can view team members"
on public.team_members
for select
to authenticated
using (true);

create policy "Admins and managers can create team members"
on public.team_members
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'manager')
  )
);

create policy "Admins and managers can update team members"
on public.team_members
for update
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
)
with check (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
);

create policy "Admins can delete team members"
on public.team_members
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  role public.app_role not null,
  title text,
  organization text,
  department_id uuid references public.departments(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  invited_by uuid not null,
  status public.invitation_status not null default 'pending',
  invite_token uuid not null default gen_random_uuid(),
  expires_at timestamp with time zone not null default (now() + interval '14 days'),
  accepted_at timestamp with time zone,
  accepted_user_id uuid,
  note text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index idx_workspace_invitations_email on public.workspace_invitations (lower(email));
create index idx_workspace_invitations_status on public.workspace_invitations (status);

alter table public.workspace_invitations enable row level security;

create policy "Admins and managers can view invitations"
on public.workspace_invitations
for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or invited_by = auth.uid()
  or (public.has_role(auth.uid(), 'manager') and role = 'professional')
);

create policy "Admins and managers can create invitations"
on public.workspace_invitations
for insert
to authenticated
with check (
  invited_by = auth.uid()
  and (
    public.has_role(auth.uid(), 'admin')
    or (
      public.has_role(auth.uid(), 'manager')
      and role = 'professional'
    )
  )
);

create policy "Admins and managers can update invitations"
on public.workspace_invitations
for update
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or invited_by = auth.uid()
)
with check (
  (
    public.has_role(auth.uid(), 'admin')
    or invited_by = auth.uid()
  )
  and (
    public.has_role(auth.uid(), 'admin')
    or role = 'professional'
  )
);

create policy "Admins and managers can delete invitations"
on public.workspace_invitations
for delete
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or invited_by = auth.uid()
);

create or replace function public.ensure_management_profile(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.user_roles
    where user_id = target_user_id
      and role in ('admin', 'manager')
  ) then
    insert into public.management_profiles (user_id)
    values (target_user_id)
    on conflict (user_id) do nothing;
  end if;
end;
$$;

create or replace function public.claim_pending_invitation()
returns public.workspace_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles;
  matched_invitation public.workspace_invitations;
begin
  if auth.uid() is null then
    return null;
  end if;

  select *
  into current_profile
  from public.profiles
  where user_id = auth.uid()
  limit 1;

  if current_profile.user_id is null then
    return null;
  end if;

  select *
  into matched_invitation
  from public.workspace_invitations
  where lower(email) = lower(current_profile.email)
    and status = 'pending'
    and accepted_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if matched_invitation.id is null then
    return null;
  end if;

  delete from public.user_roles
  where user_id = auth.uid();

  insert into public.user_roles (user_id, role)
  values (auth.uid(), matched_invitation.role)
  on conflict (user_id, role) do nothing;

  update public.workspace_invitations
  set status = 'accepted',
      accepted_at = now(),
      accepted_user_id = auth.uid(),
      updated_at = now()
  where id = matched_invitation.id
  returning * into matched_invitation;

  if matched_invitation.role in ('admin', 'manager') then
    perform public.ensure_management_profile(auth.uid());

    update public.management_profiles
    set title = coalesce(title, matched_invitation.title),
        department_id = coalesce(department_id, matched_invitation.department_id),
        primary_team_id = coalesce(primary_team_id, matched_invitation.team_id),
        updated_at = now()
    where user_id = auth.uid();
  end if;

  if matched_invitation.team_id is not null then
    insert into public.team_members (team_id, user_id, department_id, job_title, is_team_lead, created_by)
    values (
      matched_invitation.team_id,
      auth.uid(),
      matched_invitation.department_id,
      matched_invitation.title,
      false,
      matched_invitation.invited_by
    )
    on conflict (team_id, user_id)
    do update set
      department_id = excluded.department_id,
      job_title = excluded.job_title;
  end if;

  return matched_invitation;
end;
$$;

create or replace function public.bootstrap_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count integer;
begin
  if auth.uid() is null then
    return false;
  end if;

  select count(*) into admin_count
  from public.user_roles
  where role = 'admin';

  if admin_count > 0 then
    return false;
  end if;

  insert into public.user_roles (user_id, role)
  values (auth.uid(), 'admin')
  on conflict (user_id, role) do nothing;

  perform public.ensure_management_profile(auth.uid());

  return true;
end;
$$;

create or replace function public.set_user_role(target_user_id uuid, new_role app_role)
returns public.user_roles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_role public.user_roles;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only admins can change roles';
  end if;

  delete from public.user_roles
  where user_id = target_user_id;

  insert into public.user_roles (user_id, role)
  values (target_user_id, new_role)
  returning * into updated_role;

  perform public.ensure_management_profile(target_user_id);

  return updated_role;
end;
$$;

create trigger set_departments_updated_at
before update on public.departments
for each row
execute function public.set_updated_at();

create trigger set_teams_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

create trigger set_management_profiles_updated_at
before update on public.management_profiles
for each row
execute function public.set_updated_at();

create trigger set_workspace_invitations_updated_at
before update on public.workspace_invitations
for each row
execute function public.set_updated_at();