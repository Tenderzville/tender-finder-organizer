
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Get the user's ID from the token
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized",
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Process the request based on method
    if (req.method === 'POST') {
      // Add a new rating
      const { providerId, rating, comment } = await req.json();
      
      const { data, error } = await supabase
        .from('service_provider_ratings')
        .insert({
          provider_id: providerId,
          user_id: user.id,
          rating,
          comment,
        })
        .select();
      
      if (error) {
        throw error;
      }

      // Update provider average rating
      await updateProviderRating(supabase, providerId);
      
      return new Response(
        JSON.stringify({
          success: true,
          data,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (req.method === 'GET') {
      // Get ratings for a provider
      const url = new URL(req.url);
      const providerId = url.searchParams.get('providerId');
      
      if (!providerId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Provider ID is required",
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
      
      const { data, error } = await supabase
        .from('service_provider_ratings')
        .select('*, profiles:user_id(company_name)')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          ratings: data,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // Method not allowed
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    );
  } catch (error) {
    console.error("Error processing service provider rating:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper function to update provider average rating
async function updateProviderRating(supabase, providerId) {
  // Get average rating
  const { data } = await supabase
    .from('service_provider_ratings')
    .select('rating')
    .eq('provider_id', providerId);
  
  if (!data || data.length === 0) return;
  
  const averageRating = data.reduce((sum, item) => sum + item.rating, 0) / data.length;
  
  // Update provider record
  await supabase
    .from('service_providers')
    .update({ average_rating: averageRating, ratings_count: data.length })
    .eq('id', providerId);
}
