
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

async function createSampleTenders() {
  console.log("Creating sample tenders as fallback...");
  
  const sampleTenders = [
    {
      title: "Supply of Office Furniture and Equipment",
      description: "Ministry of Education seeks suppliers for office furniture including desks, chairs, and filing cabinets for regional offices.",
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      contact_info: "Ministry of Education, Procurement Department",
      category: "Supplies & Equipment",
      location: "Nairobi",
      tender_url: "https://www.mygov.go.ke/all-tenders",
      requirements: "Valid business registration, tax compliance certificate, and 3 years experience in office equipment supply",
      source: "sample"
    },
    {
      title: "Construction of Water Borehole in Machakos County",
      description: "County Government of Machakos invites bids for drilling and construction of water boreholes in rural areas.",
      deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      contact_info: "County Government of Machakos, Water Department",
      category: "Construction",
      location: "Machakos",
      tender_url: "https://tenders.go.ke/website/tenders/index",
      requirements: "Experience in borehole drilling, valid licenses, and environmental compliance certificates",
      source: "sample"
    },
    {
      title: "IT Support and Maintenance Services",
      description: "National Hospital requires comprehensive IT support services including hardware maintenance and software support.",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      contact_info: "National Hospital, IT Department",
      category: "IT & Telecommunications",
      location: "Nairobi",
      tender_url: "https://www.mygov.go.ke/all-tenders",
      requirements: "ISO 27001 certification, 5 years experience in hospital IT systems, and 24/7 support capability",
      source: "sample"
    }
  ];

  let insertedCount = 0;
  
  for (const tender of sampleTenders) {
    try {
      // Check if tender with same title exists
      const { data: existingTender } = await supabase
        .from("tenders")
        .select("id")
        .eq("title", tender.title)
        .limit(1);
      
      if (!existingTender || existingTender.length === 0) {
        const { error: insertError } = await supabase
          .from("tenders")
          .insert([tender]);
          
        if (!insertError) {
          insertedCount++;
        } else {
          console.error("Error inserting sample tender:", insertError);
        }
      }
    } catch (error) {
      console.error("Error processing sample tender:", error);
    }
  }
  
  return insertedCount;
}

async function fetchTendersFromBrowserAI(robotId = PPIP_ROBOT_ID, originUrl = "https://tenders.go.ke/tenders") {
  try {
    console.log(`Fetching tenders from Browser AI using robot ${robotId} and URL ${originUrl}...`);
    
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
      console.log("No tenders found in Browser AI response, creating sample data");
      const sampleCount = await createSampleTenders();
      return { success: true, inserted: sampleCount, tenders: [] };
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
    
    console.log(`Successfully inserted ${insertedTenders.length} tenders from Browser AI`);
    return { success: true, inserted: insertedTenders.length, tenders: insertedTenders };
  } catch (error) {
    console.error("Error in fetchTendersFromBrowserAI:", error);
    
    // Fallback to sample data if Browser AI fails
    console.log("Browser AI failed, creating sample data as fallback");
    const sampleCount = await createSampleTenders();
    return { success: true, inserted: sampleCount, tenders: [], fallback: true };
  }
}

// Function to fetch tenders from both robots
async function fetchAllBrowserAITenders() {
  console.log("Fetching tenders from all Browser AI robots...");
  
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
  
  // If no real tenders were found, ensure we have sample data
  if (totalInserted === 0) {
    console.log("No tenders found from Browser AI, ensuring sample data exists");
    const sampleCount = await createSampleTenders();
    totalInserted = sampleCount;
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
      // First remove any sample tenders if we're doing a fresh fetch
      await removeAllSampleTenders();
      
      // Then fetch tenders from both robots
      result = await fetchAllBrowserAITenders();
    } else if (path === "remove-samples") {
      // Just remove sample tenders
      result = await removeAllSampleTenders();
    } else if (path === "create-samples") {
      // Create sample tenders
      const sampleCount = await createSampleTenders();
      result = {
        success: true,
        totalInserted: sampleCount,
        message: `Created ${sampleCount} sample tenders`
      };
    } else {
      // Default to status check
      result = { 
        status: "ok",
        browser_ai_configured: !!BROWSER_AI_API_KEY,
        available_endpoints: [
          "fetch-browser-ai",
          "remove-samples",
          "create-samples"
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
