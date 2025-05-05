
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
    
    // First, try to fetch the sheet data as CSV (public access required)
    // Replace /edit?usp=sharing with /export?format=csv
    const exportUrl = sheetUrl.replace(/\/edit.*$/, '/export?format=csv');
    console.log(`Converted sheet URL to export URL: ${exportUrl}`);
    
    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet data: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/(^"|"$)/g, '')));
    
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    console.log(`Found ${dataRows.length} rows of data with headers: ${headers.join(', ')}`);
    
    // Map CSV data to tender format
    const tenders = [];
    const insertedTenders = [];
    
    for (const row of dataRows) {
      if (row.length < 3) continue; // Skip incomplete rows
      
      try {
        const titleIndex = headers.findIndex(h => h.toLowerCase().includes('title'));
        const descriptionIndex = headers.findIndex(h => h.toLowerCase().includes('desc'));
        const deadlineIndex = headers.findIndex(h => h.toLowerCase().includes('dead'));
        const entityIndex = headers.findIndex(h => h.toLowerCase().includes('entity') || h.toLowerCase().includes('organization'));
        const categoryIndex = headers.findIndex(h => h.toLowerCase().includes('cat'));
        const locationIndex = headers.findIndex(h => h.toLowerCase().includes('loc'));
        const urlIndex = headers.findIndex(h => h.toLowerCase().includes('url') || h.toLowerCase().includes('link'));
        const requirementsIndex = headers.findIndex(h => h.toLowerCase().includes('req'));

        // Create tender object, using default values if columns aren't found
        const tender = {
          title: titleIndex >= 0 ? row[titleIndex] : row[0],
          description: descriptionIndex >= 0 ? row[descriptionIndex] : `Tender imported from Google Sheets`,
          deadline: deadlineIndex >= 0 ? parseDate(row[deadlineIndex]) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          contact_info: entityIndex >= 0 ? row[entityIndex] : "Contact the procurement entity",
          category: categoryIndex >= 0 ? row[categoryIndex] : "Government",
          location: locationIndex >= 0 ? row[locationIndex] : "Kenya",
          tender_url: urlIndex >= 0 && row[urlIndex] ? row[urlIndex] : null,
          requirements: requirementsIndex >= 0 ? row[requirementsIndex] : "See tender document for requirements",
          source: "google-sheets"
        };
        
        if (tender.title && tender.title.length > 3) {
          tenders.push(tender);
          
          // Check if tender with same title exists
          const { data: existingTender } = await supabase
            .from("tenders")
            .select("id")
            .eq("title", tender.title)
            .limit(1);
          
          if (!existingTender || existingTender.length === 0) {
            // Insert new tender
            const { data: insertData, error: insertError } = await supabase
              .from("tenders")
              .insert([tender])
              .select();
              
            if (insertError) {
              console.error("Error inserting tender from sheet:", insertError);
            } else if (insertData) {
              insertedTenders.push(insertData[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error processing row from sheet:", error);
      }
    }
    
    console.log(`Successfully inserted ${insertedTenders.length} tenders from Google Sheet`);
    return { success: true, imported: insertedTenders.length, tenders: insertedTenders };
  } catch (error) {
    console.error("Error importing from Google Sheet:", error);
    return { success: false, error: error.message };
  }
}

// Helper function to parse various date formats
function parseDate(dateStr: string): string {
  if (!dateStr) return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // Try direct ISO parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date.toISOString();
    
    // Try DD/MM/YYYY
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
      // Try both DD/MM/YYYY and MM/DD/YYYY
      const date1 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (!isNaN(date1.getTime())) return date1.toISOString();
      
      const date2 = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
      if (!isNaN(date2.getTime())) return date2.toISOString();
    }
    
    // Default to 14 days from now if parsing fails
    return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  } catch (e) {
    return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  }
}

// Function to import from both provided sheets
async function importFromSampleSheets() {
  const sheetUrls = [
    "https://docs.google.com/spreadsheets/d/1X6li714ElTTiKd_jwo6Kt1vpjIalwxmuwUO-Kzg38I8/edit?usp=sharing", // PPIP
    "https://docs.google.com/spreadsheets/d/1j7gokfil3TPBzZ_WrpCG2N_bP6DMeFtV_4HJgQkPQ0Q/edit?gid=710550239" // MYGOV
  ];
  
  let totalImported = 0;
  const results = [];
  
  for (const url of sheetUrls) {
    const result = await importFromGoogleSheet(url);
    results.push(result);
    if (result.success && result.imported) {
      totalImported += result.imported;
    }
  }
  
  return {
    success: true,
    totalImported,
    results
  };
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
    } else if (path === "import-sample-sheets") {
      // Import from the sample sheets provided
      result = await importFromSampleSheets();
    } else {
      // Default to status check
      result = { 
        status: "ok",
        browser_ai_configured: !!BROWSER_AI_API_KEY,
        available_endpoints: [
          "fetch-browser-ai",
          "import-sheet",
          "import-sample-sheets"
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
