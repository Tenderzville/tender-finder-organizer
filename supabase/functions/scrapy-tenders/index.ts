import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"
import { ScrapyClient } from 'https://deno.land/x/scrapy@v1.0.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const scrapy = new ScrapyClient({
  // Configure Scrapy settings
  settings: {
    CONCURRENT_REQUESTS: 1,
    DOWNLOAD_DELAY: 2,
    ROBOTSTXT_OBEY: true,
    USER_AGENT: 'Mozilla/5.0 (compatible; TendersBot/1.0; +http://tenderbot.example.com)',
  }
});

async function scrapeTenders() {
  console.log('Starting Scrapy tender scraping process...')
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Define sources with their specific selectors
    const sources = [
      {
        url: 'https://tenders.go.ke',
        selectors: {
          tenderList: '.tender-listing',
          title: '.title',
          deadline: '.deadline',
          organization: '.organization',
          description: '.description'
        },
        category: 'Government'
      },
      // Add more sources here
    ]

    const tenders = []

    for (const source of sources) {
      console.log(`Scraping ${source.url}...`)
      
      try {
        const response = await scrapy.fetch(source.url)
        console.log(`Response status for ${source.url}:`, response.status)
        
        if (!response.ok) {
          console.error(`Failed to fetch ${source.url}: ${response.status}`)
          continue
        }

        const html = await response.text()
        const $ = cheerio.load(html)
        
        $(source.selectors.tenderList).each((_, element) => {
          try {
            const title = $(element).find(source.selectors.title).text().trim()
            const deadlineText = $(element).find(source.selectors.deadline).text().trim()
            const organization = $(element).find(source.selectors.organization).text().trim()
            const description = $(element).find(source.selectors.description).text().trim()

            console.log('Processing tender:', { title, deadlineText, organization })

            if (title && deadlineText && organization) {
              const deadline = new Date(deadlineText)
              
              if (deadline > new Date()) {
                const tender = {
                  title,
                  organization,
                  deadline: deadline.toISOString(),
                  category: source.category,
                  description: description || 'No description provided',
                  requirements: 'Contact organization for requirements',
                  location: 'Kenya',
                  created_at: new Date().toISOString()
                }
                
                console.log('Adding tender:', tender)
                tenders.push(tender)
              }
            }
          } catch (error) {
            console.error('Error processing tender:', error)
          }
        })
      } catch (error) {
        console.error(`Error scraping ${source.url}:`, error)
      }
    }

    console.log(`Found ${tenders.length} tenders`)

    if (tenders.length > 0) {
      const { error } = await supabase
        .from('tenders')
        .upsert(tenders, {
          onConflict: 'title,deadline',
          ignoreDuplicates: true
        })

      if (error) throw error
      console.log(`Successfully inserted/updated ${tenders.length} tenders`)
    }

  } catch (error) {
    console.error('Scraping error:', error)
    throw error
  }
}

// Schedule scraping every 4 hours
Deno.cron("0 */4 * * *", () => {
  scrapeTenders()
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    await scrapeTenders()
    return new Response(
      JSON.stringify({ success: true, message: 'Scraping completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})