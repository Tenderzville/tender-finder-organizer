-- Fix Critical Security Issues from Linter

-- 1. Fix all database functions to have proper search_path settings
CREATE OR REPLACE FUNCTION public.check_tender_access(tender_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  required_points integer;
  user_points integer;
BEGIN
  -- Get required points for tender
  SELECT points_required INTO required_points
  FROM public.tenders
  WHERE id = tender_id;

  -- Get user's current points
  SELECT points INTO user_points
  FROM public.user_points
  WHERE user_id = auth.uid();

  -- Return true if user has enough points or tender is free
  RETURN (user_points >= required_points) OR (required_points = 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_scraping_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Clean up any stale jobs
  UPDATE public.scraping_jobs
  SET status = 'failed', 
      error_message = 'Job timed out or was interrupted',
      completed_at = now()
  WHERE status = 'processing' 
  AND started_at < now() - INTERVAL '1 hour';
  
  -- Create initial jobs if none are pending
  IF NOT EXISTS (SELECT 1 FROM public.scraping_jobs WHERE status = 'pending') THEN
    -- MyGov site
    INSERT INTO public.scraping_jobs (source, url, priority)
    VALUES ('mygov', 'https://www.mygov.go.ke/all-tenders', 1);
    
    -- Tenders.go.ke
    INSERT INTO public.scraping_jobs (source, url, priority)
    VALUES ('tenders.go.ke', 'https://tenders.go.ke/website/tenders/index', 2);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_next_scraping_job()
RETURNS TABLE(id uuid, source text, url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  RETURN QUERY
  WITH next_job AS (
    SELECT j.id, j.source, j.url
    FROM public.scraping_jobs j
    WHERE j.status = 'pending'
    ORDER BY j.priority, j.created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.scraping_jobs j
  SET status = 'processing',
      started_at = now()
  FROM next_job
  WHERE j.id = next_job.id
  RETURNING next_job.id, next_job.source, next_job.url;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_scraping_job(p_job_id uuid, p_status text, p_error_message text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE public.scraping_jobs
  SET status = p_status,
      completed_at = now(),
      error_message = p_error_message
  WHERE id = p_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_social_share_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
    -- Award 250 points for social shares
    PERFORM public.update_user_points(NEW.user_id, 250);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_expired_tenders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  DELETE FROM public.tenders
  WHERE deadline < NOW() - INTERVAL '2 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_points(user_id uuid, points_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
    INSERT INTO public.user_points (user_id, points)
    VALUES (user_id, points_to_add)
    ON CONFLICT (user_id)
    DO UPDATE SET
        points = user_points.points + points_to_add,
        updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.award_discussion_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
    PERFORM public.update_user_points(NEW.user_id, 50);  -- Award 50 points for new discussion
    RETURN NEW;
END;
$$;