
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

// Create a single supabase client for interacting with database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const BROWSER_AI_API_KEY = Deno.env.get("BROWSER_AI_API_KEY") || "";

// MYGOV Robot
const MYGOV_ROBOT_ID = "ac84ba46-2da7-4a54-b083-48de0011fb36";
// PPIP Robot  
const PPIP_ROBOT_ID = "f55e700b-f976-4a56-9bd5-9e837c70d9b7";

async function fetchTendersFromBrowserAI(robotId = PPIP_ROBOT_ID, originUrl = "https://tenders.go.ke/tenders") {
  try {
    console.log(`Fetching real tenders from Browser AI using robot ${robotId} and URL ${originUrl}...`);
    
    if (!BROWSER_AI_API_KEY) {
      console.error("Browser AI API key not configured");
      return { success: false, error: "Browser AI API key not configured" };
    }
    
    // Make API request to Browser AI (using v2 API)
    const apiUrl = `https://api.browse.ai/v2/robots/${robotId}/tasks`;
    
    const requestBody = {
      inputParameters: { 
        originUrl: originUrl, 
        tenders_list_limit: 9 
      }
    };
    
    console.log("Browser AI request body:", JSON.stringify(requestBody));
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BROWSER_AI_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    console.log("Browser AI raw response:", responseText);
    
    if (!response.ok) {
      console.error(`Browser AI API error: ${response.status} ${responseText}`);
      return { success: false, error: `Browser AI API error: ${response.status} ${responseText}` };
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`Failed to parse Browser AI response: ${parseError.message}`);
      return { success: false, error: `Failed to parse Browser AI response: ${parseError.message}` };
    }
    
    console.log("Browser AI parsed response:", data);
    
    // The response format might be different, let's handle various possible formats
    let tenders = [];
    
    if (data && data.result && data.result.extractedData && Array.isArray(data.result.extractedData.tenders)) {
      tenders = data.result.extractedData.tenders;
    } else if (data && Array.isArray(data.tenders)) {
      tenders = data.tenders;
    } else if (data && data.data && Array.isArray(data.data)) {
      tenders = data.data;
    } else {
      console.log("No real tenders found in Browser AI response");
      return { success: false, inserted: 0, tenders: [], message: "No real tenders available from Browser AI" };
    }
    
    const insertedTenders = [];
    
    for (const tender of tenders) {
      try {
        // Format tender data for our database schema
        const formattedTender = {
          title: tender.title || "Unknown Tender",
          description: tender.description || `Tender from ${tender.procuringEntity || 'Unknown Entity'}`,
          deadline: tender.deadline ? new Date(tender.deadline).toISOString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          contact_info: tender.procuringEntity || "Contact the procurement entity",
          category: tender.category || "Government",
          location: tender.location || "Kenya",
          tender_url: tender.sourceUrl || originUrl,
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
    
    console.log(`Successfully inserted ${insertedTenders.length} real tenders from Browser AI`);
    return { success: true, inserted: insertedTenders.length, tenders: insertedTenders };
  } catch (error) {
    console.error("Error in fetchTendersFromBrowserAI:", error);
    return { success: false, error: error.message, inserted: 0 };
  }
}

// Function to fetch tenders from both robots
async function fetchAllBrowserAITenders() {
  console.log("Fetching real tenders from all Browser AI robots...");
  
  const results = [];
  let totalInserted = 0;
  
  // First try PPIP robot
  const ppipResult = await fetchTendersFromBrowserAI(PPIP_ROBOT_ID, "https://tenders.go.ke/tenders");
  results.push({ source: "PPIP", result: ppipResult });
  if (ppipResult.success && ppipResult.inserted) {
    totalInserted += ppipResult.inserted;
  }
  
  // Then try MYGOV robot
  const mygovResult = await fetchTendersFromBrowserAI(MYGOV_ROBOT_ID, "https://www.mygov.go.ke/all-tenders");
  results.push({ source: "MYGOV", result: mygovResult });
  if (mygovResult.success && mygovResult.inserted) {
    totalInserted += mygovResult.inserted;
  }
  
  return {
    success: totalInserted > 0,
    totalInserted,
    results,
    message: totalInserted > 0 ? `Successfully fetched ${totalInserted} real tenders` : "No real tenders found from Browser AI sources"
  };
}

// Remove all sample tenders function
async function removeAllSampleTenders() {
  try {
    console.log("Removing all sample tenders...");
    
    // Delete any tender that has a source indicating it's a sample
    const { data: deletedSamples, error: samplesError } = await supabase
      .from("tenders")
      .delete()
      .or('source.eq.sample,source.eq.sample_data,source.eq.fallback,description.ilike.%fallback%,description.ilike.%sample%')
      .select();
    
    if (samplesError) {
      console.error("Error deleting sample tenders:", samplesError);
      return { success: false, error: samplesError.message };
    }
    
    console.log(`Removed ${deletedSamples?.length || 0} sample tenders`);
    return { success: true, removed: deletedSamples?.length || 0 };
  } catch (error) {
    console.error("Error in removeAllSampleTenders:", error);
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
    
    let result;
    
    if (path === "fetch-browser-ai") {
      // Remove any sample tenders first
      await removeAllSampleTenders();
      
      // Then fetch real tenders from both robots
      result = await fetchAllBrowserAITenders();
    } else if (path === "remove-samples") {
      // Remove sample tenders only
      result = await removeAllSampleTenders();
    } else {
      // Default to status check
      result = { 
        status: "ok",
        browser_ai_configured: !!BROWSER_AI_API_KEY,
        available_endpoints: [
          "fetch-browser-ai",
          "remove-samples"
        ],
        note: "Sample data creation has been permanently removed"
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
