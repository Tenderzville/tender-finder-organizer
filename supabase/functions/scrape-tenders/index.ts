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
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const tenders = []

    // Specific selectors for tenders.go.ke
    $('.tender-listing').each((_, table) => {
      $(table).find('tr').each((_, row) => {
        const cells = $(row).find('td')
        if (cells.length < 4) return // Skip header rows
        
        const tender = {
          title: cells.eq(1).text().trim(),
          organization: cells.eq(0).text().trim(),
          deadline: new Date(cells.eq(2).text().trim()).toISOString(),
          category: 'Government',
          description: cells.eq(3).text().trim(),
          requirements: 'Standard government tender requirements apply',
          tender_url: $(row).find('a').attr('href'),
          contact_info: 'Contact the procuring entity directly',
        }
        
        if (tender.title && tender.deadline && tender.organization) {
          console.log('Found tender:', tender.title)
          tenders.push(tender)
        }
      })
    })

    console.log(`Found ${tenders.length} tenders`)

    if (tenders.length > 0) {
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
    }
  } catch (error) {
    console.error('Error in scheduled scraping:', error)
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