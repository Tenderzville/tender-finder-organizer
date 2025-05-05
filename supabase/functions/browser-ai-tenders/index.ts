
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

// Create a single supabase client for interacting with database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const BROWSER_AI_API_KEY = Deno.env.get("BROWSER_AI_API_KEY");
const TEAM_ID = "895b572b-11e4-4037-920a-77b01654a4c8";
const ROBOT_ID = "f55e700b-f976-4a56-9bd5-9e837c70d9b7";

async function fetchTendersFromBrowserAI() {
  try {
    if (!BROWSER_AI_API_KEY) {
      throw new Error("Browser AI API key not configured");
    }

    console.log("Fetching tenders from Browser AI...");
    
    // Make API request to Browser AI
    const requestBody = {
      robotId: ROBOT_ID,
      input: { 
        originUrl: "https://www.tenders.go.ke/tenders", 
        tenders_list_limit: 9 
      }
    };
    
    const response = await fetch(`https://api.browser.ai/v1/teams/${TEAM_ID}/runs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BROWSER_AI_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Browser AI API error:", errorText);
      throw new Error(`Browser AI API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Browser AI response:", data);
    
    // Process and save tenders
    if (data && data.output && Array.isArray(data.output.tenders)) {
      const insertedTenders = [];
      
      for (const tender of data.output.tenders) {
        try {
          // Format tender data for our database schema
          const formattedTender = {
            title: tender.title || "Unknown Tender",
            description: tender.description || `Tender from ${tender.procuringEntity || 'Unknown Entity'}`,
            deadline: tender.deadline ? new Date(tender.deadline).toISOString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            contact_info: tender.procuringEntity || "Contact the procurement entity",
            category: tender.category || "Government",
            location: tender.location || "Kenya",
            tender_url: tender.sourceUrl || null,
            requirements: tender.requirements || "See tender document for requirements",
            source: "browser-ai"
          };
          
          // Check if tender with same title exists
          const { data: existingTender } = await supabase
            .from("tenders")
            .select("id")
            .eq("title", formattedTender.title)
            .limit(1);
          
          if (!existingTender || existingTender.length === 0) {
            // Insert new tender
            const { data: insertData, error: insertError } = await supabase
              .from("tenders")
              .insert([formattedTender])
              .select();
              
            if (insertError) {
              console.error("Error inserting tender:", insertError);
            } else if (insertData) {
              insertedTenders.push(insertData[0]);
            }
          }
        } catch (error) {
          console.error("Error processing tender:", error);
        }
      }
      
      console.log(`Successfully inserted ${insertedTenders.length} tenders from Browser AI`);
      return { success: true, inserted: insertedTenders.length, tenders: insertedTenders };
    } else {
      throw new Error("Invalid response format from Browser AI");
    }
  } catch (error) {
    console.error("Error in fetchTendersFromBrowserAI:", error);
    return { success: false, error: error.message };
  }
}

async function importFromGoogleSheet(sheetUrl: string) {
  try {
    console.log(`Attempting to import data from Google Sheet: ${sheetUrl}`);
    
    // This is a placeholder as direct Google Sheets access requires OAuth
    // In a real implementation, we would use a service account or public sheets API
    console.log("Note: Google Sheets import requires a separate setup with OAuth or service accounts");
    
    // For now, we'll return a status message
    return { 
      success: false, 
      message: "Google Sheets import requires additional setup. Please use the direct Browser AI integration." 
    };
  } catch (error) {
    console.error("Error importing from Google Sheet:", error);
    return { success: false, error: error.message };
  }
}

serve(async (req: Request) => {
  // Handle CORS for browser requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    
    // Parse request body if present
    let requestData = {};
    if (req.method === "POST") {
      try {
        requestData = await req.json();
      } catch (e) {
        // If JSON parsing fails, continue with empty object
      }
    }
    
    let result;
    
    if (path === "fetch-browser-ai") {
      // Fetch tenders from Browser AI
      result = await fetchTendersFromBrowserAI();
    } else if (path === "import-sheet") {
      // Import from Google Sheets
      const sheetUrl = (requestData as any).sheetUrl || "";
      result = await importFromGoogleSheet(sheetUrl);
    } else {
      // Default to status check
      result = { 
        status: "ok",
        browser_ai_configured: !!BROWSER_AI_API_KEY,
        available_endpoints: [
          "fetch-browser-ai",
          "import-sheet"
        ]
      };
    }
    
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error in browser-ai-tenders function:", error);
    
    return new Response(
      JSON.stringify({
        status: "error",
        error: error.message || String(error),
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
