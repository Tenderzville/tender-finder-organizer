import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting tender scraping process...')
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Example URL - replace with actual tender website URL
    const url = 'https://tenders.go.ke/website/tenders/index'
    
    console.log(`Fetching data from ${url}...`)
    
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const tenders = []

    // Example scraping logic - adjust selectors based on actual website structure
    $('.tender-item').each((_, element) => {
      const tender = {
        title: $(element).find('.tender-title').text().trim(),
        organization: $(element).find('.organization').text().trim(),
        deadline: $(element).find('.deadline').text().trim(),
        category: $(element).find('.category').text().trim() || 'Other',
        description: $(element).find('.description').text().trim(),
        requirements: $(element).find('.requirements').text().trim(),
        contact_info: $(element).find('.contact').text().trim(),
        tender_url: $(element).find('a').attr('href'),
      }
      
      if (tender.title && tender.deadline) {
        tenders.push(tender)
      }
    })

    console.log(`Found ${tenders.length} tenders`)

    // Insert scraped tenders into the database
    if (tenders.length > 0) {
      const { data, error } = await supabase
        .from('tenders')
        .upsert(
          tenders.map(tender => ({
            ...tender,
            created_at: new Date().toISOString(),
          })),
          { onConflict: 'tender_url' }
        )

      if (error) {
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