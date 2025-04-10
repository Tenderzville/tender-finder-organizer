
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

// Create a single supabase client for interacting with your database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    console.log("Initializing sample data");
    
    // Check if we already have tenders
    const { count, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      throw countError;
    }
    
    let message = "No action taken - tenders already exist";
    let tendersCreated = 0;
    
    // Only create sample data if we don't have any tenders
    if (count === 0) {
      // Sample tender data
      const sampleTenders = [
        {
          title: "Office Supplies Procurement",
          description: "Procurement of office supplies including stationery, printer cartridges, and office equipment.",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
          deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          contact_info: "infrastructure@example.com",
          fees: "KES 50,000,000",
          prerequisites: "Must have completed at least 3 similar projects.",
          category: "Construction",
          location: "Kisumu",
          tender_url: "https://example.com/tenders/road-construction"
        },
        {
          title: "Healthcare Equipment Supply",
          description: "Supply of medical equipment for a new hospital wing including MRI machines, X-ray machines, and other diagnostic equipment.",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          contact_info: "health@example.com",
          fees: "KES 30,000,000",
          prerequisites: "Must be a certified medical equipment supplier.",
          category: "Healthcare",
          location: "Nakuru",
          tender_url: "https://example.com/tenders/healthcare-equipment",
          affirmative_action: { type: "women", percentage: 25 }
        },
        {
          title: "School Furniture Supply",
          description: "Supply of desks, chairs, and other furniture for primary schools in the region.",
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          contact_info: "education@example.com",
          fees: "KES 5,000,000",
          prerequisites: "Must have supplied to at least 3 schools in the past.",
          category: "Education",
          location: "Eldoret",
          tender_url: "https://example.com/tenders/school-furniture",
          affirmative_action: { type: "pwds", percentage: 15 }
        }
      ];
      
      const { data, error } = await supabase
        .from('tenders')
        .insert(sampleTenders)
        .select();
        
      if (error) {
        throw error;
      }
      
      tendersCreated = data.length;
      message = `Successfully created ${tendersCreated} sample tenders`;
      console.log(message);
      
      // Create a scraping log entry
      await supabase
        .from('scraping_logs')
        .insert({
          source: 'sample_data',
          status: 'success',
          records_found: tendersCreated,
          records_inserted: tendersCreated
        });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message,
        tendersCreated,
        totalTenders: count + tendersCreated
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error initializing sample data:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.details || null
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
