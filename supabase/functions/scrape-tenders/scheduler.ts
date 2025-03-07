
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

// Create a single supabase client for interacting with your database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
const supabase = createClient(supabaseUrl, supabaseKey);

async function processPendingJobs() {
  try {
    // Get pending jobs
    const { data: pendingJobs, error } = await supabase
      .from('scraping_jobs')
      .select('id')
      .eq('status', 'pending')
      .order('priority')
      .limit(5);
    
    if (error) {
      throw new Error(`Error fetching pending jobs: ${error.message}`);
    }
    
    console.log(`Found ${pendingJobs?.length || 0} pending jobs`);
    
    // If no pending jobs, initialize them
    if (!pendingJobs || pendingJobs.length === 0) {
      await supabase.rpc('initialize_scraping_jobs');
      console.log("Initialized new scraping jobs");
      
      // Fetch again after initialization
      const { data: newJobs } = await supabase
        .from('scraping_jobs')
        .select('id')
        .eq('status', 'pending')
        .order('priority')
        .limit(5);
        
      console.log(`Found ${newJobs?.length || 0} new pending jobs after initialization`);
      
      if (newJobs && newJobs.length > 0) {
        // Call the scrape-tenders function with the first job ID
        const response = await fetch(`${supabaseUrl}/functions/v1/scrape-tenders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            jobId: newJobs[0].id
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error triggering scrape-tenders function: ${response.status} ${errorText}`);
        }
        
        return { success: true, jobId: newJobs[0].id };
      }
    } else {
      // Call the scrape-tenders function with the first job ID
      const response = await fetch(`${supabaseUrl}/functions/v1/scrape-tenders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          jobId: pendingJobs[0].id
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error triggering scrape-tenders function: ${response.status} ${errorText}`);
      }
      
      return { success: true, jobId: pendingJobs[0].id };
    }
    
    return { success: true, message: "No jobs to schedule at this time" };
  } catch (error) {
    console.error("Error in job processing:", error);
    return { 
      success: false, 
      error: error.message || "An error occurred during job processing" 
    };
  }
}

// Start scheduler for tender scraping
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    console.log("Starting scheduler for scrape-tenders function");
    
    // Start the background processing using EdgeRuntime.waitUntil
    const backgroundProcessPromise = processPendingJobs();
    
    // Use the EdgeRuntime API to continue processing in the background
    // This allows us to return a response to the client immediately
    // while the processing continues in the background
    EdgeRuntime.waitUntil(
      backgroundProcessPromise.catch(err => {
        console.error("Background process error:", err);
      })
    );
    
    // Return a quick response while processing continues in the background
    return new Response(
      JSON.stringify({
        message: "Scrape job scheduling started in background",
        success: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in scheduler function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during scheduling",
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
