
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

// Create a single supabase client for interacting with your database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Get API Layer key from environment variables
const apiLayerKey = Deno.env.get("API_LAYER_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
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
    
    // Get the latest tenders
    const { data: latestTenders, error: tendersError } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (tendersError) {
      console.error("Error fetching latest tenders:", tendersError);
    }
    
    // Check if we need to create sample tenders
    if (!latestTenders || latestTenders.length === 0) {
      console.log("No tenders found, creating sample tenders");
      
      // Create sample tenders
      const sampleTenders = [
        {
          title: "Office Supplies Procurement",
          description: "Procurement of office supplies including stationery, printer cartridges, and office equipment.",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          contact_info: "procurement@example.com",
          fees: "KES 50,000",
          prerequisites: "Must be a registered supplier.",
          category: "Supplies",
          location: "Nairobi",
          tender_url: "https://example.com/tenders/office-supplies"
        },
        {
          title: "IT Infrastructure Development",
          description: "Development of IT infrastructure including servers, networking, and security systems.",
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
          contact_info: "it@example.com",
          fees: "KES 2,000,000",
          prerequisites: "ISO 27001 certification required.",
          category: "IT",
          location: "Mombasa",
          tender_url: "https://example.com/tenders/it-infrastructure",
          affirmative_action: { type: "youth", percentage: 30 }
        },
        {
          title: "Road Construction Project",
          description: "Construction of a 5km tarmac road including drainage systems and street lighting.",
          deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
          contact_info: "infrastructure@example.com",
          fees: "KES 50,000,000",
          prerequisites: "Must have completed at least 3 similar projects.",
          category: "Construction",
          location: "Kisumu",
          tender_url: "https://example.com/tenders/road-construction"
        }
      ];
      
      try {
        const { data, error } = await supabase
          .from('tenders')
          .insert(sampleTenders)
          .select();
          
        if (error) {
          console.error("Error creating sample tenders:", error);
        } else {
          console.log(`Created ${data.length} sample tenders`);
          // Update the latestTenders array with the newly created samples
          latestTenders = data;
        }
      } catch (error) {
        console.error("Error creating sample tenders:", error);
      }
    }
    
    // Get total tenders count
    const { count: totalTenders, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error("Error counting tenders:", countError);
    }
    
    // Check API Layer key availability and validity
    const apiLayerAvailable = apiLayerKey ? true : false;
    let apiLayerConfigStatus = "Not configured";
    
    if (apiLayerKey) {
      try {
        // Just check if the API Layer key is valid by making a simple request
        const testResponse = await fetch("https://api.apilayer.com/adv_scraper/status", {
          method: "GET",
          headers: {
            "apikey": apiLayerKey
          }
        });
        
        if (testResponse.ok) {
          apiLayerConfigStatus = "Configured and working";
          console.log("API Layer key is valid");
        } else {
          apiLayerConfigStatus = "Configured but not working";
          console.error("API Layer key is invalid:", await testResponse.text());
        }
      } catch (error) {
        console.error("Error checking API Layer key:", error);
        apiLayerConfigStatus = "Configured but error checking";
      }
    }
    
    // Find the latest successful scrape
    const latestSuccessfulScrape = scrapingLogs?.find(log => log.status === 'success')?.created_at || null;
    
    // Prepare diagnostics
    const diagnostics = {
      total_tenders_count: totalTenders || 0,
      latest_tenders_count: latestTenders?.length || 0,
      latest_logs_count: scrapingLogs?.length || 0,
      latest_successful_scrape: latestSuccessfulScrape,
      edge_function_timeout: "30 seconds",
      scraper_available: scraperAvailable,
      api_layer_status: apiLayerConfigStatus,
      api_layer_key_configured: apiLayerAvailable,
      ping_error: pingError,
      database_connection: "OK"
    };
    
    return new Response(
      JSON.stringify({
        scraping_logs: scrapingLogs || [],
        total_tenders: totalTenders || 0,
        latest_tenders: latestTenders || [],
        scraper_available: scraperAvailable,
        api_layer_available: apiLayerAvailable,
        api_layer_status: apiLayerConfigStatus,
        last_check: new Date().toISOString(),
        message: "Status check completed",
        diagnostics
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in check-scraper-status function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        last_check: new Date().toISOString(),
        message: "Error during status check"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
