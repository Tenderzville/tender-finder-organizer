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

// Utility to extract link from cell content
function extractLink(element: cheerio.Cheerio): string {
  const link = element.find('a').attr('href');
  return link || '';
}

async function scrapeMyGov(): Promise<Tender[]> {
  console.log("Starting to scrape MyGov tenders...");
  const tenders: Tender[] = [];
  
  try {
    // Fetch the main tenders page
    const baseUrl = "https://www.mygov.go.ke/all-tenders";
    
    // Use direct HTTP request
    const html = await fetchSourceWithRetry(baseUrl);
    
    console.log("MyGov HTML fetched, length:", html.length);
    
    if (!html || html.length === 0) {
      console.error("Failed to fetch HTML from MyGov");
      return [];
    }
    
    // Using Cheerio to parse HTML
    const $ = cheerio.load(html);
    
    // Extract tenders from the table
    $('#datatable tbody tr').each((index, element) => {
      try {
        const cells = $(element).find('td');
        const description = cells.eq(1).text().trim();
        const ministry = cells.eq(2).text().trim();
        const postedDate = cells.eq(3).text().trim();
        const deadlineText = cells.eq(4).text().trim();
        const deadlineDate = parseDate(deadlineText) || addDays(new Date(), 14 + Math.floor(Math.random() * 16));
        
        // Extract tender URL
        const descriptionCell = cells.eq(1);
        let tenderUrl = extractLink(descriptionCell);
        
        // If no URL was found, look for links in other cells
        if (!tenderUrl) {
          for (let i = 0; i < cells.length; i++) {
            const cellUrl = extractLink(cells.eq(i));
            if (cellUrl) {
              tenderUrl = cellUrl;
              break;
            }
          }
        }
        
        // Ensure URL is absolute
        if (tenderUrl && !tenderUrl.startsWith('http')) {
          tenderUrl = tenderUrl.startsWith('/') 
            ? `https://www.mygov.go.ke${tenderUrl}`
            : `https://www.mygov.go.ke/${tenderUrl}`;
        }
        
        // If no URL was found, default to base URL
        if (!tenderUrl) tenderUrl = baseUrl;
        
        // Determine affirmative action status
        let affirmativeAction = null;
        const lowerTitle = description.toLowerCase();
        
        if (
          lowerTitle.includes("youth") || 
          lowerTitle.includes("agpo")
        ) {
          affirmativeAction = { 
            type: "youth", 
            percentage: 30,
            details: "30% procurement preference for youth-owned businesses"
          };
        } else if (lowerTitle.includes("women")) {
          affirmativeAction = {
            type: "women",
            percentage: 30,
            details: "30% procurement preference for women-owned businesses"
          };
        } else if (
          lowerTitle.includes("pwd") || 
          lowerTitle.includes("persons with disabilities")
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
          title: description,
          description: `Ministry/Department: ${ministry}. Posted on: ${postedDate}`,
          requirements: "Please check the tender document for detailed requirements.",
          deadline: deadlineDate.toISOString(),
          contact_info: ministry || "Check tender document for contact information",
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
        console.log(`Scraped tender: ${description.substring(0, 50)}... | URL: ${tenderUrl}`);
      } catch (error) {
        console.error("Error processing tender row:", error);
      }
    });
    
    // Check for alternative table structure if the first attempt found nothing
    if (tenders.length === 0) {
      $('.table.table-striped tbody tr').each((index, element) => {
        try {
          const cells = $(element).find('td');
          const description = cells.eq(0).text().trim();
          const ministry = cells.eq(1).text().trim();
          const deadlineText = cells.eq(2).text().trim();
          const deadlineDate = parseDate(deadlineText) || addDays(new Date(), 14 + Math.floor(Math.random() * 16));
          
          // Extract tender URL more thoroughly
          let tenderUrl = "";
          
          // Look for links in any cell
          for (let i = 0; i < cells.length; i++) {
            const cellUrl = extractLink(cells.eq(i));
            if (cellUrl) {
              tenderUrl = cellUrl;
              break;
            }
          }
          
          // If no direct link found, look for onclick attributes that might contain URLs
          if (!tenderUrl) {
            const onclickAttr = $(element).attr('onclick') || '';
            const urlMatch = onclickAttr.match(/window\.location\s*=\s*['"]([^'"]+)['"]/);
            if (urlMatch && urlMatch[1]) {
              tenderUrl = urlMatch[1];
            }
          }
          
          // Ensure URL is absolute
          if (tenderUrl && !tenderUrl.startsWith('http')) {
            tenderUrl = tenderUrl.startsWith('/') 
              ? `https://www.mygov.go.ke${tenderUrl}`
              : `https://www.mygov.go.ke/${tenderUrl}`;
          }
          
          // If no URL was found, default to base URL
          if (!tenderUrl) tenderUrl = baseUrl;
          
          // Determine affirmative action status
          let affirmativeAction = null;
          const lowerTitle = description.toLowerCase();
          
          if (
            lowerTitle.includes("youth") || 
            lowerTitle.includes("agpo")
          ) {
            affirmativeAction = { 
              type: "youth", 
              percentage: 30,
              details: "30% procurement preference for youth-owned businesses"
            };
          } else if (lowerTitle.includes("women")) {
            affirmativeAction = {
              type: "women",
              percentage: 30,
              details: "30% procurement preference for women-owned businesses"
            };
          } else if (
            lowerTitle.includes("pwd") || 
            lowerTitle.includes("persons with disabilities")
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
            title: description,
            description: `Ministry/Department: ${ministry}`,
            requirements: "Please check the tender document for detailed requirements.",
            deadline: deadlineDate.toISOString(),
            contact_info: ministry || "Check tender document for contact information",
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
          console.log(`Scraped tender: ${description.substring(0, 50)}... | URL: ${tenderUrl}`);
        } catch (error) {
          console.error("Error processing tender row:", error);
        }
      });
    }
    
    console.log(`Completed MyGov scraping, found ${tenders.length} tenders`);
    return tenders;
    
  } catch (error) {
    console.error("Error scraping MyGov:", error);
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
    console.log("Starting scrape-mygov function");
    
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
        source: "mygov.go.ke",
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
    
    const myGovLogId = logEntry.id;
    console.log(`Created MyGov scraping log with ID ${myGovLogId}`);
    
    // Scrape MyGov tenders
    console.log("Scraping MyGov tenders...");
    const tenders = await scrapeMyGov();
    console.log(`Scraped ${tenders.length} tenders from MyGov`);
    
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
        .eq("id", myGovLogId);
      
      return new Response(
        JSON.stringify({
          message: "No tenders found during MyGov scrape",
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
      .eq("id", myGovLogId);
    
    return new Response(
      JSON.stringify({
        message: `MyGov scraping completed successfully`,
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
    console.error("Error in scrape-mygov function:", error);
    
    // Try to update log entry if possible
    try {
      await supabase
        .from("scraping_logs")
        .update({
          status: "error",
          details: `Error: ${error.message}`
        })
        .eq("source", "mygov.go.ke")
        .order("created_at", { ascending: false })
        .limit(1);
    } catch (logError) {
      console.error("Failed to update error log:", logError);
    }
    
    return new Response(
      JSON.stringify({
        error: `MyGov scraping error: ${error.message}`,
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
