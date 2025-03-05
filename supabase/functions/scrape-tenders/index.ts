
// Follow Deno's URL imports pattern for Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";
import { format, addDays } from "date-fns";
import { scrapeMyGov, scrapeTendersGo } from "./scraper.ts";
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
    
    console.log("Beginning scrape operations");

    // Create a log entry for this scrape
    const { data: logEntry, error: logError } = await supabase
      .from("scraping_logs")
      .insert({
        source: "mygov.go.ke",
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
    
    // Scrape MyGov tenders
    console.log("Scraping MyGov tenders...");
    const myGovTenders = await scrapeMyGov();
    console.log(`Scraped ${myGovTenders.length} tenders from MyGov`);
    
    // Scrape Tenders.go.ke
    console.log("Scraping Tenders.go.ke...");
    const tendersGoTenders = await scrapeTendersGo();
    console.log(`Scraped ${tendersGoTenders.length} tenders from Tenders.go.ke`);
    
    // Combine and process all scraped tenders
    const allTenders = [...myGovTenders, ...tendersGoTenders];
    console.log(`Total tenders scraped: ${allTenders.length}`);
    
    if (allTenders.length === 0) {
      // Update log with no records found
      await supabase
        .from("scraping_logs")
        .update({
          status: "success",
          records_found: 0,
          records_inserted: 0
        })
        .eq("id", logId);
      
      return new Response(
        JSON.stringify({
          message: "No tenders found during scrape",
          tenders_scraped: 0,
          success: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // Process and insert tenders
    let insertedCount = 0;
    for (const tender of allTenders) {
      try {
        // Check if tender already exists by URL or title
        const { data: existingTenders } = await supabase
          .from("tenders")
          .select("id")
          .or(`title.eq."${tender.title}",tender_url.eq."${tender.tender_url}"`)
          .limit(1);
        
        if (existingTenders && existingTenders.length > 0) {
          console.log(`Tender already exists: ${tender.title}`);
          continue;
        }
        
        // Determine affirmative action status based on content analysis
        let affirmativeAction = null;
        const lowerTitle = tender.title.toLowerCase();
        const lowerDesc = (tender.description || "").toLowerCase();
        
        if (
          lowerTitle.includes("youth") || 
          lowerDesc.includes("youth") || 
          lowerTitle.includes("agpo") || 
          lowerDesc.includes("agpo")
        ) {
          affirmativeAction = { 
            type: "youth", 
            percentage: 30,
            details: "30% procurement preference for youth-owned businesses"
          };
        } else if (
          lowerTitle.includes("women") || 
          lowerDesc.includes("women")
        ) {
          affirmativeAction = {
            type: "women",
            percentage: 30,
            details: "30% procurement preference for women-owned businesses"
          };
        } else if (
          lowerTitle.includes("pwd") || 
          lowerDesc.includes("pwd") || 
          lowerTitle.includes("persons with disabilities") || 
          lowerDesc.includes("persons with disabilities")
        ) {
          affirmativeAction = {
            type: "pwds",
            percentage: 30,
            details: "30% procurement preference for businesses owned by persons with disabilities"
          };
        } else {
          affirmativeAction = { type: "none" };
        }
        
        // Generate a deadline 14-30 days in the future if not specified
        const deadline = tender.deadline ? new Date(tender.deadline) : addDays(new Date(), 14 + Math.floor(Math.random() * 16));
        
        // Insert the tender with affirmative action info
        const { error: insertError } = await supabase
          .from("tenders")
          .insert({
            ...tender,
            deadline,
            category: tender.category || "Government",
            affirmative_action: affirmativeAction
          });
        
        if (insertError) {
          console.error(`Error inserting tender "${tender.title}":`, insertError);
          continue;
        }
        
        insertedCount++;
      } catch (err) {
        console.error(`Error processing tender "${tender.title}":`, err);
      }
    }
    
    console.log(`Inserted ${insertedCount} new tenders`);
    
    // Update log with final stats
    await supabase
      .from("scraping_logs")
      .update({
        status: "success",
        records_found: allTenders.length,
        records_inserted: insertedCount
      })
      .eq("id", logId);
    
    // Get total tender count
    const { count } = await supabase
      .from("tenders")
      .select("*", { count: "exact", head: true });
    
    return new Response(
      JSON.stringify({
        message: "Scrape completed successfully",
        tenders_scraped: insertedCount,
        total_tenders: count || 0,
        success: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
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
