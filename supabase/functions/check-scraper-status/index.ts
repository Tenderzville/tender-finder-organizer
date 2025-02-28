
// This file is used to check the status of the tender scraper
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client for connecting to database
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking scraper status...');
    
    // Get the latest scraping logs
    const { data: logs, error: logsError } = await supabase
      .from('scraping_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (logsError) {
      console.error('Error fetching scraping logs:', logsError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch scraping logs',
          details: logsError
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Count existing tenders
    const { count: tenderCount, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting tenders:', countError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to count tenders',
          details: countError
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get the latest 5 tenders to examine
    const { data: latestTenders, error: tendersError } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (tendersError) {
      console.error('Error fetching tenders:', tendersError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch tenders',
          details: tendersError
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Look for errors in the scraper.ts file by examining it
    const scraperModule = await import('./scraper.ts');
    const scraperAvailable = typeof scraperModule.scrapeTenders === 'function';
    
    return new Response(
      JSON.stringify({ 
        scraping_logs: logs || [],
        total_tenders: tenderCount || 0,
        latest_tenders: latestTenders || [],
        scraper_available: scraperAvailable,
        message: 'Status check completed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in check-scraper-status function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to check scraper status',
        details: error.message || 'Unknown error',
        stack: error.stack || ''
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
