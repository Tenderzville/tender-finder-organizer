import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { cron } from "https://deno.land/x/deno_cron@v1.0.0/cron.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function scrapePrivateTenders() {
  console.log('Starting scheduled private sector tender scraping process...')
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Array of sources to scrape
    const sources = [
      {
        url: 'https://tenderskenya.com',
        selector: '.tender-list',
        category: 'Private Sector',
        location: 'Kenya'
      },
      {
        url: 'https://tendersonline.co.ke',
        selector: '.opportunities',
        category: 'Private Sector',
        location: 'Kenya'
      },
      {
        url: 'https://africatenders.com',
        selector: '.tender-items',
        category: 'Private Sector',
        location: 'Africa'
      }
    ]

    const tenders = []

    // Scrape each source
    for (const source of sources) {
      console.log(`Fetching data from ${source.url}...`)
      
      try {
        const response = await fetch(source.url)
        if (!response.ok) {
          console.error(`Failed to fetch from ${source.url}: ${response.status} ${response.statusText}`)
          continue
        }
        
        const html = await response.text()
        const $ = cheerio.load(html)
        
        $(source.selector).each((_, element) => {
          try {
            const title = $(element).find('.title').text().trim()
            const deadlineText = $(element).find('.deadline').text().trim()
            const deadline = new Date(deadlineText)
            
            // Only include tenders that haven't expired
            if (deadline > new Date()) {
              const tender = {
                title,
                organization: $(element).find('.organization').text().trim(),
                deadline: deadline.toISOString(),
                category: source.category,
                description: $(element).find('.description').text().trim(),
                requirements: $(element).find('.requirements').text().trim() || 'Contact organization for requirements',
                tender_url: $(element).find('a').attr('href'),
                contact_info: $(element).find('.contact').text().trim() || 'Contact organization directly',
                location: source.location
              }
              
              if (tender.title && tender.deadline && tender.organization) {
                console.log('Found tender:', tender.title)
                tenders.push(tender)
              }
            }
          } catch (parseError) {
            console.error('Error parsing tender:', parseError)
          }
        })
      } catch (sourceError) {
        console.error(`Error processing source ${source.url}:`, sourceError)
        continue
      }
    }

    console.log(`Found ${tenders.length} private sector tenders`)

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

      console.log(`Successfully inserted/updated ${tenders.length} private sector tenders`)
    }
  } catch (error) {
    console.error('Error in scheduled private sector scraping:', error)
  }
}

// Schedule the scraper to run every 4 hours
cron("0 */4 * * *", () => {
  scrapePrivateTenders()
})

// Handle HTTP requests to manually trigger the scraper
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    await scrapePrivateTenders()
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Private sector tender scraping completed successfully'
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