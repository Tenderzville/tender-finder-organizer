
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

const SCRAPE_INTERVAL_MINUTES = 5;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Scheduler function triggered");
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use Deno's runtime to run background tasks
    const controller = new AbortController();
    const { signal } = controller;

    // Start background processing
    const backgroundProcess = async () => {
      console.log("Initiating background tender scraping process");
      
      try {
        // Call the scrape-tenders function
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
          'scrape-tenders', 
          { body: { scheduled: true } }
        );
        
        if (scrapeError) {
          console.error("Error in scrape-tenders function:", scrapeError);
          return;
        }
        
        console.log("Tender scraping completed:", scrapeData);
        
        // Log the scraping process
        await supabase
          .from('scraping_logs')
          .insert({
            status: scrapeData?.success ? 'success' : 'error',
            tenders_found: scrapeData?.tenders_scraped || 0,
            error_message: scrapeData?.error || null,
          });
          
        console.log("Scraping log recorded");
      } catch (error) {
        console.error("Error in background process:", error);
        
        // Log the error
        await supabase
          .from('scraping_logs')
          .insert({
            status: 'error',
            tenders_found: 0,
            error_message: error.message,
          });
      }
    };

    // Use EdgeRuntime.waitUntil to continue processing after response is sent
    // @ts-ignore - Deno Deploy specific API
    Deno.core.opAsync("op_wait_until", backgroundProcess());

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduler initiated. Running tender scraper in the background every ${SCRAPE_INTERVAL_MINUTES} minutes.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in scheduler function:", error);

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
