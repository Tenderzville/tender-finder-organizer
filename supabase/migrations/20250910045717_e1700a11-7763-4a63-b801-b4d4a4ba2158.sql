-- Fix RLS for scraping_results table 
ALTER TABLE public.scraping_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role access (needed for edge functions)
CREATE POLICY "Service role can manage scraping results" ON public.scraping_results
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- Allow admins to view scraping results for debugging
CREATE POLICY "Admins can view scraping results" ON public.scraping_results
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);