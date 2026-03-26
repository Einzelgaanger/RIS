
-- Fix notification insert policy to be more restrictive
DROP POLICY "Service and admins can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IS NOT NULL AND (
    user_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'manager')
  )
);

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.notify_user(
  _user_id uuid,
  _type text,
  _title text,
  _message text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (_user_id, _type, _title, _message, _metadata)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_application_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.notify_user(
      NEW.applicant_user_id,
      'application_update',
      'Application status updated',
      'Your application status changed to ' || NEW.status,
      jsonb_build_object('opportunity_id', NEW.opportunity_id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_team_member_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _team_name text;
BEGIN
  SELECT name INTO _team_name FROM public.teams WHERE id = NEW.team_id;
  PERFORM public.notify_user(
    NEW.user_id,
    'team_assignment',
    'Team assignment',
    'You have been added to team: ' || COALESCE(_team_name, 'Unknown'),
    jsonb_build_object('team_id', NEW.team_id)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_opportunity_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user record;
BEGIN
  IF NEW.status = 'open' AND (OLD.status IS NULL OR OLD.status != 'open') THEN
    FOR _user IN
      SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'professional'
    LOOP
      PERFORM public.notify_user(
        _user.user_id,
        'new_opportunity',
        'New opportunity available',
        NEW.title || ' is now open for applications',
        jsonb_build_object('opportunity_id', NEW.id)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_new_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _opp_title text;
  _applicant_name text;
  _manager record;
BEGIN
  SELECT title INTO _opp_title FROM public.opportunities WHERE id = NEW.opportunity_id;
  SELECT full_name INTO _applicant_name FROM public.profiles WHERE user_id = NEW.applicant_user_id;
  
  FOR _manager IN
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role IN ('admin', 'manager')
  LOOP
    PERFORM public.notify_user(
      _manager.user_id,
      'new_application',
      'New application received',
      COALESCE(_applicant_name, 'Someone') || ' expressed interest in ' || COALESCE(_opp_title, 'an opportunity'),
      jsonb_build_object('opportunity_id', NEW.opportunity_id, 'applicant_user_id', NEW.applicant_user_id)
    );
  END LOOP;
  RETURN NEW;
END;
$$;
