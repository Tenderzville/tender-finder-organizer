import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { cron } from "https://deno.land/x/deno_cron@v1.0.0/cron.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function scrapeTenders() {
  console.log('Starting scheduled tender scraping process...')
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = 'https://tenders.go.ke'
    console.log(`Fetching data from ${url}...`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }
    
    const html = await response.text()
    console.log('HTML content length:', html.length);
    
    const $ = cheerio.load(html)
    const tenders = []

    // Log the structure we're trying to parse
    console.log('Found tender listings:', $('.tender-listing').length);

    // Specific selectors for tenders.go.ke
    $('.tender-listing').each((_, table) => {
      $(table).find('tr').each((_, row) => {
        const cells = $(row).find('td')
        if (cells.length < 4) {
          console.log('Skipping row with insufficient cells:', cells.length);
          return;
        }
        
        try {
          const title = cells.eq(1).text().trim();
          const organization = cells.eq(0).text().trim();
          const deadlineText = cells.eq(2).text().trim();
          const description = cells.eq(3).text().trim();

          console.log('Processing tender:', {
            title,
            organization,
            deadlineText,
            description
          });

          // Only add if we have valid data
          if (title && organization && deadlineText) {
            const tender = {
              title,
              organization,
              deadline: new Date(deadlineText).toISOString(),
              category: 'Government',
              description,
              requirements: 'Standard government tender requirements apply',
              tender_url: $(row).find('a').attr('href'),
              contact_info: 'Contact the procuring entity directly',
            }
            
            console.log('Adding tender to list:', tender);
            tenders.push(tender)
          } else {
            console.log('Skipping tender due to missing required fields');
          }
        } catch (error) {
          console.error('Error processing tender row:', error);
        }
      })
    })

    console.log(`Found ${tenders.length} tenders`)

    if (tenders.length > 0) {
      console.log('Inserting tenders into database...');
      const { error } = await supabase
        .from('tenders')
        .upsert(
          tenders.map(tender => ({
            ...tender,
            created_at: new Date().toISOString(),
          })),
          { 
            onConflict: 'tender_url',
            ignoreDuplicates: true 
          }
        )

      if (error) {
        console.error('Error inserting tenders:', error)
        throw error
      }

      console.log(`Successfully inserted/updated ${tenders.length} tenders`)
    } else {
      console.log('No tenders found to insert');
    }
  } catch (error) {
    console.error('Error in scheduled scraping:', error)
    throw error;
  }
}

// Schedule the scraper to run every 4 hours
cron("0 */4 * * *", () => {
  scrapeTenders()
})

// Handle HTTP requests to manually trigger the scraper
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    await scrapeTenders()
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tender scraping completed successfully'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in manual scraping:', error)
    
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
    )
  }
})