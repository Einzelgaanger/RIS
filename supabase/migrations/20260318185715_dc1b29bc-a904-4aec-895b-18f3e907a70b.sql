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

  update public.profiles
  set full_name = case
        when coalesce(full_name, '') = '' then coalesce(matched_invitation.full_name, full_name)
        else full_name
      end,
      organization = case
        when coalesce(organization, '') = '' then coalesce(matched_invitation.organization, organization)
        else organization
      end,
      updated_at = now()
  where user_id = auth.uid();

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