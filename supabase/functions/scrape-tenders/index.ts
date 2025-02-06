
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    )

    // Define multiple sources to increase tender coverage
    const sources = [
      {
        url: 'https://tenders.go.ke',
        baseUrl: 'https://tenders.go.ke',
        selectors: {
          tenderList: '.tender-item',
          title: '.tender-title',
          deadline: '.tender-deadline',
          description: '.tender-description',
          requirements: '.tender-requirements',
          organization: '.organization-name'
        }
      },
      {
        url: 'https://supplier.treasury.go.ke/site/tenders.go/public/tenders',
        baseUrl: 'https://supplier.treasury.go.ke',
        selectors: {
          tenderList: '.tender-listing',
          title: 'h3',
          deadline: '.deadline-date',
          description: '.description',
          requirements: '.requirements',
          organization: '.procuring-entity'
        }
      }
    ]

    const tenders = []
    let successfulSources = 0

    for (const source of sources) {
      console.log(`Attempting to scrape from source: ${source.url}`)
      
      try {
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          redirect: 'follow'
        })

        if (!response.ok) {
          console.error(`Failed to fetch from ${source.url}: ${response.status} ${response.statusText}`)
          continue
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        console.log(`Successfully loaded HTML from ${source.url}`)
        console.log(`Found ${$(source.selectors.tenderList).length} tender elements`)

        $(source.selectors.tenderList).each((_, element) => {
          try {
            const $element = $(element)
            const title = $element.find(source.selectors.title).text().trim()
            const deadlineText = $element.find(source.selectors.deadline).text().trim()
            const description = $element.find(source.selectors.description).text().trim()
            const requirements = $element.find(source.selectors.requirements).text().trim() || 'Contact organization for detailed requirements'
            const organization = $element.find(source.selectors.organization).text().trim()
            const tenderUrl = new URL($element.find('a').first().attr('href') || '', source.baseUrl).toString()

            console.log('Processing tender:', { title, deadlineText, organization })

            if (title && deadlineText) {
              // Parse deadline date - handle multiple date formats
              let deadline
              try {
                // Try parsing various date formats
                deadline = new Date(deadlineText).toISOString()
              } catch (error) {
                console.error(`Error parsing date ${deadlineText}:`, error)
                return // Skip this tender if date parsing fails
              }

              // Only add future tenders
              if (new Date(deadline) > new Date()) {
                const tender = {
                  title: title.substring(0, 255), // Ensure title fits in DB
                  description: description || 'No description provided',
                  requirements: requirements,
                  deadline,
                  contact_info: organization || 'Contact procurement office',
                  category: 'Government',
                  location: 'Kenya',
                  tender_url: tenderUrl,
                  created_at: new Date().toISOString()
                }

                console.log('Adding tender to list:', tender)
                tenders.push(tender)
              }
            }
          } catch (parseError) {
            console.error('Error parsing tender element:', parseError)
          }
        })

        successfulSources++
        console.log(`Successfully scraped ${$(source.selectors.tenderList).length} tenders from ${source.url}`)

      } catch (sourceError) {
        console.error(`Error processing source ${source.url}:`, sourceError)
      }
    }

    console.log(`Scraped ${tenders.length} total tenders from ${successfulSources} sources`)

    if (tenders.length > 0) {
      const { data, error } = await supabase
        .from('tenders')
        .upsert(
          tenders,
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
      return { success: true, tenders_scraped: tenders.length }
    }

    return { success: true, tenders_scraped: 0, message: 'No new tenders found' }

  } catch (error) {
    console.error('Error in scraping process:', error)
    throw error
  }
}

// Schedule scraping every 6 hours
cron("0 */6 * * *", () => {
  console.log("Running scheduled tender scraping...")
  scrapeTenders().catch(console.error)
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const result = await scrapeTenders()
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in tender scraping endpoint:', error)
    
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
