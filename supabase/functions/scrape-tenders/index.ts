import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting tender scraping process...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Scraping the Public Procurement Information Portal
    const url = 'https://tenders.go.ke'
    console.log(`Fetching data from ${url}...`)
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const tenders = []

    // Updated selectors for tenders.go.ke
    $('.tender-listing tbody tr').each((_, element) => {
      const row = $(element)
      const cells = row.find('td')
      
      // Skip header rows or invalid entries
      if (cells.length < 4) return

      const tender = {
        title: cells.eq(1).text().trim(),
        organization: cells.eq(0).text().trim(),
        deadline: cells.eq(2).text().trim(),
        category: 'Government', // Default category for government tenders
        description: cells.eq(3).text().trim(),
        requirements: 'See tender details', // Default value
        tender_url: row.find('a').attr('href'),
        contact_info: 'Contact procuring entity',
      }
      
      // Validate required fields before adding
      if (tender.title && tender.deadline && tender.organization) {
        console.log('Found tender:', tender.title)
        tenders.push(tender)
      }
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

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraped ${tenders.length} tenders`,
        tenders
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error scraping tenders:', error)
    
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