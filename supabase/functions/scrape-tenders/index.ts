
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';
import { extractTendersFromMyGov, extractTendersFromPPIP } from './scraper.ts';

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Log to console and database
async function logScraperActivity(source: string, status: string, recordsFound?: number, recordsInserted?: number, errorMessage?: string) {
  console.log(`[${source}] Status: ${status}, Found: ${recordsFound || 0}, Inserted: ${recordsInserted || 0}${errorMessage ? `, Error: ${errorMessage}` : ''}`);
  
  try {
    const { error } = await supabase
      .from('scraping_logs')
      .insert({
        source,
        status,
        records_found: recordsFound,
        records_inserted: recordsInserted,
        error_message: errorMessage
      });
    
    if (error) console.error('Error logging to database:', error);
  } catch (err) {
    console.error('Failed to log scraper activity:', err);
  }
}

Deno.serve(async (req) => {
  try {
    console.log('Starting tender scraper...');
    
    // Total counters
    let totalTendersScraped = 0;
    let totalTendersInserted = 0;
    
    // Run myGov scraper
    try {
      console.log('Scraping tenders from MyGov...');
      const myGovResult = await extractTendersFromMyGov(supabase, cheerio);
      
      totalTendersScraped += myGovResult.tendersFound;
      totalTendersInserted += myGovResult.tendersInserted;
      
      await logScraperActivity(
        'myGov', 
        myGovResult.success ? 'success' : 'error',
        myGovResult.tendersFound,
        myGovResult.tendersInserted,
        myGovResult.error
      );
    } catch (err) {
      console.error('Error in MyGov scraper:', err);
      await logScraperActivity('myGov', 'error', 0, 0, err.message);
    }
    
    // Run PPIP scraper
    try {
      console.log('Scraping tenders from PPIP...');
      const ppipResult = await extractTendersFromPPIP(supabase, cheerio);
      
      totalTendersScraped += ppipResult.tendersFound;
      totalTendersInserted += ppipResult.tendersInserted;
      
      await logScraperActivity(
        'PPIP', 
        ppipResult.success ? 'success' : 'error',
        ppipResult.tendersFound,
        ppipResult.tendersInserted,
        ppipResult.error
      );
    } catch (err) {
      console.error('Error in PPIP scraper:', err);
      await logScraperActivity('PPIP', 'error', 0, 0, err.message);
    }
    
    // Get total tenders in the database
    const { count: totalTenders, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting tenders:', countError);
    }
    
    await logScraperActivity('scheduled', 'completed', totalTendersScraped, totalTendersInserted);
    
    // Return response
    return new Response(
      JSON.stringify({
        tenders_scraped: totalTendersInserted,
        total_tenders: totalTenders || 0,
        message: `Scraped ${totalTendersScraped} tenders, inserted ${totalTendersInserted} new tenders`
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in scraper function:', error);
    await logScraperActivity('scheduled', 'error', 0, 0, error.message);
    
    return new Response(
      JSON.stringify({ 
        error: 'Scraper function failed', 
        message: error.message 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
