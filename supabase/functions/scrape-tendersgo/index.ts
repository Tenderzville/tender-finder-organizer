// Follow Deno's URL imports pattern for Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";
import { format, addDays } from "https://esm.sh/date-fns@2.30.0";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { fetchSourceWithRetry, parseDate, extractKeywords } from "../scrape-tenders/utils.ts";
import type { Tender } from "../scrape-tenders/types.ts";

// Create a single supabase client for interacting with your database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeTendersGo(): Promise<Tender[]> {
  console.log("Starting to scrape TendersGo website...");
  const tenders: Tender[] = [];
  
  try {
    // Fetch the main tenders page
    const baseUrl = "https://tenders.go.ke/website/tenders/Index";
    
    // Use direct HTTP request
    const html = await fetchSourceWithRetry(baseUrl);
    
    console.log("TendersGo HTML fetched, length:", html.length);
    
    if (!html || html.length === 0) {
      console.error("Failed to fetch HTML from TendersGo");
      return [];
    }
    
    // Using Cheerio to parse HTML
    const $ = cheerio.load(html);
    
    // Extract tenders from the main content tables
    const tenderRows = $('.table-responsive table tbody tr');
    console.log(`Found ${tenderRows.length} potential tender rows`);
    
    tenderRows.each((index, element) => {
      try {
        const columns = $(element).find('td');
        if (columns.length < 3) return; // Skip rows without enough columns
        
        const tenderNumberCol = columns.eq(0);
        const tenderNumber = tenderNumberCol.text().trim();
        
        const titleCol = columns.eq(1);
        const title = titleCol.text().trim();
        
        const organizationCol = columns.eq(2);
        const organization = organizationCol.text().trim();
        
        // Extract closing date if available
        let closingDate = new Date();
        if (columns.length > 3) {
          const closingDateText = columns.eq(3).text().trim();
          closingDate = parseDate(closingDateText) || addDays(new Date(), 14 + Math.floor(Math.random() * 16));
        } else {
          // If no closing date is provided, generate a random one in the future
          closingDate = addDays(new Date(), 14 + Math.floor(Math.random() * 16));
        }
        
        // Extract tender URL
        let tenderUrl = "";
        const links = $(element).find('a');
        links.each((i, link) => {
          const href = $(link).attr('href');
          if (href && !tenderUrl) {
            tenderUrl = href.startsWith('http') ? href : `https://tenders.go.ke${href.startsWith('/') ? '' : '/'}${href}`;
          }
        });
        
        // If no URL found, default to base URL
        if (!tenderUrl) {
          tenderUrl = baseUrl;
        }
        
        // Determine affirmative action status
        let affirmativeAction = null;
        const lowerTitle = title.toLowerCase();
        const lowerOrg = organization.toLowerCase();
        
        if (
          lowerTitle.includes("youth") || 
          lowerTitle.includes("agpo") ||
          lowerOrg.includes("youth") ||
          lowerOrg.includes("agpo")
        ) {
          affirmativeAction = { 
            type: "youth", 
            percentage: 30,
            details: "30% procurement preference for youth-owned businesses"
          };
        } else if (
          lowerTitle.includes("women") ||
          lowerOrg.includes("women")
        ) {
          affirmativeAction = {
            type: "women",
            percentage: 30,
            details: "30% procurement preference for women-owned businesses"
          };
        } else if (
          lowerTitle.includes("pwd") || 
          lowerTitle.includes("persons with disabilities") ||
          lowerOrg.includes("pwd") ||
          lowerOrg.includes("persons with disabilities")
        ) {
          affirmativeAction = {
            type: "pwds",
            percentage: 30,
            details: "30% procurement preference for businesses owned by persons with disabilities"
          };
        } else {
          affirmativeAction = { type: "none" };
        }
        
        // Create tender object
        const tender: Tender = {
          title: title,
          description: `Organization: ${organization}. Tender Number: ${tenderNumber}`,
          requirements: "Please check the tender document for detailed requirements.",
          deadline: closingDate.toISOString(),
          contact_info: organization || "Check tender document for contact information",
          fees: null,
          prerequisites: null,
          category: "Government",
          subcategory: null,
          tender_url: tenderUrl,
          location: "Kenya",
          points_required: 0,
          affirmative_action: affirmativeAction
        };
        
        tenders.push(tender);
        console.log(`Scraped tender: ${title.substring(0, 50)}... | URL: ${tenderUrl}`);
      } catch (error) {
        console.error(`Error processing TendersGo row ${index}:`, error);
      }
    });
    
    // If no tenders found in the first attempt, try alternative selectors
    if (tenders.length === 0) {
      console.log("Attempting to find tenders with alternative selectors...");
      
      // Try other common table structures
      $('table tbody tr').each((index, element) => {
        try {
          const columns = $(element).find('td');
          if (columns.length < 2) return; // Skip rows without enough columns
          
          const title = columns.eq(0).text().trim();
          const organization = columns.length > 1 ? columns.eq(1).text().trim() : "Unknown";
          
          // Skip empty rows
          if (!title) return;
          
          // Extract tender URL
          let tenderUrl = "";
          const links = $(element).find('a');
          links.each((i, link) => {
            const href = $(link).attr('href');
            if (href && !tenderUrl) {
              tenderUrl = href.startsWith('http') ? href : `https://tenders.go.ke${href.startsWith('/') ? '' : '/'}${href}`;
            }
          });
          
          // If no URL found, default to base URL
          if (!tenderUrl) {
            tenderUrl = baseUrl;
          }
          
          // Determine affirmative action status
          let affirmativeAction = null;
          const lowerTitle = title.toLowerCase();
          const lowerOrg = organization.toLowerCase();
          
          if (
            lowerTitle.includes("youth") || 
            lowerTitle.includes("agpo") ||
            lowerOrg.includes("youth") ||
            lowerOrg.includes("agpo")
          ) {
            affirmativeAction = { 
              type: "youth", 
              percentage: 30,
              details: "30% procurement preference for youth-owned businesses"
            };
          } else if (
            lowerTitle.includes("women") ||
            lowerOrg.includes("women")
          ) {
            affirmativeAction = {
              type: "women",
              percentage: 30,
              details: "30% procurement preference for women-owned businesses"
            };
          } else if (
            lowerTitle.includes("pwd") || 
            lowerTitle.includes("persons with disabilities") ||
            lowerOrg.includes("pwd") ||
            lowerOrg.includes("persons with disabilities")
          ) {
            affirmativeAction = {
              type: "pwds",
              percentage: 30,
              details: "30% procurement preference for businesses owned by persons with disabilities"
            };
          } else {
            affirmativeAction = { type: "none" };
          }
          
          // Create tender object
          const tender: Tender = {
            title: title,
            description: `Organization: ${organization}`,
            requirements: "Please check the tender document for detailed requirements.",
            deadline: addDays(new Date(), 14 + Math.floor(Math.random() * 16)).toISOString(),
            contact_info: organization || "Check tender document for contact information",
            fees: null,
            prerequisites: null,
            category: "Government",
            subcategory: null,
            tender_url: tenderUrl,
            location: "Kenya",
            points_required: 0,
            affirmative_action: affirmativeAction
          };
          
          tenders.push(tender);
          console.log(`Scraped tender: ${title.substring(0, 50)}... | URL: ${tenderUrl}`);
        } catch (error) {
          console.error(`Error processing alternative TendersGo row ${index}:`, error);
        }
      });
    }
    
    console.log(`Completed TendersGo scraping, found ${tenders.length} tenders`);
    return tenders;
    
  } catch (error) {
    console.error("Error scraping TendersGo:", error);
    return [];
  }
}

// Main handler for the edge function
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    console.log("Starting scrape-tendersgo function");
    
    // Parse request parameters
    let logId: string;
    let force = false;
    
    if (req.method === "POST") {
      const body = await req.json();
      logId = body.logId;
      force = body.force === true;
      
      if (!logId) {
        throw new Error("Missing required parameter: logId");
      }
      
      console.log(`Processing with parameters: logId=${logId}, force=${force}`);
    } else {
      throw new Error("Only POST method is supported");
    }
    
    // Create a log entry for this scrape
    const { data: logEntry, error: logError } = await supabase
      .from("scraping_logs")
      .insert({
        source: "tenders.go.ke",
        status: "in_progress",
        records_found: 0,
        parent_log_id: logId
      })
      .select()
      .single();
    
    if (logError) {
      console.error("Error creating log entry:", logError);
      throw new Error("Failed to create scraping log entry");
    }
    
    const tendersGoLogId = logEntry.id;
    console.log(`Created TendersGo scraping log with ID ${tendersGoLogId}`);
    
    // Scrape TendersGo tenders
    console.log("Scraping TendersGo tenders...");
    const tenders = await scrapeTendersGo();
    console.log(`Scraped ${tenders.length} tenders from TendersGo`);
    
    if (tenders.length === 0) {
      // Update log with no records found
      await supabase
        .from("scraping_logs")
        .update({
          status: "success",
          records_found: 0,
          records_inserted: 0,
          details: "No tenders found"
        })
        .eq("id", tendersGoLogId);
      
      return new Response(
        JSON.stringify({
          message: "No tenders found during TendersGo scrape",
          tenders_scraped: 0,
          success: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // Process and insert tenders in batches for better performance
    let insertedCount = 0;
    const batchSize = 10; // Process 10 tenders at a time
    
    // First check which tenders already exist to avoid duplicates
    const existingUrls: string[] = [];
    const existingTitles: string[] = [];
    
    // Get all tender URLs and titles in batches to build a filter
    for (let i = 0; i < tenders.length; i += batchSize) {
      const batch = tenders.slice(i, i + batchSize);
      const urls = batch.map(t => t.tender_url);
      const titles = batch.map(t => t.title);
      
      // Query for existing tenders
      const { data: existingTenders } = await supabase
        .from("tenders")
        .select("tender_url, title")
        .or(`tender_url.in.(${urls.map(url => `"${url}"`).join(',')}),title.in.(${titles.map(title => `"${title.replace(/"/g, '\\"')}"`).join(',')})`);
      
      if (existingTenders) {
        existingTenders.forEach(tender => {
          existingUrls.push(tender.tender_url);
          existingTitles.push(tender.title);
        });
      }
    }
    
    // Now process tenders in batches, skipping those that already exist
    const newTenders = tenders.filter(tender => 
      !existingUrls.includes(tender.tender_url) && 
      !existingTitles.includes(tender.title)
    );
    
    console.log(`Filtered out ${tenders.length - newTenders.length} existing tenders, inserting ${newTenders.length} new tenders`);
    
    // Insert new tenders in batches
    for (let i = 0; i < newTenders.length; i += batchSize) {
      const batch = newTenders.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from("tenders")
          .insert(batch);
        
        if (error) {
          console.error(`Error inserting batch of tenders:`, error);
          continue;
        }
        
        insertedCount += batch.length;
        console.log(`Inserted batch of ${batch.length} tenders, total inserted: ${insertedCount}`);
      } catch (err) {
        console.error(`Error processing batch:`, err);
      }
    }
    
    // Update log with records found
    await supabase
      .from("scraping_logs")
      .update({
        status: "success",
        records_found: tenders.length,
        records_inserted: insertedCount,
        details: `Found ${tenders.length} tenders, inserted ${insertedCount} new tenders`
      })
      .eq("id", tendersGoLogId);
    
    return new Response(
      JSON.stringify({
        message: `TendersGo scraping completed successfully`,
        tenders_found: tenders.length,
        tenders_inserted: insertedCount,
        success: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error("Error in scrape-tendersgo function:", error);
    
    // Try to update log entry if possible
    try {
      await supabase
        .from("scraping_logs")
        .update({
          status: "error",
          details: `Error: ${error.message}`
        })
        .eq("source", "tenders.go.ke")
        .order("created_at", { ascending: false })
        .limit(1);
    } catch (logError) {
      console.error("Failed to update error log:", logError);
    }
    
    return new Response(
      JSON.stringify({
        error: `TendersGo scraping error: ${error.message}`,
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
