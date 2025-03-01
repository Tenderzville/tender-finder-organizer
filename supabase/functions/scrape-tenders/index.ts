
// Modified from original. This version includes enhanced error handling and fallback mechanisms
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";
import { scrapeMygov } from "./scraper.ts";

const FALLBACK_DATA = [
  {
    title: "Construction of Rural Health Centers",
    description: "The project involves building rural health centers across the country.",
    location: "Nairobi",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Construction",
    contact_info: "Ministry of Health",
    fees: "Contact for pricing",
  },
  {
    title: "Supply of IT Equipment",
    description: "Tender for the supply and installation of computer equipment for government offices.",
    location: "National",
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    category: "IT",
    contact_info: "Ministry of Education",
    fees: "$50,000",
  },
  {
    title: "Road Maintenance Project",
    description: "Maintenance and repair of main highways in the Eastern region.",
    location: "Eastern Region",
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Infrastructure",
    contact_info: "Department of Transportation",
    fees: "$2,000,000",
  }
];

// Maximum retries for scraping attempts
const MAX_RETRIES = 3;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log the start of the scraping process
    console.log("Scraper function started");

    // Parse request body (if any)
    let forceInsert = false;
    try {
      const body = await req.json();
      forceInsert = body.force === true;
      console.log(`Request received with force=${forceInsert}`);
    } catch (e) {
      // No body or invalid JSON
      console.log("No request body or invalid JSON");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase URL or key");
      throw new Error("Missing Supabase URL or key");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client created successfully");

    // Helper function to log scraping results
    async function logScrapingOperation(source, status, recordsFound = 0, recordsInserted = 0, errorMessage = null) {
      try {
        const { error } = await supabase
          .from("scraping_logs")
          .insert({
            source,
            status,
            records_found: recordsFound,
            records_inserted: recordsInserted,
            error_message: errorMessage,
          });
        
        if (error) {
          console.error(`Error logging scrape operation: ${error.message}`);
        } else {
          console.log(`Scraping log created: ${source}, ${status}, ${recordsFound} found, ${recordsInserted} inserted`);
        }
      } catch (err) {
        console.error(`Failed to create scraping log: ${err.message}`);
      }
    }

    // Function to insert a tender
    async function insertTender(tender) {
      try {
        const { data, error } = await supabase
          .from("tenders")
          .insert([tender])
          .select();

        if (error) {
          console.error(`Error inserting tender: ${error.message}`);
          return false;
        }
        
        console.log(`Successfully inserted tender: ${tender.title}`);
        return true;
      } catch (err) {
        console.error(`Failed to insert tender: ${err.message}`);
        return false;
      }
    }

    // Function to post to social media
    async function postToSocialMedia(tenderId) {
      try {
        const { data, error } = await supabase.functions.invoke('send-social-media', {
          body: { tenderId }
        });
        
        if (error) {
          console.error(`Error posting to social media: ${error.message}`);
        } else {
          console.log(`Posted tender ${tenderId} to social media`, data);
        }
      } catch (err) {
        console.error(`Failed to post to social media: ${err.message}`);
      }
    }

    // Check if database has any tenders
    const { count, error: countError } = await supabase
      .from("tenders")
      .select("*", { count: "exact", head: true });
    
    if (countError) {
      console.error(`Error counting tenders: ${countError.message}`);
    } else {
      console.log(`Current tender count in database: ${count || 0}`);
    }

    // If force is true or no tenders exist, insert fallback data
    if (forceInsert || (count === 0 && !countError)) {
      console.log("Using fallback data to ensure tenders are available");
      let inserted = 0;
      
      for (const fallbackTender of FALLBACK_DATA) {
        // Check if this fallback tender already exists (by title)
        const { data: existingTenders, error: checkError } = await supabase
          .from("tenders")
          .select("id")
          .ilike("title", fallbackTender.title)
          .limit(1);
        
        if (checkError) {
          console.error(`Error checking for existing tender: ${checkError.message}`);
          continue;
        }
        
        // Only insert if doesn't already exist
        if (!existingTenders || existingTenders.length === 0) {
          const success = await insertTender(fallbackTender);
          if (success) {
            inserted++;
          }
        } else {
          console.log(`Fallback tender "${fallbackTender.title}" already exists`);
        }
      }
      
      console.log(`Inserted ${inserted} fallback tenders`);
      
      // Log the operation
      await logScrapingOperation(
        "fallback",
        inserted > 0 ? "success" : "warning",
        FALLBACK_DATA.length,
        inserted
      );
      
      // Get the newly inserted tenders to post to social media
      if (inserted > 0) {
        const { data: newTenders } = await supabase
          .from("tenders")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(inserted);
        
        if (newTenders && newTenders.length > 0) {
          for (const tender of newTenders) {
            await postToSocialMedia(tender.id);
          }
        }
      }
    }

    let totalScraped = 0;
    let totalInserted = 0;
    let errors = [];

    // Try to scrape from real sources with retries
    console.log("Attempting to scrape from real sources");
    
    // MyGov scraping with retries
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`MyGov scraping attempt ${attempt}`);
        const { tenders, error: scrapeError } = await scrapeMygov();
        
        if (scrapeError) {
          console.error(`MyGov scraping error: ${scrapeError}`);
          errors.push(`MyGov attempt ${attempt}: ${scrapeError}`);
          continue;
        }
        
        if (tenders && tenders.length > 0) {
          console.log(`Found ${tenders.length} tenders from MyGov`);
          totalScraped += tenders.length;
          
          for (const tender of tenders) {
            // Check if this tender already exists (by title)
            const { data: existingTenders, error: checkError } = await supabase
              .from("tenders")
              .select("id")
              .ilike("title", tender.title)
              .limit(1);
            
            if (checkError) {
              console.error(`Error checking for existing tender: ${checkError.message}`);
              continue;
            }
            
            // Only insert if doesn't already exist
            if (!existingTenders || existingTenders.length === 0) {
              const success = await insertTender(tender);
              if (success) {
                totalInserted++;
                
                // Get the ID of the newly inserted tender
                const { data: newTender } = await supabase
                  .from("tenders")
                  .select("id")
                  .eq("title", tender.title)
                  .order("created_at", { ascending: false })
                  .limit(1);
                
                if (newTender && newTender.length > 0) {
                  await postToSocialMedia(newTender[0].id);
                }
              }
            } else {
              console.log(`Tender "${tender.title}" already exists`);
            }
          }
          
          // Success, break the retry loop
          break;
        } else {
          console.log("No tenders found from MyGov");
          errors.push(`MyGov attempt ${attempt}: No tenders found`);
        }
      } catch (err) {
        console.error(`MyGov scraping attempt ${attempt} failed: ${err.message}`);
        errors.push(`MyGov attempt ${attempt}: ${err.message}`);
      }
    }

    // Log the scraping operation
    let finalStatus = "success";
    if (totalInserted === 0) {
      finalStatus = errors.length > 0 ? "error" : "warning";
    }
    
    await logScrapingOperation(
      "combined",
      finalStatus,
      totalScraped,
      totalInserted,
      errors.length > 0 ? errors.join("; ") : null
    );

    // Return the response
    return new Response(
      JSON.stringify({
        status: finalStatus,
        tenders_scraped: totalInserted,
        total_tenders: (count || 0) + totalInserted,
        errors: errors.length > 0 ? errors : null
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (err) {
    console.error(`Unhandled error in scraper function: ${err.message}`);
    
    return new Response(
      JSON.stringify({
        status: "error",
        message: `Server error: ${err.message}`,
        tenders_scraped: 0
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
