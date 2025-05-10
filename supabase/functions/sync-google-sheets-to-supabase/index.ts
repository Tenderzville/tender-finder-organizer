
import { serve } from "std/server";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// The Google Sheet URLs that contain our tender data
const googleSheetUrls = [
  "https://docs.google.com/spreadsheets/d/1X6li714ElTTiKd_jwo6Kt1vpjIalwxmuwUO-Kzg38I8/export?format=csv", // PPIP
  "https://docs.google.com/spreadsheets/d/1j7gokfil3TPBzZ_WrpCG2N_bP6DMeFtV_4HJgQkPQ0Q/export?format=csv"  // MYGOV
];

// Helper to fetch CSV data from Google Sheets URL with proper error handling
async function fetchSheetCsv(url: string): Promise<string> {
  console.log(`Fetching CSV data from: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet CSV from ${url}: HTTP ${response.status} - ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log(`Successfully fetched CSV data (${text.length} bytes)`);
    return text;
  } catch (error) {
    console.error(`Error fetching sheet ${url}:`, error);
    throw error;
  }
}

// Enhanced CSV parser with better error handling for various CSV formats
function parseCsv(csv: string): Record<string, string>[] {
  try {
    const lines = csv.trim().split("\n");
    if (lines.length <= 1) {
      console.log("CSV appears to be empty or has only headers");
      return [];
    }
    
    const headers = lines[0].split(",").map(header => header.trim().replace(/^"(.*)"$/, "$1"));
    console.log(`CSV headers: ${headers.join(', ')}`);
    
    const results: Record<string, string>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      // Handle CSV with quoted values properly
      const values: string[] = [];
      let currentValue = "";
      let inQuotes = false;
      
      for (let char of lines[i]) {
        if (char === '"' && currentValue === "") {
          inQuotes = true;
        } else if (char === '"' && inQuotes) {
          inQuotes = false;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      
      // Create object from headers and values
      const obj: Record<string, string> = {};
      headers.forEach((header, j) => {
        obj[header] = values[j] ? values[j].replace(/^"(.*)"$/, "$1") : "";
      });
      
      // Only add non-empty rows
      if (Object.values(obj).some(v => v.trim() !== '')) {
        results.push(obj);
      }
    }
    
    console.log(`Successfully parsed ${results.length} rows from CSV`);
    return results;
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return [];
  }
}

// Map fields from different CSV formats to our tender schema
function mapFieldsToTender(csvData: Record<string, string>): Record<string, any> {
  // Find the right fields by checking available keys
  const keys = Object.keys(csvData).map(k => k.toLowerCase());
  
  const getField = (possibleNames: string[]): string => {
    const fieldName = Object.keys(csvData).find(key => 
      possibleNames.some(name => key.toLowerCase().includes(name.toLowerCase()))
    );
    return fieldName ? csvData[fieldName] : "";
  };
  
  // Try to determine the tender type from data
  const isAgpo = getField(['agpo', 'affirmative']).toLowerCase().includes('yes') || 
               getField(['title', 'description']).toLowerCase().includes('youth') ||
               getField(['title', 'description']).toLowerCase().includes('women');
  
  // Create affirmative action object if applicable
  let affirmativeAction = null;
  if (isAgpo) {
    const type = 
      getField(['title', 'description']).toLowerCase().includes('youth') ? 'youth' :
      getField(['title', 'description']).toLowerCase().includes('women') ? 'women' : 
      getField(['title', 'description']).toLowerCase().includes('pwd') ? 'pwds' : 'youth';
      
    affirmativeAction = {
      type,
      percentage: 30,
      details: `This is an AGPO tender for ${type}`
    };
  }
  
  // Try to parse deadline date in multiple formats
  const deadlineStr = getField(['deadline', 'closing', 'date', 'due']);
  let deadline = null;
  if (deadlineStr) {
    try {
      deadline = new Date(deadlineStr).toISOString();
    } catch (e) {
      // If direct parsing fails, try different formats
      try {
        const parts = deadlineStr.split(/[\/\-\.]/);
        if (parts.length === 3) {
          // Try both DD/MM/YYYY and MM/DD/YYYY
          deadline = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
        }
      } catch (e2) {
        deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      }
    }
  } else {
    deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  }
  
  return {
    title: getField(['title', 'tender id', 'tender description']),
    description: getField(['description', 'tender description', 'desc']),
    procuring_entity: getField(['procuring entity', 'entity', 'organization']),
    tender_no: getField(['tender no', 'tender id', 'id']),
    category: getField(['category', 'type']) || "Government",
    deadline,
    location: getField(['location', 'county']) || "Kenya",
    tender_url: getField(['url', 'link', 'tender url']) || null,
    affirmative_action: affirmativeAction,
    source: "google-sheets",
    points_required: 0  // Make imported tenders freely accessible
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Starting Google Sheets to Supabase sync process");
    let totalImported = 0;
    const importDetails = [];
    
    for (const url of googleSheetUrls) {
      console.log(`Processing sheet URL: ${url}`);
      try {
        const csv = await fetchSheetCsv(url);
        const parsedData = parseCsv(csv);
        console.log(`Parsed ${parsedData.length} rows from sheet`);
        
        if (parsedData.length === 0) {
          importDetails.push({ url, error: "No data parsed from CSV" });
          continue;
        }
        
        // Map data to our tender schema and prepare for upsert
        const tendersToUpsert = parsedData.map(mapFieldsToTender)
          // Filter out entries with empty titles
          .filter(t => t.title && t.title.trim() !== "");
          
        console.log(`Prepared ${tendersToUpsert.length} tenders for upsert`);
        
        if (tendersToUpsert.length > 0) {
          // Use tender_no as conflict detection if available, otherwise use title
          const { data, error } = await supabase
            .from("tenders")
            .upsert(tendersToUpsert, { 
              onConflict: tendersToUpsert[0].tender_no ? 'tender_no' : 'title',
              ignoreDuplicates: false
            });

          if (error) {
            console.error(`Error upserting tenders: ${error.message}`);
            importDetails.push({ url, error: error.message, count: 0 });
          } else {
            totalImported += tendersToUpsert.length;
            importDetails.push({ url, count: tendersToUpsert.length });
            console.log(`Successfully imported ${tendersToUpsert.length} tenders from ${url}`);
          }
        } else {
          importDetails.push({ url, error: "No valid tenders found in data", count: 0 });
          console.log("No valid tenders found in parsed data");
        }
      } catch (sheetError) {
        console.error(`Error processing sheet ${url}: ${sheetError.message}`);
        importDetails.push({ url, error: sheetError.message });
      }
    }

    // Update the last sync timestamp in a metadata table for tracking
    await supabase
      .from("scraping_logs")
      .insert({
        source: "google-sheets",
        status: totalImported > 0 ? "success" : "partial", 
        records_found: totalImported,
        records_inserted: totalImported
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sync completed. Imported ${totalImported} tenders.`,
        totalImported,
        details: importDetails
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        }
      }
    );
  } catch (error) {
    console.error("Error in sync-google-sheets-to-supabase function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || String(error)
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        }
      }
    );
  }
});
