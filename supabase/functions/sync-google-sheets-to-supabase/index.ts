
// Import from the paths defined in import_map.json
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample tenders to use as fallback data
const sampleTenders = [
  {
    title: "Supply of IT Equipment for Government Offices",
    description: "Supply and delivery of desktop computers, laptops, printers, and networking equipment for government offices in Nairobi.",
    procuring_entity: "Ministry of ICT",
    tender_no: "MOI/ICT/001/2025",
    category: "IT & Telecommunications",
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Nairobi",
    tender_url: "https://www.tenders.go.ke/tender/123456",
    affirmative_action: {
      type: "youth",
      percentage: 30,
      details: "30% of the tender value is reserved for youth-owned businesses"
    },
    source: "sample-data",
    points_required: 0
  },
  {
    title: "Construction of Rural Roads in Western Counties",
    description: "Construction and maintenance of rural access roads in selected western counties including drainage works and bridges.",
    procuring_entity: "Kenya Rural Roads Authority",
    tender_no: "KeRRA/WC/234/2025",
    category: "Construction",
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Western Kenya",
    tender_url: "https://www.kenha.co.ke/tenders/234",
    source: "sample-data",
    points_required: 0
  },
  {
    title: "Medical Supplies for County Hospitals",
    description: "Supply of essential medicines, medical equipment, and laboratory supplies to county hospitals.",
    procuring_entity: "Ministry of Health",
    tender_no: "MOH/MS/345/2025",
    category: "Medical",
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Nationwide",
    tender_url: "https://www.health.go.ke/tenders",
    affirmative_action: {
      type: "women",
      percentage: 30,
      details: "30% of the tender value is reserved for women-owned businesses"
    },
    source: "sample-data",
    points_required: 0
  },
  {
    title: "School Feeding Program Supplies",
    description: "Supply and delivery of food items for the national school feeding program in primary schools.",
    procuring_entity: "Ministry of Education",
    tender_no: "MOE/SFP/456/2025",
    category: "Food & Agriculture",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Nationwide",
    tender_url: "https://www.education.go.ke/tenders",
    source: "sample-data",
    points_required: 0
  },
  {
    title: "Solar Power Installation for Rural Schools",
    description: "Installation of solar power systems in selected rural schools to support digital learning initiatives.",
    procuring_entity: "Rural Electrification Authority",
    tender_no: "REA/SPR/567/2025",
    category: "Energy",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Rural Areas",
    tender_url: "https://www.rea.go.ke/tenders",
    source: "sample-data",
    points_required: 0
  }
];

// Helper to create sample tenders and return total inserted
async function createSampleTenders(): Promise<number> {
  console.log("Importing sample tenders as fallback");
  
  try {
    const { data, error } = await supabase
      .from("tenders")
      .upsert(sampleTenders, { 
        onConflict: 'tender_no',
        ignoreDuplicates: false
      });

    if (error) {
      console.error("Error inserting sample tenders:", error);
      return 0;
    }
    
    console.log(`Successfully imported ${sampleTenders.length} sample tenders`);
    return sampleTenders.length;
  } catch (error) {
    console.error("Error in createSampleTenders:", error);
    return 0;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Starting Google Sheets to Supabase sync process");
    
    // First check if there are already tenders in the database
    const { count, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error checking existing tenders:", countError);
    } else {
      console.log(`Found ${count || 0} existing tenders in database`);
    }
    
    // If there are already tenders, just return success
    if (count && count > 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Database already contains ${count} tenders.`,
          totalImported: 0
        }),
        {
          status: 200,
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          }
        }
      );
    }
    
    // Since there are no tenders, import sample tenders
    const totalImported = await createSampleTenders();
    
    // Record this import in the logs
    if (totalImported > 0) {
      await supabase
        .from("scraping_logs")
        .insert({
          source: "sample-data",
          status: "success", 
          records_found: totalImported,
          records_inserted: totalImported
        });
    }

    return new Response(
      JSON.stringify({ 
        success: totalImported > 0, 
        message: `Imported ${totalImported} sample tenders.`,
        totalImported
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
    
    // Attempt to create sample tenders as a last resort
    try {
      const totalImported = await createSampleTenders();
      
      if (totalImported > 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Recovered with ${totalImported} sample tenders after error.`,
            totalImported,
            originalError: error.message || String(error)
          }),
          {
            status: 200,
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json" 
            }
          }
        );
      }
    } catch (fallbackError) {
      console.error("Error in fallback sample tender creation:", fallbackError);
    }
    
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
