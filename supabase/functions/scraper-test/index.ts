// supabase/functions/scraper-test/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface ScraperStatus {
  function: string;
  lastRunTime: string | null;
  status: string;
  tenders: number;
  error?: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Check auth status
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Only admin users can access this endpoint
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Get last run time for each scraper from the logs table
    const { data: logs, error: logsError } = await supabaseClient
      .from("scraper_logs")
      .select("function_name, created_at, status, tenders_count, error")
      .order("created_at", { ascending: false })
      .limit(50);

    if (logsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch scraper logs", details: logsError }),
        {
          headers: { "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Process logs to get the latest status for each scraper
    const scraperStatus: Record<string, ScraperStatus> = {};
    
    if (logs) {
      logs.forEach((log) => {
        if (!scraperStatus[log.function_name]) {
          scraperStatus[log.function_name] = {
            function: log.function_name,
            lastRunTime: log.created_at,
            status: log.status,
            tenders: log.tenders_count || 0,
            error: log.error || undefined,
          };
        }
      });
    }

    // Get total tender count
    const { count: tenderCount, error: countError } = await supabaseClient
      .from("tenders")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch tender count", details: countError }),
        {
          headers: { "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Return the test results
    return new Response(
      JSON.stringify({
        scrapers: Object.values(scraperStatus),
        totalTenders: tenderCount || 0,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
