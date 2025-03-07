// Follow Deno's URL imports pattern for Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";
import { format } from "https://esm.sh/date-fns@2.30.0";

// Create a single supabase client for interacting with your database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Main handler function that initiates separate scraping jobs
async function handler(req: Request) {
  try {
    console.log("Scrape tenders coordinator function started");
    
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Log the start of the coordinator function
    await supabaseClient
      .from("scraper_logs")
      .insert({
        function_name: "scrape-tenders-coordinator",
        status: "started",
        tenders_count: 0
      });
    
    const startTime = Date.now();
    let totalTenders = 0;
    const errors: string[] = [];

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Parse request to get force parameter
    let force = false;
    if (req.method === "POST") {
      const body = await req.json();
      force = body?.force === true;
      console.log(`Force parameter: ${force}`);
    }
    
    // Check if we've already scraped recently (within last 30 minutes)
    // Skip this check if force is true
    if (!force) {
      const { data: lastScrape } = await supabase
        .from("scraping_logs")
        .select("created_at, status")
        .eq("source", "main-coordinator")
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
    
    console.log("Beginning scrape operations");

    // Create a log entry for this coordinated scrape
    const { data: logEntry, error: logError } = await supabase
      .from("scraping_logs")
      .insert({
        source: "main-coordinator",
        status: "in_progress",
        records_found: 0,
        details: "Coordinating multiple scraping jobs"
      })
      .select()
      .single();
    
    if (logError) {
      console.error("Error creating log entry:", logError);
      throw new Error("Failed to create scraping log entry");
    }
    
    const logId = logEntry.id;
    console.log(`Created coordination log with ID ${logId}`);
    
    // Instead of doing all the scraping here, trigger separate edge functions
    // for each scraping job to stay within the 60-second limit
    
    try {
      // Launch scrape-mygov function
      console.log("Initiating MyGov scraper...");
      const myGovResult = await supabase.functions.invoke('scrape-mygov', {
        body: { logId, force }
      });
      
      if (myGovResult.error) {
        console.error("Error invoking MyGov scraper:", myGovResult.error);
      } else {
        console.log("MyGov scraper started successfully");
      }
    } catch (err) {
      console.error("Failed to invoke MyGov scraper:", err);
      // Continue with other scrapers even if one fails
    }
    
    try {
      // Launch scrape-tendersgo function
      console.log("Initiating TendersGo scraper...");
      const tendersGoResult = await supabase.functions.invoke('scrape-tendersgo', {
        body: { logId, force }
      });
      
      if (tendersGoResult.error) {
        console.error("Error invoking TendersGo scraper:", tendersGoResult.error);
      } else {
        console.log("TendersGo scraper started successfully");
      }
    } catch (err) {
      console.error("Failed to invoke TendersGo scraper:", err);
      // Continue with other scrapers even if one fails
    }
    
    // Update the coordination log to success since we've initiated all scraping jobs
    await supabase
      .from("scraping_logs")
      .update({
        status: "success",
        details: "All scraping jobs initiated"
      })
      .eq("id", logId);
    
    // Return immediately with a success status
    return new Response(
      JSON.stringify({
        message: "Tender scraping jobs initiated successfully",
        log_id: logId,
        success: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error("Error in scrape-tenders coordination function:", error);
    
    return new Response(
      JSON.stringify({
        error: `Scraping coordination error: ${error.message}`,
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

// Serve the handler
Deno.serve(handler);
