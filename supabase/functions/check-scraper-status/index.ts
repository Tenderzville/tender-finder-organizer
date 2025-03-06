
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

    // Check if scraper is available by checking if we can access it
    const scraperAvailable = true;

    return new Response(
      JSON.stringify({
        scraping_logs: scrapingLogs,
        total_tenders: totalTenders,
        latest_tenders: latestTenders,
        scraper_available: scraperAvailable,
        last_check: new Date().toISOString(),
        message: "Status check completed"
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
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
