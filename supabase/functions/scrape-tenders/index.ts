import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { cron } from "https://deno.land/x/deno_cron@v1.0.0/cron.ts";

// Types for better code organization
interface TenderSource {
  url: string;
  selectors: {
    tenderList: string;
    title: string;
    deadline: string;
    description: string;
    organization: string;
  };
}

interface ScrapedTender {
  title: string;
  description: string;
  requirements: string;
  deadline: string;
  contact_info: string;
  category: string;
  location: string;
  created_at: string;
}

// Constants
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

const sources: TenderSource[] = [
  {
    url: 'https://www.tendersonline.co.ke/Tenders',
    selectors: {
      tenderList: '.tender-item',
      title: '.tender-title',
      deadline: '.deadline-date',
      description: '.description',
      organization: '.organization'
    }
  },
  {
    url: 'https://www.globaltenders.com/tenders-kenya.php',
    selectors: {
      tenderList: '.tender-listing',
      title: '.tender-title',
      deadline: '.closing-date',
      description: '.tender-desc',
      organization: '.department'
    }
  }
];

// Utility functions
function createSupabaseClient() {
  const client = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  console.log('Supabase client created successfully');
  return client;
}

function parseDate(dateText: string): string | null {
  console.log('Attempting to parse date:', dateText);
  try {
    const parsedDate = new Date(dateText);
    if (!isNaN(parsedDate.getTime())) {
      console.log('Date parsed successfully:', parsedDate.toISOString());
      return parsedDate.toISOString();
    }
    console.log('Invalid date format:', dateText);
    return null;
  } catch (error) {
    console.error(`Failed to parse date: ${dateText}`, error);
    return null;
  }
}

async function fetchSourceWithRetry(url: string, retries = 3): Promise<string> {
  console.log(`Attempting to fetch ${url}, retries left: ${retries}`);
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      console.log(`Successfully fetched ${url}, HTML length: ${html.length}`);
      return html;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

async function scrapeTenderFromElement($element: cheerio.Cheerio, selectors: TenderSource['selectors']): Promise<ScrapedTender | null> {
  const title = $element.find(selectors.title).text().trim();
  const deadlineText = $element.find(selectors.deadline).text().trim();
  const description = $element.find(selectors.description).text().trim();
  const organization = $element.find(selectors.organization).text().trim();

  console.log('Scraped tender data:', { title, deadlineText, description: description.substring(0, 100) + '...' });

  if (!title || !deadlineText) {
    console.log('Skipping tender due to missing required fields:', { title, deadlineText });
    return null;
  }

  const deadline = parseDate(deadlineText);
  if (!deadline) return null;

  if (new Date(deadline) <= new Date()) {
    console.log('Skipping expired tender:', title);
    return null;
  }

  return {
    title: title.substring(0, 255),
    description: description || 'No description provided',
    requirements: 'Contact organization for detailed requirements',
    deadline,
    contact_info: organization || 'Contact procurement office',
    category: 'Government',
    location: 'Kenya',
    created_at: new Date().toISOString()
  };
}

// Main scraping function
async function scrapeTenders() {
  console.log('Starting scheduled tender scraping process...');
  const supabase = createSupabaseClient();
  const tenders: ScrapedTender[] = [];
  let successfulSources = 0;

  for (const source of sources) {
    try {
      console.log(`Scraping source: ${source.url}`);
      const html = await fetchSourceWithRetry(source.url);
      const $ = cheerio.load(html);
      
      const tenderElements = $(source.selectors.tenderList);
      console.log(`Found ${tenderElements.length} potential tenders`);

      for (const element of tenderElements.toArray()) {
        try {
          const tender = await scrapeTenderFromElement($(element), source.selectors);
          if (tender) {
            console.log('Successfully scraped tender:', tender.title);
            tenders.push(tender);
          }
        } catch (error) {
          console.error('Error processing tender element:', error);
        }
      }

      successfulSources++;
      console.log(`Successfully scraped ${tenderElements.length} tenders from ${source.url}`);
    } catch (error) {
      console.error(`Failed to scrape ${source.url}:`, error);
    }
  }

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
  scrapeTenders().catch(console.error);
});

// Serve HTTP endpoint
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Manual scraping triggered via HTTP endpoint');
    const result = await scrapeTenders();
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