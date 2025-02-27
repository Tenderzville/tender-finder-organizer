
// @ts-ignore
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
  subcategory: string | null;
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
    description?: string;
    organization?: string;
    category?: string;
    detailsLink?: string;
    location?: string;
  };
  baseUrl?: string;
}

// Configure multiple real tender sources to improve chances of successful scraping
const sources: TenderSource[] = [
  {
    url: 'https://tenders.go.ke/',
    name: 'Kenya Government Tenders',
    baseUrl: 'https://tenders.go.ke',
    selectors: {
      tenderList: '.tender-item, .tender-listing, tr.tender-row',
      title: '.tender-title, h3, td:first-child',
      deadline: '.deadline-date, .closing-date, td:nth-child(3)',
      description: '.tender-description, .description, td:nth-child(2)',
      organization: '.procuring-entity, .organization, td:nth-child(4)',
      detailsLink: 'a'
    }
  },
  {
    url: 'https://www.tendersinfo.com/global-kenya-tenders.php',
    name: 'TendersInfo Kenya',
    baseUrl: 'https://www.tendersinfo.com',
    selectors: {
      tenderList: '.tendersList tr',
      title: 'td a',
      deadline: 'td:nth-child(3)',
      organization: 'td:nth-child(2)',
      detailsLink: 'td a'
    }
  },
  {
    url: 'https://constructionreviewonline.com/tenders/',
    name: 'Construction Review',
    baseUrl: 'https://constructionreviewonline.com',
    selectors: {
      tenderList: 'article.tender',
      title: 'h2.entry-title',
      deadline: '.tender-deadline',
      organization: '.tender-organization',
      category: '.tender-category',
      detailsLink: 'a.tender-link'
    }
  },
  {
    url: 'https://www.ungm.org/Public/Notice/SearchNotice',
    name: 'UN Global Marketplace',
    baseUrl: 'https://www.ungm.org',
    selectors: {
      tenderList: '.tableRow',
      title: '.title a',
      deadline: '.deadlineDate',
      organization: '.agency',
      detailsLink: '.title a'
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
  console.log("Removing expired tenders...");
  const { error } = await supabase.rpc('remove_expired_tenders');
  if (error) {
    console.error('Error removing expired tenders:', error);
  } else {
    console.log('Successfully removed expired tenders');
  }
}

async function fetchWithTimeout(url: string, timeout = 15000): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    console.log(`Fetching URL: ${url}`);
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
      }
    });
    clearTimeout(id);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    console.log(`Successfully fetched content from ${url}, size: ${text.length} bytes`);
    return text;
  } catch (error) {
    clearTimeout(id);
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
}

function parseDate(dateString: string): string | null {
  try {
    if (!dateString) return null;
    
    // Clean up the date string
    const cleanDate = dateString.trim()
      .replace(/closing:?\s*/i, '')
      .replace(/deadline:?\s*/i, '')
      .replace(/closes:?\s*/i, '')
      .replace(/closing date:?\s*/i, '');
    
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
    
    // If still invalid, check for the "days remaining" format
    if (isNaN(date.getTime())) {
      const daysRemaining = /(\d+)\s+days?/i.exec(cleanDate);
      if (daysRemaining) {
        date = new Date();
        date.setDate(date.getDate() + parseInt(daysRemaining[1], 10));
      }
    }
    
    // If still invalid, use a future date (one month from now) as fallback
    if (isNaN(date.getTime())) {
      console.log(`Could not parse date: ${dateString}, using fallback date`);
      date = new Date();
      date.setMonth(date.getMonth() + 1);
    }
    
    return date.toISOString();
  } catch (error) {
    console.error(`Error parsing date "${dateString}":`, error);
    // Default to a date 30 days in the future
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 30);
    return fallbackDate.toISOString();
  }
}

function guessCategory(title: string): string {
  const categoryMapping: Record<string, string[]> = {
    'Construction': ['construction', 'building', 'infrastructure', 'road', 'bridge', 'housing', 'renovation', 'civil work'],
    'IT': ['software', 'hardware', 'computer', 'technology', 'it service', 'digital', 'system', 'network', 'telecommunication'],
    'Healthcare': ['medical', 'health', 'hospital', 'drug', 'pharmaceutical', 'medicine', 'clinic'],
    'Consulting': ['consultant', 'advisory', 'professional service', 'consulting'],
    'Supplies': ['supply', 'good', 'equipment', 'material', 'procurement', 'provision'],
    'Agriculture': ['agriculture', 'farm', 'livestock', 'crop', 'irrigation'],
    'Energy': ['energy', 'power', 'electricity', 'solar', 'renewable', 'oil', 'gas'],
    'Transport': ['transport', 'vehicle', 'logistics', 'fleet', 'car', 'truck'],
    'Education': ['education', 'school', 'university', 'training', 'teaching'],
    'Security': ['security', 'surveillance', 'guard', 'protection']
  };

  const titleLower = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryMapping)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}

function generateExampleTenders(count = 5): ScrapedTender[] {
  // Only use as a last resort if all scraping fails
  const categories = ['Construction', 'IT', 'Healthcare', 'Consulting', 'Supplies'];
  const locations = ['Kenya', 'Uganda', 'Tanzania', 'International'];
  const organizations = [
    'Ministry of Health', 
    'Ministry of Education', 
    'Kenya Power',
    'UN Development Programme', 
    'World Bank'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const category = categories[i % categories.length];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30 + i);
    
    return {
      title: `Sample ${category} Tender #${i+1} - ${organizations[i % organizations.length]}`,
      description: `This is a sample tender for ${category.toLowerCase()} services needed by ${organizations[i % organizations.length]}. This is only shown because scraping external sources failed. Real tenders will be available soon.`,
      requirements: `1. Minimum 5 years experience\n2. Valid business registration\n3. Tax compliance certificate`,
      deadline: deadline.toISOString(),
      contact_info: organizations[i % organizations.length],
      fees: `KSh ${(i+1) * 5000}`,
      prerequisites: "Registration with relevant authorities",
      category,
      subcategory: null,
      location: locations[i % locations.length],
      tender_url: null
    };
  });
}

async function scrapeTenderFromElement($element: cheerio.Cheerio, source: TenderSource): Promise<ScrapedTender | null> {
  try {
    const title = $element.find(source.selectors.title).text().trim();
    if (!title || title.length < 5) {
      return null;
    }
    
    // Get deadline text
    const deadlineText = $element.find(source.selectors.deadline).text().trim();
    if (!deadlineText) {
      console.log(`Skipping tender: Missing deadline for "${title}"`);
      return null;
    }
    
    // Parse deadline
    const deadline = parseDate(deadlineText);
    
    // Get description text if selector exists
    let description = '';
    if (source.selectors.description) {
      description = $element.find(source.selectors.description).text().trim();
    }
    
    // Get organization if selector exists
    let organization = source.name; // Default to source name
    if (source.selectors.organization) {
      const orgText = $element.find(source.selectors.organization).text().trim();
      if (orgText) organization = orgText;
    }
    
    // Get category if selector exists or guess from title
    let category = '';
    if (source.selectors.category) {
      category = $element.find(source.selectors.category).text().trim();
    }
    if (!category) {
      category = guessCategory(title);
    }
    
    // Try to get details link
    let detailsUrl = null;
    if (source.selectors.detailsLink) {
      const link = $element.find(source.selectors.detailsLink).attr('href');
      if (link) {
        if (link.startsWith('http')) {
          detailsUrl = link;
        } else if (source.baseUrl) {
          detailsUrl = `${source.baseUrl}${link.startsWith('/') ? '' : '/'}${link}`;
        }
      }
    }

    const tender: ScrapedTender = {
      title: title.substring(0, 255),
      description: description || `Tender posted by ${organization}`,
      requirements: null,
      deadline,
      contact_info: organization,
      fees: null,
      prerequisites: null,
      category,
      subcategory: null,
      location: 'Kenya', // Default to Kenya, could be refined
      tender_url: detailsUrl
    };

    // Try to get additional details if there's a details URL
    if (detailsUrl) {
      try {
        const detailsHtml = await fetchWithTimeout(detailsUrl);
        const $details = cheerio.load(detailsHtml);
        
        // Look for common details containers
        const $detailsContent = $details('.tender-details, .tender-content, .description, .details, article');
        if ($detailsContent.length) {
          const fullDescription = $detailsContent.text().trim();
          if (fullDescription) {
            tender.description = fullDescription.substring(0, 1000); // Limit to 1000 chars
            
            // Try to extract requirements
            const requirementsMatch = fullDescription.match(/requirements?:(.+?)(?:prerequisites|eligibility|deadline|submission|contact|$/si);
            if (requirementsMatch) {
              tender.requirements = requirementsMatch[1].trim().substring(0, 500);
            }
            
            // Try to extract prerequisites
            const prerequisitesMatch = fullDescription.match(/prerequisites?:(.+?)(?:requirements|eligibility|deadline|submission|contact|$/si);
            if (prerequisitesMatch) {
              tender.prerequisites = prerequisitesMatch[1].trim().substring(0, 500);
            }
            
            // Try to extract fees
            const feesMatch = fullDescription.match(/(?:fees?|cost|price|amount):(.+?)(?:requirements|eligibility|deadline|submission|contact|$/si);
            if (feesMatch) {
              tender.fees = feesMatch[1].trim().substring(0, 100);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching details for ${detailsUrl}:`, error);
        // Continue with the basic tender info we already have
      }
    }

    return tender;
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
        // Continue anyway
      }

      const logId = logEntry?.[0]?.id;

      try {
        const html = await fetchWithTimeout(source.url);
        const $ = cheerio.load(html);
        
        const tenderElements = $(source.selectors.tenderList);
        console.log(`Found ${tenderElements.length} potential tenders from ${source.url}`);

        let validTenders = 0;
        // Process up to 10 tenders from each source to avoid timeouts
        const elementsToProcess = tenderElements.slice(0, 10).toArray();
        
        for (const element of elementsToProcess) {
          try {
            const tender = await scrapeTenderFromElement($(element), source);
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

  // If we couldn't scrape any real tenders as a last resort,
  // add a few example tenders to make sure the app has something to display
  if (tenders.length === 0) {
    console.log('⚠️ Failed to scrape any real tenders, adding example tenders as fallback');
    // Check if there are already tenders in the database
    const { count, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error checking existing tenders:', countError);
    } else if (!count || count === 0) {
      console.log('No existing tenders found in database, adding example tenders');
      // Only add example tenders if there are none in the database
      tenders.push(...generateExampleTenders(5));
    } else {
      console.log(`Database already has ${count} tenders, skipping example tenders`);
    }
  }

  // Insert gathered tenders into database
  if (tenders.length > 0) {
    try {
      console.log(`Attempting to insert ${tenders.length} tenders into database`);
      
      // Process in batches of 10 to avoid timeouts
      for (let i = 0; i < tenders.length; i += 10) {
        const batch = tenders.slice(i, i + 10);
        const { error } = await supabase
          .from('tenders')
          .upsert(batch, {
            onConflict: 'title',
            ignoreDuplicates: true
          });

        if (error) {
          console.error(`Database error when upserting batch ${i/10 + 1}:`, error);
        } else {
          console.log(`Successfully inserted batch ${i/10 + 1} of ${Math.ceil(tenders.length/10)}`);
        }
      }
      
      console.log(`Successfully processed ${tenders.length} tenders`);
      
      // Now remove expired tenders
      await removeExpiredTenders();
      
      // Count final number of tenders in database
      const { count: finalCount, error: countError } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('Error getting final tender count:', countError);
      } else {
        console.log(`Database now has ${finalCount} total tenders`);
      }
      
      return { 
        success: true, 
        tenders_scraped: tenders.length,
        total_tenders: finalCount || 0
      };
    } catch (error) {
      console.error('Error inserting tenders:', error);
      return { success: false, error: error.message };
    }
  } else {
    console.log('No new tenders found from any source');
    
    // Count existing tenders
    const { count, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error getting existing tender count:', countError);
    }
    
    return { 
      success: true, 
      tenders_scraped: 0, 
      message: 'No new tenders found',
      total_tenders: count || 0
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Scrape tenders function called');
    const result = await scrapeTenders();
    console.log('Scrape result:', result);
    
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
