import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { cron } from "https://deno.land/x/deno_cron@v1.0.0/cron.ts";
import { createSupabaseClient, corsHeaders } from "./utils.ts";
import { scrapeTenders } from "./scraper.ts";
import type { ScrapingResult } from "./types.ts";

async function handleScrapingProcess(): Promise<ScrapingResult> {
  const supabase = createSupabaseClient();
  const tenders = await scrapeTenders();

  if (tenders.length > 0) {
    try {
      console.log(`Attempting to insert ${tenders.length} tenders into database`);
      const { error, data } = await supabase
        .from('tenders')
        .upsert(tenders, {
          onConflict: 'title',
          ignoreDuplicates: true
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      console.log(`Successfully inserted/updated ${tenders.length} tenders`);
      return { success: true, tenders_scraped: tenders.length, data };
    } catch (error) {
      console.error('Error inserting tenders:', error);
      throw error;
    }
  }

  return { success: true, tenders_scraped: 0, message: 'No new tenders found' };
}

// Schedule scraping every 6 hours
cron("0 */6 * * *", () => {
  console.log("Running scheduled tender scraping...");
  handleScrapingProcess().catch(console.error);
});

// Serve HTTP endpoint
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Manual scraping triggered via HTTP endpoint');
    const result = await handleScrapingProcess();
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in tender scraping endpoint:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});