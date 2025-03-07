-- Add scraper_logs table to track scraper performance
CREATE TABLE IF NOT EXISTS public.scraper_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name text NOT NULL,
    status text NOT NULL,
    tenders_count integer DEFAULT 0,
    error text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add RLS policies for scraper_logs
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to read scraper logs
CREATE POLICY "Admins can read scraper logs"
    ON public.scraper_logs
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

-- Allow edge functions to insert into scraper_logs
CREATE POLICY "Edge functions can insert scraper logs"
    ON public.scraper_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Add is_admin column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
    END IF;
END $$;
