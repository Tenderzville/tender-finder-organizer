
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Setting up monitoring tables...");
    
    // Create error logs table
    await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.error_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          operation TEXT NOT NULL,
          error_message TEXT,
          metadata JSONB,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_error_logs_operation ON public.error_logs(operation);
      `
    });
    
    // Create performance logs table
    await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.performance_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          operation TEXT NOT NULL,
          duration_ms INTEGER,
          items_processed INTEGER,
          items_inserted INTEGER,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_performance_logs_operation ON public.performance_logs(operation);
        CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON public.performance_logs(created_at);
      `
    });
    
    // Create API request logs table
    await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.api_request_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          endpoint TEXT NOT NULL,
          client_id TEXT,
          duration_ms INTEGER,
          success BOOLEAN,
          response_size INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON public.api_request_logs(endpoint);
        CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_request_logs(created_at);
      `
    });

    console.log("Monitoring tables created successfully");
    
    return new Response(JSON.stringify({
      success: true,
      message: "Monitoring tables created successfully",
      tables: ["error_logs", "performance_logs", "api_request_logs"]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error setting up monitoring:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
