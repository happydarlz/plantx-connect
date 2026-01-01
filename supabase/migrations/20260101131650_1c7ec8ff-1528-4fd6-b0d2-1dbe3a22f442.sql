-- Create trigger function to limit notifications to 40 per user
CREATE OR REPLACE FUNCTION public.limit_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete oldest notifications if user has more than 40
  DELETE FROM public.notifications
  WHERE id IN (
    SELECT id FROM public.notifications
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 40
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger that runs after each notification insert
DROP TRIGGER IF EXISTS limit_notifications_trigger ON public.notifications;
CREATE TRIGGER limit_notifications_trigger
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.limit_user_notifications();

-- Create a scheduled function to delete expired stories (stories older than 24 hours)
-- The delete_expired_stories function already exists, just need to ensure it works
CREATE OR REPLACE FUNCTION public.delete_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < now();
END;
$$;