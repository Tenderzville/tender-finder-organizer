
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
    
    // IMPORTANT: We're not adding sample data anymore, only creating tables if needed
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Database setup completed successfully. Tables created or verified.",
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
