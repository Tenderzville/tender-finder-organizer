
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    console.log("Checking scraper status...");

    // Get the latest scraper logs
    const { data: scrapingLogs, error: logsError } = await supabase
      .from('scraping_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.error("Error fetching scraping logs:", logsError);
      throw logsError;
    }

    // Get the total number of tenders
    const { count: totalTenders, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error("Error counting tenders:", countError);
      throw countError;
    }

    // Get the latest tenders
    const { data: latestTenders, error: tendersError } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (tendersError) {
      console.error("Error fetching latest tenders:", tendersError);
      throw tendersError;
    }

    // Try to ping the scraper function to check if it's available
    let scraperAvailable = false;
    let pingError = null;
    try {
      // Attempt to ping the scrape-tenders function without running it
      const { data, error } = await supabase.functions.invoke('scrape-tenders', { 
        body: { ping: true } 
      });
      scraperAvailable = data?.success === true;
      if (error) {
        pingError = error.message;
        console.error("Error pinging scraper:", error);
      }
    } catch (e) {
      pingError = e.message;
      console.error("Exception pinging scraper:", e);
    }

    // Get Supabase Edge Function timeout setting
    const timeoutSetting = Deno.env.get('SUPABASE_FUNCTION_TIMEOUT') || '30'; // default is 30 seconds

    // Diagnostic information
    const diagnostics = {
      total_tenders_count: totalTenders || 0,
      latest_tenders_count: latestTenders?.length || 0,
      latest_logs_count: scrapingLogs?.length || 0,
      latest_successful_scrape: scrapingLogs?.find(log => log.status === 'success')?.created_at || null,
      edge_function_timeout: `${timeoutSetting} seconds`,
      scraper_available: scraperAvailable,
      ping_error: pingError,
      database_connection: logsError ? "Error" : "OK"
    };

    return new Response(
      JSON.stringify({
        scraping_logs: scrapingLogs,
        total_tenders: totalTenders,
        latest_tenders: latestTenders,
        scraper_available: scraperAvailable,
        last_check: new Date().toISOString(),
        message: "Status check completed",
        diagnostics
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking scraper status:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
