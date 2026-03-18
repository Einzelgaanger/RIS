-- Core auth/profile/roles foundation
create type public.app_role as enum ('admin', 'manager', 'professional');

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text not null unique,
  full_name text,
  avatar_url text,
  organization text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'professional')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Admins and managers can view all profiles"
on public.profiles
for select
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'));

create policy "Users can view own roles"
on public.user_roles
for select
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles
for select
using (public.has_role(auth.uid(), 'admin'));

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  organization text,
  division text,
  title text,
  country text,
  city text,
  remote boolean not null default false,
  line_manager text,
  contractual_status text,
  fte_status numeric,
  tier smallint,
  skills jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  pricing jsonb not null default '{}'::jsonb,
  weekly_availability integer,
  monthly_availability integer,
  reliability_score integer,
  quality_score integer,
  profile_completeness integer,
  ai_bid_ready_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resources enable row level security;

create index if not exists idx_resources_created_by on public.resources(created_by);
create index if not exists idx_resources_profile_id on public.resources(profile_id);
create index if not exists idx_resources_skills on public.resources using gin (skills);

create policy "Authenticated users can view resources"
on public.resources
for select
to authenticated
using (true);

create policy "Admins and managers can create resources"
on public.resources
for insert
to authenticated
with check (
  (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'))
  and created_by = auth.uid()
);

create policy "Admins and managers can update resources"
on public.resources
for update
to authenticated
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'))
with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'));

create policy "Admins can delete resources"
on public.resources
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  name text not null,
  client text,
  description text,
  source_type text not null default 'manual',
  source_document_name text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;
create index if not exists idx_projects_created_by on public.projects(created_by);

create policy "Authenticated users can view projects"
on public.projects
for select
to authenticated
using (true);

create policy "Admins and managers can create projects"
on public.projects
for insert
to authenticated
with check (
  (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'))
  and created_by = auth.uid()
);

create policy "Project creators and admins/managers can update projects"
on public.projects
for update
to authenticated
using (
  created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager')
)
with check (
  created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager')
);

create policy "Admins can delete projects"
on public.projects
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  client text,
  description text,
  required_skills text[] not null default '{}',
  experience_level text,
  location text,
  start_date date,
  end_date date,
  effort_days integer,
  daily_rate numeric,
  status text not null default 'draft',
  visibility text not null default 'internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.opportunities enable row level security;
create index if not exists idx_opportunities_created_by on public.opportunities(created_by);
create index if not exists idx_opportunities_project_id on public.opportunities(project_id);

create policy "Authenticated users can view opportunities"
on public.opportunities
for select
to authenticated
using (true);

create policy "Admins and managers can create opportunities"
on public.opportunities
for insert
to authenticated
with check (
  (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'))
  and created_by = auth.uid()
);

create policy "Creators/admins/managers can update opportunities"
on public.opportunities
for update
to authenticated
using (
  created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager')
)
with check (
  created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager')
);

create policy "Admins can delete opportunities"
on public.opportunities
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists opportunities_set_updated_at on public.opportunities;
create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

create table if not exists public.opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  applicant_user_id uuid not null,
  resource_id uuid references public.resources(id) on delete set null,
  status text not null default 'interested',
  applied_at timestamptz not null default now(),
  unique (opportunity_id, applicant_user_id)
);

alter table public.opportunity_applications enable row level security;
create index if not exists idx_opportunity_applications_opportunity_id on public.opportunity_applications(opportunity_id);
create index if not exists idx_opportunity_applications_applicant on public.opportunity_applications(applicant_user_id);

create policy "Applicants can view own applications"
on public.opportunity_applications
for select
to authenticated
using (
  applicant_user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
);

create policy "Professionals can create own applications"
on public.opportunity_applications
for insert
to authenticated
with check (applicant_user_id = auth.uid());

create policy "Applicants and admins/managers can update applications"
on public.opportunity_applications
for update
to authenticated
using (
  applicant_user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
)
with check (
  applicant_user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  project_id uuid references public.projects(id) on delete set null,
  linked_opportunity_id uuid references public.opportunities(id) on delete set null,
  title text not null,
  client text,
  description text,
  uploaded_document_name text,
  status text not null default 'draft',
  total_budget numeric,
  builder_mode text not null default 'ai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.proposals enable row level security;
create index if not exists idx_proposals_created_by on public.proposals(created_by);
create index if not exists idx_proposals_project_id on public.proposals(project_id);

create policy "Authenticated users can view proposals"
on public.proposals
for select
to authenticated
using (true);

create policy "Admins and managers can create proposals"
on public.proposals
for insert
to authenticated
with check (
  (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'))
  and created_by = auth.uid()
);

create policy "Creators/admins/managers can update proposals"
on public.proposals
for update
to authenticated
using (
  created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager')
)
with check (
  created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager')
);

create policy "Admins can delete proposals"
on public.proposals
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists proposals_set_updated_at on public.proposals;
create trigger proposals_set_updated_at
  before update on public.proposals
  for each row execute function public.set_updated_at();

create table if not exists public.proposal_requirements (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  role_name text not null,
  required_skills text[] not null default '{}',
  experience_level text,
  effort_days integer,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

alter table public.proposal_requirements enable row level security;
create index if not exists idx_proposal_requirements_proposal_id on public.proposal_requirements(proposal_id);

create policy "Authenticated users can view proposal requirements"
on public.proposal_requirements
for select
to authenticated
using (true);

create policy "Admins and managers can create proposal requirements"
on public.proposal_requirements
for insert
to authenticated
with check (
  exists (
    select 1 from public.proposals p
    where p.id = proposal_id
      and (p.created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'))
  )
);

create policy "Admins and managers can update proposal requirements"
on public.proposal_requirements
for update
to authenticated
using (
  exists (
    select 1 from public.proposals p
    where p.id = proposal_id
      and (p.created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'))
  )
)
with check (
  exists (
    select 1 from public.proposals p
    where p.id = proposal_id
      and (p.created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'))
  )
);

create policy "Admins can delete proposal requirements"
on public.proposal_requirements
for delete
to authenticated
using (
  exists (
    select 1 from public.proposals p
    where p.id = proposal_id
      and public.has_role(auth.uid(), 'admin')
  )
);

create table if not exists public.team_selections (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  requirement_id uuid references public.proposal_requirements(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete set null,
  role_name text not null,
  builder_mode text not null default 'ai',
  match_score integer,
  daily_rate numeric,
  total_cost numeric,
  match_reasons jsonb not null default '[]'::jsonb,
  selected boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.team_selections enable row level security;
create index if not exists idx_team_selections_proposal_id on public.team_selections(proposal_id);
create index if not exists idx_team_selections_requirement_id on public.team_selections(requirement_id);

create policy "Authenticated users can view team selections"
on public.team_selections
for select
to authenticated
using (true);

create policy "Admins and managers can create team selections"
on public.team_selections
for insert
to authenticated
with check (
  exists (
    select 1 from public.proposals p
    where p.id = proposal_id
      and (p.created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'))
  )
);

create policy "Admins and managers can update team selections"
on public.team_selections
for update
to authenticated
using (
  exists (
    select 1 from public.proposals p
    where p.id = proposal_id
      and (p.created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'))
  )
)
with check (
  exists (
    select 1 from public.proposals p
    where p.id = proposal_id
      and (p.created_by = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'))
  )
);

create policy "Admins can delete team selections"
on public.team_selections
for delete
to authenticated
using (
  exists (
    select 1 from public.proposals p
    where p.id = proposal_id
      and public.has_role(auth.uid(), 'admin')
  )
);