
-- Allow professionals to update their own resource (linked via profile_id)
CREATE POLICY "Professionals can update own resource"
ON public.resources
FOR UPDATE
TO authenticated
USING (
  profile_id IS NOT NULL AND
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  profile_id IS NOT NULL AND
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Allow professionals to insert their own resource
CREATE POLICY "Professionals can create own resource"
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service and admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Index for fast notification queries
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read, created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification
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

-- Trigger: notify when application status changes
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

CREATE TRIGGER trg_application_status_change
AFTER UPDATE ON public.opportunity_applications
FOR EACH ROW
EXECUTE FUNCTION public.on_application_status_change();

-- Trigger: notify when added to a team
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

CREATE TRIGGER trg_team_member_added
AFTER INSERT ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.on_team_member_added();

-- Trigger: notify when new opportunity is published (open)
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

CREATE TRIGGER trg_opportunity_published
AFTER UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.on_opportunity_published();

-- Trigger: notify admins/managers when someone applies
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

CREATE TRIGGER trg_new_application
AFTER INSERT ON public.opportunity_applications
FOR EACH ROW
EXECUTE FUNCTION public.on_new_application();
