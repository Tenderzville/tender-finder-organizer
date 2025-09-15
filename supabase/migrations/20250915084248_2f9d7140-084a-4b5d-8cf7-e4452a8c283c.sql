-- Phase 1: Critical Security Fixes

-- 1. Fix Profile Data Exposure - Update RLS policies for profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create more restrictive profile policies
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by authenticated users" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  (auth.uid() = user_id OR 
   notification_preferences->>'profile_visibility' = 'public')
);

-- 2. Create Missing Security Tables

-- Create auth_logs table for tracking authentication events
CREATE TABLE public.auth_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  email text,
  event_type text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  ip_address inet,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on auth_logs
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for auth_logs
CREATE POLICY "Users can view their own auth logs" ON public.auth_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all auth logs" ON public.auth_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Service role can manage auth logs" ON public.auth_logs
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- Create security_logs table for audit trail
CREATE TABLE public.security_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for security_logs
CREATE POLICY "Admins can view security logs" ON public.security_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Service role can manage security logs" ON public.security_logs
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- 3. Secure Bid Strategy Data - Add access logging
CREATE POLICY "Enhanced bid strategy access logging" ON public.bid_strategies
FOR SELECT USING (
  auth.uid() = user_id AND
  -- Log access to sensitive bid data
  (SELECT public.log_data_access('bid_strategy_view', auth.uid(), id::text)) IS NOT NULL
);

-- Create data access logging function
CREATE OR REPLACE FUNCTION public.log_data_access(
  access_type text,
  accessing_user_id uuid,
  resource_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_logs (user_id, event_type, details)
  VALUES (
    accessing_user_id,
    access_type,
    jsonb_build_object(
      'resource_id', resource_id,
      'timestamp', now()
    )
  );
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main query if logging fails
    RETURN true;
END;
$$;

-- 4. Update profiles table to include privacy settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'private';

-- Add constraint for valid visibility values
ALTER TABLE public.profiles 
ADD CONSTRAINT profile_visibility_check 
CHECK (profile_visibility IN ('public', 'private', 'contacts_only'));

-- 5. Create indexes for security performance
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON public.auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON public.auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON public.profiles(profile_visibility);

-- 6. Update user points table security
DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
CREATE POLICY "Users can view their own points securely" ON public.user_points
FOR SELECT USING (
  auth.uid() = user_id AND
  (SELECT public.log_data_access('points_view', auth.uid(), id::text)) IS NOT NULL
);