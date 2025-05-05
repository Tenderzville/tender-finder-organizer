
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

// Create a single supabase client for interacting with database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Bypass proxy to fetch real tender data
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} - Fetching ${url}`);
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          ...options.headers
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed:`, error);
      lastError = error;
      retries++;
      
      if (retries < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Function to directly scrape some basic tenders as a fallback
async function directScrape() {
  try {
    console.log("Attempting direct scrape as fallback");
    
    // Try to fetch from MyGov website
    const html = await fetchWithRetry('https://www.mygov.go.ke/all-tenders');
    
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
    
    // Get the latest scraping logs
    const { data: scrapingLogs, error: logsError } = await supabase
      .from('scraping_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (logsError) {
      console.error("Error fetching scraping logs:", logsError);
    }
    
    // Get the total tender count
    const { count: totalTenders, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error("Error counting tenders:", countError);
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
    
    // If we have no tenders, try direct scraping as fallback
    let directScrapeSuccessful = false;
    if (!totalTenders || totalTenders === 0) {
      directScrapeSuccessful = await directScrape();
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
        ping_error: pingError,
        scraping_logs: scrapingLogs,
        total_tenders: totalTenders || 0,
        latest_tenders: latestTenders || [],
        last_check: new Date().toISOString(),
        direct_scrape_successful: directScrapeSuccessful,
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
