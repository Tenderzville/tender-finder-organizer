
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

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

    // Start background processing without waiting for it to complete
    const backgroundProcess = async () => {
      console.log("Initiating background tender scraping process");
      
      try {
        // First log that we're starting the process
        await supabase
          .from('scraping_logs')
          .insert({
            status: 'started',
            source: 'scheduler',
            records_found: 0,
            error_message: null,
          });
        
        // Call the scrape-tenders function with the API Layer key
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
          'scrape-tenders', 
          { 
            body: { 
              scheduled: true,
              force: true,  // Always force a fresh scrape when scheduled
              useApiLayer: true  // Explicitly tell the function to use API Layer
            } 
          }
        );
        
        if (scrapeError) {
          console.error("Error in scrape-tenders function:", scrapeError);
          
          // Log the error
          await supabase
            .from('scraping_logs')
            .insert({
              status: 'error',
              source: 'scheduler',
              records_found: 0,
              error_message: scrapeError.message || "Unknown error during function invocation",
            });
            
          return;
        }
        
        console.log("Tender scraping completed:", scrapeData);
        
        // Log the scraping process
        await supabase
          .from('scraping_logs')
          .insert({
            status: scrapeData?.success ? 'success' : 'error',
            source: 'scheduler',
            records_found: scrapeData?.tenders_scraped || 0,
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
            source: 'scheduler',
            records_found: 0,
            error_message: error.message || "Unknown error in background process",
          });
      }
    };

    // Use Deno's waitUntil to continue processing after response is sent
    EdgeRuntime.waitUntil(backgroundProcess());

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduler initiated. Running tender scraper in the background at 8am and 4pm.`,
        timestamp: new Date().toISOString()
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
