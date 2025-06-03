
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// SheetDB.io API endpoints
const SHEETDB_ENDPOINTS = [
  "https://sheetdb.io/api/v1/zktjeixgjfqal",
  "https://sheetdb.io/api/v1/odxdpd8mfgoa0"
];

// Helper to fetch data from SheetDB.io
async function fetchFromSheetDB(endpoint: string): Promise<any[]> {
  console.log(`Fetching data from SheetDB: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`SheetDB API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${Array.isArray(data) ? data.length : 0} records from ${endpoint}`);
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching from SheetDB ${endpoint}:`, error);
    return [];
  }
}

// Helper to transform SheetDB data to tender format
function transformSheetDBToTender(row: any, source: string): any {
  // Map common field variations to our tender fields
  const title = row.title || row.Title || row.tender_title || row['Tender Title'] || 'Untitled Tender';
  const description = row.description || row.Description || row.tender_description || row['Description'] || '';
  const deadline = row.deadline || row.Deadline || row.submission_deadline || row['Deadline'] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const category = row.category || row.Category || row.tender_category || row['Category'] || 'General';
  const location = row.location || row.Location || row.tender_location || row['Location'] || 'Kenya';
  const procuring_entity = row.procuring_entity || row['Procuring Entity'] || row.organization || row.Organization || 'Government Entity';
  const tender_no = row.tender_no || row['Tender No'] || row.reference || row.Reference || `SHEET-${Date.now()}`;
  const tender_url = row.tender_url || row['Tender URL'] || row.url || row.URL || '';
  const contact_info = row.contact_info || row['Contact Info'] || row.contact || row.Contact || '';
  const requirements = row.requirements || row.Requirements || row.eligibility || row.Eligibility || '';

  // Parse deadline to ensure it's a valid date
  let parsedDeadline: string;
  try {
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      // If deadline is invalid, set it to 30 days from now
      parsedDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      parsedDeadline = deadlineDate.toISOString();
    }
  } catch {
    parsedDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  return {
    title: title.toString().trim(),
    description: description.toString().trim(),
    deadline: parsedDeadline,
    category: category.toString().trim(),
    location: location.toString().trim(),
    procuring_entity: procuring_entity.toString().trim(),
    tender_no: tender_no.toString().trim(),
    tender_url: tender_url.toString().trim(),
    contact_info: contact_info.toString().trim(),
    requirements: requirements.toString().trim(),
    source: `sheetdb-${source}`,
    points_required: 0,
    created_at: new Date().toISOString()
  };
}

// Helper to import tenders from all SheetDB endpoints
async function importTendersFromSheetDB(): Promise<number> {
  console.log("Starting SheetDB import process...");
  let totalImported = 0;

  for (let i = 0; i < SHEETDB_ENDPOINTS.length; i++) {
    const endpoint = SHEETDB_ENDPOINTS[i];
    const sourceId = i + 1;
    
    try {
      console.log(`Processing SheetDB endpoint ${sourceId}: ${endpoint}`);
      
      const rawData = await fetchFromSheetDB(endpoint);
      
      if (rawData.length === 0) {
        console.log(`No data found in SheetDB endpoint ${sourceId}`);
        continue;
      }

      // Transform the data to tender format
      const tenders = rawData
        .map(row => transformSheetDBToTender(row, sourceId.toString()))
        .filter(tender => tender.title && tender.title !== 'Untitled Tender'); // Filter out empty/invalid tenders

      if (tenders.length === 0) {
        console.log(`No valid tenders found in SheetDB endpoint ${sourceId} after transformation`);
        continue;
      }

      console.log(`Transformed ${tenders.length} valid tenders from SheetDB endpoint ${sourceId}`);

      // Insert tenders into database with conflict resolution
      const { data, error } = await supabase
        .from("tenders")
        .upsert(tenders, { 
          onConflict: 'tender_no',
          ignoreDuplicates: false
        })
        .select('id');

      if (error) {
        console.error(`Error inserting tenders from SheetDB endpoint ${sourceId}:`, error);
        
        // Log to error_logs table if it exists
        try {
          await supabase.from('error_logs').insert({
            operation: `sheetdb_import_${sourceId}`,
            error_message: error.message,
            metadata: { endpoint, tender_count: tenders.length }
          });
        } catch (logError) {
          console.error('Failed to log error:', logError);
        }
        
        continue;
      }

      const insertedCount = data ? data.length : tenders.length;
      totalImported += insertedCount;
      
      console.log(`Successfully imported ${insertedCount} tenders from SheetDB endpoint ${sourceId}`);

      // Log to performance_logs table if it exists
      try {
        await supabase.from('performance_logs').insert({
          operation: `sheetdb_import_${sourceId}`,
          duration_ms: 0, // We could measure this if needed
          items_processed: rawData.length,
          items_inserted: insertedCount,
          metadata: { endpoint, source: `sheetdb-${sourceId}` }
        });
      } catch (logError) {
        console.error('Failed to log performance:', logError);
      }

    } catch (error) {
      console.error(`Error processing SheetDB endpoint ${sourceId}:`, error);
      
      // Log error
      try {
        await supabase.from('error_logs').insert({
          operation: `sheetdb_import_${sourceId}`,
          error_message: error.message || String(error),
          metadata: { endpoint }
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }
  }

  console.log(`SheetDB import completed. Total imported: ${totalImported} tenders`);
  return totalImported;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Starting SheetDB to Supabase sync process");
    
    // Import tenders from SheetDB.io
    const totalImported = await importTendersFromSheetDB();
    
    // Record this import in the logs
    if (totalImported > 0) {
      try {
        await supabase
          .from("scraping_logs")
          .insert({
            source: "sheetdb",
            status: "success", 
            records_found: totalImported,
            records_inserted: totalImported
          });
      } catch (logError) {
        console.error('Failed to log to scraping_logs:', logError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: totalImported > 0, 
        message: `Imported ${totalImported} tenders from SheetDB.io APIs.`,
        totalImported,
        endpoints: SHEETDB_ENDPOINTS.length
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
    console.error("Error in SheetDB sync function:", error);
    
    // Log the error
    try {
      await supabase.from('error_logs').insert({
        operation: 'sheetdb_sync_main',
        error_message: error.message || String(error),
        metadata: { endpoints: SHEETDB_ENDPOINTS }
      });
    } catch (logError) {
      console.error('Failed to log main error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || String(error),
        message: "Failed to sync tenders from SheetDB.io"
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
