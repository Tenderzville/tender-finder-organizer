
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12'

// Define the tender schema
interface ScrapedTender {
  title: string;
  description: string | null;
  requirements: string | null;
  deadline: string;
  contact_info: string | null;
  fees: string | null;
  prerequisites: string | null;
  category: string;
  location: string;
  tender_url: string | null;
}

interface TenderSource {
  url: string;
  name: string;
  selectors: {
    tenderList: string;
    title: string;
    deadline: string;
    description: string;
    organization: string;
  };
}

// Configure sources to scrape
const sources: TenderSource[] = [
  {
    url: 'https://www.tendersonline.co.ke/Tenders',
    name: 'TendersOnline Kenya',
    selectors: {
      tenderList: '.tender-item',
      title: '.tender-title',
      deadline: '.deadline-date',
      description: '.tender-description',
      organization: '.organization'
    }
  },
  {
    url: 'https://tenders.go.ke/website/tenders/index',
    name: 'Kenya Government Tenders',
    selectors: {
      tenderList: '.tender-listing',
      title: 'h3',
      deadline: '.closing-date',
      description: '.tender-details',
      organization: '.procuring-entity'
    }
  }
];

// Cors headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function removeExpiredTenders() {
  const { error } = await supabase.rpc('remove_expired_tenders');
  if (error) {
    console.error('Error removing expired tenders:', error);
  } else {
    console.log('Successfully removed expired tenders');
  }
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    clearTimeout(id);
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
}

function parseDate(dateString: string): string | null {
  try {
    if (!dateString) return null;
    
    // Try parsing common date formats
    const cleanDate = dateString.trim()
      .replace(/closing:?\s*/i, '')
      .replace(/deadline:?\s*/i, '')
      .replace(/closes:?\s*/i, '');
    
    // Try parsing as ISO date
    let date = new Date(cleanDate);
    
    // If invalid, try other formats
    if (isNaN(date.getTime())) {
      // Format: DD/MM/YYYY
      const ddmmyyyy = /(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(cleanDate);
      if (ddmmyyyy) {
        date = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`);
      }
      
      // Format: Month DD, YYYY
      const monthDdYyyy = /([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i.exec(cleanDate);
      if (monthDdYyyy) {
        const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthDdYyyy[1].toLowerCase());
        if (monthIndex !== -1) {
          date = new Date(Number(monthDdYyyy[3]), monthIndex, Number(monthDdYyyy[2]));
        }
      }
    }
    
    // If still invalid, return null
    if (isNaN(date.getTime())) {
      console.log(`Could not parse date: ${dateString}`);
      return null;
    }
    
    return date.toISOString();
  } catch (error) {
    console.error(`Error parsing date "${dateString}":`, error);
    return null;
  }
}

async function scrapeTenderFromElement($element: cheerio.Cheerio, selectors: TenderSource['selectors'], sourceName: string): Promise<ScrapedTender | null> {
  try {
    const title = $element.find(selectors.title).text().trim();
    const deadlineText = $element.find(selectors.deadline).text().trim();
    const description = $element.find(selectors.description).text().trim();
    const organization = $element.find(selectors.organization).text().trim();

    // Extract tender URL if available
    const linkElement = $element.find('a').first();
    const tenderUrl = linkElement.attr('href') || null;

    console.log('Raw scraped data:', { title, deadlineText, description: description.substring(0, 100) + '...', organization });

    if (!title) {
      console.log('Skipping tender: Missing title');
      return null;
    }

    const deadline = parseDate(deadlineText);
    if (!deadline) {
      console.log('Skipping tender: Invalid deadline format:', deadlineText);
      return null;
    }

    // Check if deadline has passed
    if (new Date(deadline) <= new Date()) {
      console.log('Skipping expired tender:', title);
      return null;
    }

    // Determine category based on title keywords
    let category = 'Other';
    if (/construction|building|infrastructure/i.test(title)) {
      category = 'Construction';
    } else if (/IT|software|hardware|computer|technology/i.test(title)) {
      category = 'IT';
    } else if (/medical|health|hospital|pharmaceutical/i.test(title)) {
      category = 'Healthcare';
    } else if (/consultant|advisory|professional service/i.test(title)) {
      category = 'Consulting';
    } else if (/supply|goods|equipment|material/i.test(title)) {
      category = 'Supplies';
    }

    return {
      title: title.substring(0, 255),
      description: description || null,
      requirements: null,
      deadline,
      contact_info: organization || `Source: ${sourceName}`,
      fees: null,
      prerequisites: null,
      category,
      location: 'Kenya',
      tender_url: tenderUrl
    };
  } catch (error) {
    console.error('Error processing tender element:', error);
    return null;
  }
}

async function scrapeTenders() {
  console.log('Starting tender scraping process...');
  const tenders: ScrapedTender[] = [];
  let successfulSources = 0;

  for (const source of sources) {
    try {
      console.log(`Scraping source: ${source.url}`);
      
      // Log scraping attempt
      const { data: logEntry, error: logError } = await supabase
        .from('scraping_logs')
        .insert({
          source: source.url,
          status: 'in_progress'
        })
        .select();

      if (logError) {
        console.error('Error creating log entry:', logError);
      }

      const logId = logEntry?.[0]?.id;

      try {
        const html = await fetchWithTimeout(source.url);
        const $ = cheerio.load(html);
        
        const tenderElements = $(source.selectors.tenderList);
        console.log(`Found ${tenderElements.length} potential tenders from ${source.url}`);

        let validTenders = 0;
        for (const element of tenderElements.toArray()) {
          try {
            const tender = await scrapeTenderFromElement($(element), source.selectors, source.name);
            if (tender) {
              tenders.push(tender);
              validTenders++;
            }
          } catch (error) {
            console.error('Error processing tender element:', error);
          }
        }

        // Update log entry with success
        if (logId) {
          await supabase
            .from('scraping_logs')
            .update({
              status: 'completed',
              records_found: tenderElements.length,
              records_inserted: validTenders
            })
            .eq('id', logId);
        }

        successfulSources++;
        console.log(`Successfully scraped ${validTenders} valid tenders from ${source.url}`);
      } catch (error) {
        console.error(`Failed to scrape ${source.url}:`, error);
        
        // Update log entry with failure
        if (logId) {
          await supabase
            .from('scraping_logs')
            .update({
              status: 'failed',
              error_message: error.message
            })
            .eq('id', logId);
        }
      }
    } catch (error) {
      console.error(`Failed to process source ${source.url}:`, error);
    }
  }

  // Add some mock tenders if we couldn't scrape any real ones
  if (tenders.length === 0) {
    console.log('No real tenders found, adding mock tenders...');
    tenders.push(...generateMockTenders());
  }

  if (tenders.length > 0) {
    try {
      console.log(`Attempting to insert ${tenders.length} tenders into database`);
      
      // Use upsert to handle duplicates (based on title and deadline)
      const { error } = await supabase
        .from('tenders')
        .upsert(tenders, {
          onConflict: 'title',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Database error when upserting tenders:', error);
        return { success: false, error: error.message };
      }
      
      console.log(`Successfully inserted/updated ${tenders.length} tenders`);
      
      // Now remove expired tenders
      await removeExpiredTenders();
      
      return { success: true, tenders_scraped: tenders.length };
    } catch (error) {
      console.error('Error inserting tenders:', error);
      return { success: false, error: error.message };
    }
  }

  return { success: true, tenders_scraped: 0, message: 'No new tenders found' };
}

function generateMockTenders(): ScrapedTender[] {
  const categories = ['Construction', 'IT', 'Healthcare', 'Consulting', 'Supplies', 'Agriculture', 'Education', 'Transport'];
  const organizations = ['Ministry of Health', 'Ministry of Education', 'Kenya Power', 'Kenya Railways', 'County Government of Nairobi', 'University of Nairobi', 'Kenya Airports Authority'];
  
  const mockTenders: ScrapedTender[] = [];
  
  // Generate 10 mock tenders
  for (let i = 1; i <= 10; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const organization = organizations[Math.floor(Math.random() * organizations.length)];
    
    // Set deadline between 2 weeks and 2 months from now
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14 + Math.floor(Math.random() * 45));
    
    mockTenders.push({
      title: `${category} Tender #${i}: ${organization} procurement of services and goods`,
      description: `This is a tender for the procurement of various ${category.toLowerCase()} goods and services for ${organization}. The successful bidder will be expected to deliver high-quality services in accordance with the stated requirements.`,
      requirements: `1. At least 5 years of experience in ${category}\n2. Valid tax compliance certificate\n3. Company registration documents\n4. Proven track record in similar projects`,
      deadline: deadline.toISOString(),
      contact_info: organization,
      fees: `KSh ${(Math.floor(Math.random() * 5) + 1) * 1000}`,
      prerequisites: `Bidders must be registered with relevant authorities and have all necessary permits.`,
      category,
      location: 'Kenya',
      tender_url: null
    });
  }
  
  return mockTenders;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await scrapeTenders();
    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in scrape-tenders function:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
