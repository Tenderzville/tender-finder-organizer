
// Follow Deno's URL imports pattern for Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";
import { format, addDays } from "https://esm.sh/date-fns@2.30.0";
import { processJob, processNextJob } from "./job-processor.ts";
import type { Tender } from "./types.ts";

// Create a single supabase client for interacting with your database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    console.log("Starting scrape-tenders function");
    
    // Parse request to get force parameter and job ID if provided
    let force = false;
    let specificJobId = null;
    
    if (req.method === "POST") {
      const body = await req.json();
      force = body?.force === true;
      specificJobId = body?.jobId || null;
      console.log(`Force parameter: ${force}, Job ID: ${specificJobId}`);
    }
    
    // Check if we've already scraped recently (within last 30 minutes)
    // Skip this check if force is true
    if (!force && !specificJobId) {
      const { data: lastScrape } = await supabase
        .from("scraping_logs")
        .select("created_at, status")
        .eq("source", "mygov.go.ke")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (lastScrape && lastScrape.length > 0) {
        const lastScrapeTime = new Date(lastScrape[0].created_at);
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        if (lastScrapeTime > thirtyMinutesAgo && lastScrape[0].status === "success") {
          console.log("Skipping scrape - already scraped within last 30 minutes");
          return new Response(
            JSON.stringify({
              message: "Skipping scrape - already scraped within last 30 minutes",
              last_scrape: lastScrape[0].created_at,
              success: true
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
      }
    }
    
    // Create a log entry for this scrape
    const { data: logEntry, error: logError } = await supabase
      .from("scraping_logs")
      .insert({
        source: "job_queue",
        status: "in_progress",
        records_found: 0
      })
      .select()
      .single();
    
    if (logError) {
      console.error("Error creating log entry:", logError);
      throw new Error("Failed to create scraping log entry");
    }
    
    const logId = logEntry.id;
    console.log(`Created scraping log with ID ${logId}`);
    
    // Initialize jobs if needed
    if (force || !specificJobId) {
      await supabase.rpc('initialize_scraping_jobs');
      console.log("Initialized scraping jobs");
    }
    
    // If a specific job ID was provided, process that job
    if (specificJobId) {
      // Start processing in the background
      const backgroundProcessing = async () => {
        try {
          // Get the job details
          const { data: jobData } = await supabase
            .from('scraping_jobs')
            .select('*')
            .eq('id', specificJobId)
            .single();
          
          if (!jobData) {
            console.error(`Job with ID ${specificJobId} not found`);
            return;
          }

// Filter for recent tenders (within last 48 hours)
const isRecent = (dateStr: string) => {
  try {
    const publishDate = new Date(dateStr);
    const last48Hours = new Date();
    last48Hours.setHours(last48Hours.getHours() - 48);
    return publishDate >= last48Hours;
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
    return false; // If we can't parse the date, assume it's not recent
  }
};

// Prioritize recent tenders in results
const recentTenders = parsedTenders.filter(tender => 
  tender.publication_date && isRecent(tender.publication_date)
);

console.log(`Found ${recentTenders.length} tenders published in the last 48 hours`);

// Always include recent tenders at the top of results
const sortedTenders = [
  ...recentTenders,
  ...parsedTenders.filter(tender => 
    !tender.publication_date || !isRecent(tender.publication_date)
  )
];

          
          // Process the specific job
          console.log(`Processing specific job: ${jobData.source} - ${jobData.url}`);
          await processJob(supabase, jobData);
          
          // Update the log with success
          await supabase
            .from("scraping_logs")
            .update({
              status: "success",
              records_found: 1,
              records_inserted: 1
            })
            .eq("id", logId);
          
        } catch (error) {
          console.error("Error in background job processing:", error);
          
          // Update the log with error
          await supabase
            .from("scraping_logs")
            .update({
              status: "error",
              error_message: error.message || "Unknown error"
            })
            .eq("id", logId);
        }
      };
      
      // Use EdgeRuntime.waitUntil for background processing
      console.log("Starting background processing for specific job");
      EdgeRuntime.waitUntil(backgroundProcessing());
      
      return new Response(
        JSON.stringify({
          message: `Processing job ${specificJobId} started in background`,
          log_id: logId,
          success: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Process the next job in the queue
      // Start processing in the background
      const backgroundProcessing = async () => {
        try {
          await processNextJob(supabase);
          
          // Update the log with success
          await supabase
            .from("scraping_logs")
            .update({
              status: "success",
              records_found: 1
            })
            .eq("id", logId);
          
        } catch (error) {
          console.error("Error in background job processing:", error);
          
          // Update the log with error
          await supabase
            .from("scraping_logs")
            .update({
              status: "error",
              error_message: error.message || "Unknown error"
            })
            .eq("id", logId);
        }
      };
      
      // Use EdgeRuntime.waitUntil for background processing
      console.log("Starting background processing for next job");
      EdgeRuntime.waitUntil(backgroundProcessing());
      
      return new Response(
        JSON.stringify({
          message: "Job queue processing started in background",
          log_id: logId,
          success: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error("Error in scrape-tenders function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during the scrape operation",
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Add shutdown handler for graceful termination
addEventListener("beforeunload", (evt) => {
  console.log("Function shutting down:", evt.detail?.reason);
});
