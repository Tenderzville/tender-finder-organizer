// supabase/functions/check-scraper-status/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get detailed scraping metrics
const getScrapingMetrics = async (supabase: SupabaseClient) => {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // Get total tenders
  const { count: totalTenders } = await supabase
    .from('tenders')
    .select('*', { count: 'exact', head: true });

  // Get new tenders in last 24 hours
  const { count: newTenders } = await supabase
    .from('tenders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last24Hours);

  // Get successful scrapes in last 24 hours
  const { data: recentLogs } = await supabase
    .from('scraping_logs')
    .select('*')
    .gte('created_at', last24Hours);

  const successfulScrapes = recentLogs?.filter(log => log.status === 'success').length || 0;
  const failedScrapes = recentLogs?.filter(log => log.status === 'error').length || 0;

  // Get source-specific metrics
  const sources = ['mygov', 'tenders.go.ke', 'private'];
  const sourceMetrics = await Promise.all(sources.map(async (source) => {
    const { data: logs } = await supabase
      .from('scraping_logs')
      .select('*')
      .eq('source', source)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastLog = logs?.[0];
    
    return {
      name: source,
      status: lastLog?.status || 'unknown',
      count: lastLog?.records_found || 0,
      lastSuccess: lastLog?.status === 'success' ? lastLog.created_at : null,
      errorMessage: lastLog?.error_message || null
    };
  }));

  return {
    totalTenders,
    newTendersCount: newTenders,
    successfulScrapes,
    failedScrapes,
    sources: sourceMetrics,
    lastRun: recentLogs?.[0]?.created_at || null,
    nextRunIn: '30 minutes' // Default schedule
  };
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    const metrics = await getScrapingMetrics(supabase);
    
    return new Response(
      JSON.stringify({
        ...metrics,
        success: true,
        message: "Status check completed successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in check-scraper-status:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
        message: "Failed to check scraper status"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
