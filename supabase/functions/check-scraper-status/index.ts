
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

// Create a single supabase client for interacting with database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Direct API access to download tender data
async function directApiScrape() {
  try {
    console.log("Attempting direct API scrape");
    
    // Attempt to fetch data from the Tenders API
    const response = await fetch(
      "https://www.tenders.go.ke/api/active-tenders?search=&perpage=50&sortby=&order=asc&page=1",
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`API returned ${data.data?.length || 0} tender records`);
    
    if (!data.data || data.data.length === 0) {
      console.log("No tender data found in API response");
      return {
        success: false,
        count: 0
      };
    }
    
    // Process tender data and insert into database
    let insertedCount = 0;
    for (const tender of data.data) {
      try {
        // Format tender data for insertion
        const formattedTender = {
          title: tender.title || 'Unknown Tender',
          description: tender.description || `Tender from ${tender.pe?.name || 'Unknown Entity'}`,
          deadline: tender.close_at ? new Date(tender.close_at).toISOString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          contact_info: tender.pe?.name || 'Contact the procurement entity',
          category: tender.procurementCategory?.title || 'Government',
          location: 'Kenya',
          tender_url: `https://www.tenders.go.ke/tender/view/${tender.id}`,
          requirements: tender.description || 'See tender document for requirements'
        };
        
        // Check if tender already exists
        const { data: existingTender } = await supabase
          .from("tenders")
          .select("id")
          .eq("title", formattedTender.title)
          .limit(1);
        
        if (!existingTender || existingTender.length === 0) {
          // Insert new tender
          const { error: insertError } = await supabase
            .from("tenders")
            .insert([formattedTender]);
            
          if (insertError) {
            console.error("Error inserting tender:", insertError);
          } else {
            insertedCount++;
          }
        }
      } catch (error) {
        console.error("Error processing tender:", error);
      }
    }
    
    console.log(`Successfully inserted ${insertedCount} new tenders from direct API`);
    return {
      success: true,
      count: insertedCount
    };
  } catch (error) {
    console.error("Error in direct API scrape:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Fallback for direct website scraping
async function directScrape() {
  try {
    console.log("Attempting direct website scrape as fallback");
    
    // Try to fetch from MyGov website
    const html = await fetch('https://www.mygov.go.ke/all-tenders', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(30000),
    }).then(res => res.text());
    
    // Look for tender tables
    const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
    if (tableMatch && tableMatch.length > 0) {
      console.log("Found tables:", tableMatch.length);
      
      // Extract rows from tables
      const rowMatches = tableMatch[0].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      
      if (rowMatches && rowMatches.length > 1) {
        console.log("Found rows:", rowMatches.length);
        
        // Skip header row
        for (let i = 1; i < Math.min(rowMatches.length, 5); i++) {
          const row = rowMatches[i];
          const cellMatches = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
          
          if (cellMatches && cellMatches.length >= 3) {
            // Extract text content from cells
            const title = cellMatches[1]?.replace(/<[^>]*>/g, '').trim() || 'Unknown Tender';
            const entity = cellMatches[2]?.replace(/<[^>]*>/g, '').trim() || 'Unknown Entity';
            
            // Create a tender from this data
            const { data, error } = await supabase.from('tenders').insert([{
              title: title,
              description: `Procuring Entity: ${entity}`,
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              contact_info: entity,
              category: "Government",
              location: "Kenya",
              source: "direct-scrape"
            }]).select();
            
            if (error) {
              console.error("Error inserting directly scraped tender:", error);
            } else {
              console.log("Successfully inserted directly scraped tender:", data[0].id);
            }
          }
        }
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error in direct scrape:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting check-scraper-status function");
    
    // Check if the scraper function is available by pinging it
    let scraperAvailable = false;
    let pingError = null;
    
    try {
      const { data: pingData, error: pingErr } = await supabase.functions.invoke('scrape-tenders', {
        body: { ping: true }
      });
      
      if (!pingErr && pingData && pingData.success) {
        scraperAvailable = true;
      } else if (pingErr) {
        pingError = pingErr.message;
      }
    } catch (error) {
      console.error("Error pinging scrape-tenders function:", error);
      pingError = error.message;
    }
    
    // Get the total tender count
    const { count: totalTenders, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error("Error counting tenders:", countError);
    }
    
    // If we have no tenders, try direct API scraping
    let directApiSuccess = false;
    let directScrapeSuccessful = false;
    let apiResult = null;
    
    if (!totalTenders || totalTenders === 0) {
      console.log("No tenders found. Attempting direct API scrape...");
      apiResult = await directApiScrape();
      directApiSuccess = apiResult.success;
      
      // If API scrape fails, try direct website scraping
      if (!directApiSuccess) {
        console.log("Direct API scrape failed. Trying website scrape...");
        directScrapeSuccessful = await directScrape();
      }
    }
    
    // Get the latest scraping logs
    const { data: scrapingLogs, error: logsError } = await supabase
      .from('scraping_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (logsError) {
      console.error("Error fetching scraping logs:", logsError);
    }
    
    // Get the latest tenders
    const { data: latestTenders, error: tendersError } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (tendersError) {
      console.error("Error fetching latest tenders:", tendersError);
    }
    
    // Check if we have an API layer for external requests
    const apiLayerKey = Deno.env.get("API_LAYER_KEY");
    const apiLayerAvailable = !!apiLayerKey;
    
    // Return all data
    return new Response(
      JSON.stringify({
        status: "success",
        scraper_available: scraperAvailable,
        api_layer_available: apiLayerAvailable,
        api_scrape_successful: directApiSuccess,
        direct_scrape_successful: directScrapeSuccessful,
        api_result: apiResult,
        ping_error: pingError,
        scraping_logs: scrapingLogs,
        total_tenders: totalTenders || 0,
        latest_tenders: latestTenders || [],
        last_check: new Date().toISOString(),
        diagnostics: {
          edge_function_working: true,
          database_connected: !logsError && !tendersError,
          scraper_health: scraperAvailable ? "available" : "unavailable"
        }
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in check-scraper-status function:", error);
    
    return new Response(
      JSON.stringify({
        status: "error",
        error: error.message,
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
