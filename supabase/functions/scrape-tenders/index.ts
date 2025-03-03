
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { scrapeMygov, scrapeTendersGoKe, generateSampleTenders } from "./scraper.ts";
import { TenderData } from "./types.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request to check for force parameter
    const { force = false } = await req.json().catch(() => ({}));
    console.log(`Scrape-tenders function called with force=${force}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we need to scrape (based on last scrape time or force parameter)
    const { data: lastScrape } = await supabase
      .from("scrape_logs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    const lastScrapeTime = lastScrape?.[0]?.created_at
      ? new Date(lastScrape[0].created_at)
      : new Date(0);
    const currentTime = new Date();
    const timeSinceLastScrape = currentTime.getTime() - lastScrapeTime.getTime();
    const hoursSinceLastScrape = timeSinceLastScrape / (1000 * 60 * 60);

    // Only scrape if forced or it's been more than 6 hours since last scrape
    if (!force && hoursSinceLastScrape < 6) {
      console.log(`Last scrape was ${hoursSinceLastScrape.toFixed(2)} hours ago. Skipping.`);
      
      // Get total tenders count
      const { count } = await supabase
        .from("tenders")
        .select("*", { count: "exact", head: true });
      
      return new Response(
        JSON.stringify({
          message: "Scrape skipped (recently run)",
          tenders_scraped: 0,
          total_tenders: count || 0,
          last_scrape: lastScrapeTime.toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the start of the scraping process
    console.log("Starting tender scraping process");
    await supabase
      .from("scrape_logs")
      .insert({
        source: "all",
        status: "started",
        records_found: null,
        records_inserted: null,
      });

    // Scrape from multiple sources
    console.log("Scraping from mygov.go.ke");
    const mygovTenders = await scrapeMygov();
    
    console.log("Scraping from tenders.go.ke");
    const tendersGoKeTenders = await scrapeTendersGoKe();
    
    // Combine all tenders
    let allTenders: TenderData[] = [...mygovTenders, ...tendersGoKeTenders];
    
    // Use sample data as fallback if no tenders found
    if (allTenders.length === 0) {
      console.log("No tenders found from any source, using sample data");
      allTenders = generateSampleTenders();
    }

    console.log(`Total tenders scraped: ${allTenders.length}`);

    // Insert tenders into database
    let insertedCount = 0;
    for (const tender of allTenders) {
      // Check if tender already exists (by title and deadline)
      const { data: existingTenders } = await supabase
        .from("tenders")
        .select("id")
        .eq("title", tender.title)
        .eq("deadline", tender.deadline);

      // Skip if tender already exists
      if (existingTenders && existingTenders.length > 0) {
        console.log(`Tender "${tender.title}" already exists, skipping`);
        continue;
      }

      // Insert new tender
      const { error } = await supabase.from("tenders").insert(tender);
      if (error) {
        console.error(`Error inserting tender "${tender.title}":`, error);
      } else {
        insertedCount++;
      }
    }

    // Log completion of scraping process
    await supabase
      .from("scrape_logs")
      .insert({
        source: "all",
        status: "success",
        records_found: allTenders.length,
        records_inserted: insertedCount,
      });

    // Get total tenders count
    const { count } = await supabase
      .from("tenders")
      .select("*", { count: "exact", head: true });

    // Return success response
    return new Response(
      JSON.stringify({
        message: "Tender scraping completed successfully",
        tenders_scraped: insertedCount,
        total_tenders: count || 0,
        last_scrape: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in scrape-tenders function:", error);
    
    // Log error
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase
      .from("scrape_logs")
      .insert({
        source: "all",
        status: "error",
        error_message: error.message,
      });

    // Return error response
    return new Response(
      JSON.stringify({
        message: "Error processing tender scrape",
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
