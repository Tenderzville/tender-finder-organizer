
// supabase/functions/setup-db/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with service_role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseServiceKey) {
      throw new Error('Missing service role key');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if the scraping_logs table exists
    const { error: checkScrapingLogsError } = await supabase
      .from('scraping_logs')
      .select('id')
      .limit(1);
    
    if (checkScrapingLogsError) {
      console.log("Creating scraping_logs table...");
      
      // Create the scraping_logs table
      const { error: createScrapingLogsError } = await supabase.rpc('create_table_if_not_exists', {
        table_name: 'scraping_logs',
        definition: `
          id serial primary key,
          source text,
          status text,
          records_found integer,
          records_inserted integer,
          error_message text,
          created_at timestamp with time zone default now()
        `
      });
      
      if (createScrapingLogsError) {
        throw createScrapingLogsError;
      }
    }
    
    // Check if the social_media_posts table exists
    const { error: checkSocialMediaPostsError } = await supabase
      .from('social_media_posts')
      .select('id')
      .limit(1);
    
    if (checkSocialMediaPostsError) {
      console.log("Creating social_media_posts table...");
      
      // Create the social_media_posts table
      const { error: createSocialMediaPostsError } = await supabase.rpc('create_table_if_not_exists', {
        table_name: 'social_media_posts',
        definition: `
          id serial primary key,
          tender_id integer references tenders(id),
          twitter_posted boolean default false,
          telegram_posted boolean default false,
          created_at timestamp with time zone default now()
        `
      });
      
      if (createSocialMediaPostsError) {
        throw createSocialMediaPostsError;
      }
    }
    
    // Check if we have sample data
    const { count, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    if (count === 0) {
      console.log("Adding sample tenders...");
      
      // Add sample tenders
      const sampleTenders = [
        {
          title: "Construction of Rural Health Centers",
          description: "Project involves construction of 5 health centers in rural areas with modern facilities and equipment",
          requirements: "Registered contractors with Class 5+ certification",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          contact_info: "Ministry of Health Kenya",
          fees: "KES 50,000,000",
          prerequisites: "Previous experience in healthcare construction",
          category: "Construction",
          subcategory: "Healthcare",
          tender_url: "https://example.com/tenders/health-centers",
          location: "Nairobi"
        },
        {
          title: "Supply of IT Equipment to Schools",
          description: "Supply and installation of computers, printers and networking equipment to 20 secondary schools",
          requirements: "Registered IT suppliers with at least 5 years experience",
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
          contact_info: "Ministry of Education",
          fees: "KES 25,000,000",
          prerequisites: "Must be an authorized dealer for major brands",
          category: "IT",
          subcategory: "Hardware",
          tender_url: "https://example.com/tenders/school-it",
          location: "Nairobi"
        },
        {
          title: "Road Maintenance Works - Eastern Region",
          description: "Maintenance and repair of 150km of roads in the Eastern region including drainage works and signage",
          requirements: "NCA 2 and above contractors",
          deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
          contact_info: "Kenya National Highways Authority",
          fees: "KES 120,000,000",
          prerequisites: "Equipment ownership or lease agreements required",
          category: "Construction",
          subcategory: "Roads",
          tender_url: "https://example.com/tenders/eastern-roads",
          location: "Eastern Kenya"
        }
      ];
      
      const { error: insertError } = await supabase
        .from('tenders')
        .insert(sampleTenders);
      
      if (insertError) {
        throw insertError;
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Database setup completed successfully",
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error setting up database:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
