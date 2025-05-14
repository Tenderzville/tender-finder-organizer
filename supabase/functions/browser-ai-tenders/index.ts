
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

// Create a single supabase client for interacting with database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const BROWSER_AI_API_KEY = Deno.env.get("BROWSER_AI_API_KEY") || "94aa65f3-e560-4acd-8930-ae77bfabc32d:7fe12098-15ed-46de-8e09-f0dd3ad80d1e";
const TEAM_ID = "895b572b-11e4-4037-920a-77b01654a4c8";

// MYGOV Robot
const MYGOV_ROBOT_ID = "ac84ba46-2da7-4a54-b083-48de0011fb36";
// PPIP Robot
const PPIP_ROBOT_ID = "f55e700b-f976-4a56-9bd5-9e837c70d9b7";

async function fetchTendersFromBrowserAI(robotId = PPIP_ROBOT_ID, originUrl = "https://tenders.go.ke/tenders") {
  try {
    console.log(`Fetching tenders from Browser AI using robot ${robotId} and URL ${originUrl}...`);
    
    // Make API request to Browser AI (using v2 API as per documentation)
    const apiUrl = `https://api.browse.ai/v2/robots/${robotId}/executions`;
    
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
      throw new Error(`Browser AI API error: ${response.status} ${responseText}`);
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Failed to parse Browser AI response: ${parseError.message}`);
    }
    
    console.log("Browser AI parsed response:", data);
    
    // Process and save tenders - adapt based on the actual response format
    if (data && data.result && data.result.extractedData && Array.isArray(data.result.extractedData.tenders)) {
      const tenders = data.result.extractedData.tenders;
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

// Function to fetch tenders from both robots
async function fetchAllBrowserAITenders() {
  console.log("Fetching tenders from all Browser AI robots...");
  
  const results = [];
  let totalInserted = 0;
  
  // First fetch from PPIP robot
  const ppipResult = await fetchTendersFromBrowserAI(PPIP_ROBOT_ID, "https://tenders.go.ke/tenders");
  results.push({ source: "PPIP", result: ppipResult });
  if (ppipResult.success && ppipResult.inserted) {
    totalInserted += ppipResult.inserted;
  }
  
  // Then fetch from MYGOV robot
  const mygovResult = await fetchTendersFromBrowserAI(MYGOV_ROBOT_ID, "https://www.mygov.go.ke/all-tenders");
  results.push({ source: "MYGOV", result: mygovResult });
  if (mygovResult.success && mygovResult.inserted) {
    totalInserted += mygovResult.inserted;
  }
  
  return {
    success: totalInserted > 0,
    totalInserted,
    results
  };
}

// Remove all sample tenders function
async function removeAllSampleTenders() {
  try {
    console.log("Removing all sample tenders...");
    
    // First delete tenders with hardcoded IDs (99991-99995)
    const { error: hardcodedError } = await supabase
      .from("tenders")
      .delete()
      .in("id", [99991, 99992, 99993, 99994, 99995]);
    
    if (hardcodedError) {
      console.error("Error deleting hardcoded tenders:", hardcodedError);
    }
    
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
      // First remove any sample tenders
      await removeAllSampleTenders();
      
      // Then fetch tenders from both robots
      result = await fetchAllBrowserAITenders();
    } else if (path === "remove-samples") {
      // Just remove sample tenders
      result = await removeAllSampleTenders();
    } else {
      // Default to status check
      result = { 
        status: "ok",
        browser_ai_configured: !!BROWSER_AI_API_KEY,
        available_endpoints: [
          "fetch-browser-ai",
          "remove-samples"
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
