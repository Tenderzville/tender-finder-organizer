
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import { scrapeGovernmentTenders, scrapeTederingBoard } from "./scraper.ts";
import type { TenderData } from "./types.ts";

const RECENT_SCRAPE_THRESHOLD = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get request data if available
    let forceRun = false;
    try {
      const requestData = await req.json();
      forceRun = requestData?.force === true;
      console.log("Request data:", requestData);
    } catch (e) {
      // No request body or invalid JSON, use defaults
      console.log("No request body or invalid JSON");
    }

    // Check if we've scraped recently (unless force=true)
    if (!forceRun) {
      const { data: lastScrape } = await supabaseAdmin
        .from('scraping_logs')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastScrape && lastScrape.length > 0) {
        const lastScrapeTime = new Date(lastScrape[0].created_at).getTime();
        const now = new Date().getTime();
        
        if (now - lastScrapeTime < RECENT_SCRAPE_THRESHOLD) {
          console.log("Recent scrape found, skipping unless forced");
          
          // Get total tenders count
          const { count } = await supabaseAdmin
            .from('tenders')
            .select('*', { count: 'exact', head: true });
          
          return new Response(
            JSON.stringify({
              success: true,
              message: "Skipped scraping due to recent run",
              tenders_scraped: 0,
              total_tenders: count
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
      }
    }

    console.log("Starting tender scraping process");
    
    // Start with an empty array of scraped tenders
    let allTenders: TenderData[] = [];
    let errors: string[] = [];
    
    // Create a log entry
    const { data: scrapeLog, error: logError } = await supabaseAdmin
      .from('scraping_logs')
      .insert({
        source: 'scrape-tenders function',
        status: 'in_progress',
      })
      .select('id')
      .single();
    
    if (logError) {
      console.error("Error creating scrape log:", logError);
    }

    // Scrape government tenders
    try {
      console.log("Scraping government tenders...");
      const govTenders = await scrapeGovernmentTenders();
      console.log(`Found ${govTenders.length} government tenders`);
      allTenders = [...allTenders, ...govTenders];
    } catch (error) {
      console.error("Error scraping government tenders:", error);
      errors.push(`Government tenders: ${error.message}`);
    }
    
    // Scrape tendering board
    try {
      console.log("Scraping tendering board...");
      const tenderBoardTenders = await scrapeTederingBoard();
      console.log(`Found ${tenderBoardTenders.length} tendering board tenders`);
      allTenders = [...allTenders, ...tenderBoardTenders];
    } catch (error) {
      console.error("Error scraping tendering board:", error);
      errors.push(`Tendering board: ${error.message}`);
    }

    // Insert tenders into the database
    console.log(`Attempting to insert ${allTenders.length} tenders`);
    let insertedCount = 0;
    
    if (allTenders.length > 0) {
      for (const tender of allTenders) {
        try {
          // Check if tender already exists (by title and deadline)
          const { data: existingTender } = await supabaseAdmin
            .from('tenders')
            .select('id')
            .eq('title', tender.title)
            .eq('deadline', tender.deadline)
            .maybeSingle();
          
          if (existingTender) {
            console.log(`Tender already exists: ${tender.title}`);
            continue;
          }
          
          // Insert the new tender
          const { error: insertError } = await supabaseAdmin
            .from('tenders')
            .insert({
              title: tender.title,
              description: tender.description,
              requirements: tender.requirements,
              deadline: tender.deadline,
              contact_info: tender.contact_info,
              fees: tender.fees,
              category: tender.category,
              subcategory: tender.subcategory || null,
              location: tender.location,
              points_required: tender.points_required || 0,
              tender_url: tender.tender_url || null,
              prerequisites: tender.prerequisites || null,
            });
          
          if (insertError) {
            console.error(`Error inserting tender ${tender.title}:`, insertError);
          } else {
            insertedCount++;
          }
        } catch (error) {
          console.error(`Error processing tender ${tender.title}:`, error);
        }
      }
    }
    
    // Update the log entry
    if (scrapeLog) {
      await supabaseAdmin
        .from('scraping_logs')
        .update({
          status: insertedCount > 0 ? 'success' : (errors.length > 0 ? 'partial_success' : 'no_new_data'),
          records_found: allTenders.length,
          records_inserted: insertedCount,
          error_message: errors.length > 0 ? errors.join('; ') : null,
        })
        .eq('id', scrapeLog.id);
    }
    
    // Get total tenders count
    const { count } = await supabaseAdmin
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    return new Response(
      JSON.stringify({
        success: true,
        tenders_found: allTenders.length,
        tenders_scraped: insertedCount,
        total_tenders: count,
        errors: errors.length > 0 ? errors : null
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Function error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
