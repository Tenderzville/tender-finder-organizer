
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

// Cors headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Real tender sources with proper selectors
const sources = [
  // Government tender source
  {
    name: "Kenya Public Procurement",
    url: "https://tenders.go.ke/",
    selectors: {
      tenderList: ".tender-listing tbody tr, .tender-item",
      title: "h3, td:first-child, .tender-title",
      deadline: ".closing-date, td:nth-child(4), .deadline-date",
      organization: ".organization, td:nth-child(2)",
      detailsLink: "a"
    },
    baseUrl: "https://tenders.go.ke"
  },
  // Construction tenders
  {
    name: "Construction Review",
    url: "https://constructionreviewonline.com/tenders/",
    selectors: {
      tenderList: "article.post",
      title: "h2.entry-title",
      deadline: ".deadline, .tender-deadline",
      organization: ".organization, .posted-by",
      detailsLink: "h2.entry-title a"
    },
    baseUrl: "https://constructionreviewonline.com"
  },
  // UN tenders
  {
    name: "UN Development Business",
    url: "https://devbusiness.un.org/search/type/tender",
    selectors: {
      tenderList: ".views-row",
      title: "h4 a",
      deadline: ".deadline",
      organization: ".un-agency",
      detailsLink: "h4 a"
    },
    baseUrl: "https://devbusiness.un.org"
  }
];

async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    console.log(`Fetching: ${url}`);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

// Helper to guess tender category from title
function guessTenderCategory(title) {
  const titleLower = title.toLowerCase();
  
  const categories = {
    "Construction": ["construction", "building", "infrastructure", "road", "housing"],
    "IT": ["software", "hardware", "computer", "technology", "it ", "digital"],
    "Healthcare": ["medical", "health", "hospital", "drug", "pharmaceutical"],
    "Supplies": ["supply", "supplies", "goods", "equipment", "material", "procurement"],
    "Consulting": ["consult", "advisory", "professional service"],
    "Transport": ["transport", "vehicle", "logistics"],
    "Energy": ["energy", "power", "electricity", "solar"],
    "Agriculture": ["agriculture", "farming", "irrigation", "crop"]
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      return category;
    }
  }
  
  return "Other";
}

// Parse deadline date from various string formats
function parseDeadlineDate(dateString) {
  try {
    if (!dateString) {
      return null;
    }
    
    // Clean up date string
    let cleanDate = dateString.trim()
      .replace(/closing:?\s*/i, '')
      .replace(/deadline:?\s*/i, '')
      .replace(/close?s:?\s*/i, '');
    
    // Try different date formats
    let date = new Date(cleanDate);
    
    // If invalid date, try DD/MM/YYYY format
    if (isNaN(date.getTime())) {
      const ddmmyyyy = /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/.exec(cleanDate);
      if (ddmmyyyy) {
        date = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`);
      }
    }
    
    // If still invalid, try month name format
    if (isNaN(date.getTime())) {
      const monthNames = ["january", "february", "march", "april", "may", "june", 
        "july", "august", "september", "october", "november", "december"];
      const monthPattern = new RegExp(`(${monthNames.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`, 'i');
      const match = monthPattern.exec(cleanDate);
      
      if (match) {
        const month = monthNames.findIndex(m => m.toLowerCase() === match[1].toLowerCase());
        if (month !== -1) {
          date = new Date(Number(match[3]), month, Number(match[2]));
        }
      }
    }
    
    // Last resort: if still invalid, set to 30 days from now
    if (isNaN(date.getTime())) {
      console.log(`Could not parse date: "${dateString}". Using fallback.`);
      date = new Date();
      date.setDate(date.getDate() + 30);
    }
    
    return date.toISOString();
  } catch (error) {
    console.error(`Error parsing date "${dateString}":`, error);
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 30);
    return fallback.toISOString();
  }
}

// Create emergency example tenders for testing
function createExampleTenders() {
  console.log("Creating emergency example tenders as fallback");
  const tenders = [];
  const categories = ["Construction", "IT", "Healthcare", "Supplies", "Consulting"];
  const locations = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "International"];
  
  for (let i = 0; i < 10; i++) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14 + Math.floor(Math.random() * 30));
    
    const category = categories[i % categories.length];
    const location = locations[i % locations.length];
    
    tenders.push({
      title: `Example ${category} Tender #${i+1} - For demonstration purposes`,
      description: `This is an example tender for ${category} services. It was created automatically because real tender scraping failed.`,
      requirements: "1. Valid business registration\n2. Tax compliance certificate\n3. Minimum 3 years experience",
      deadline: deadline.toISOString(),
      contact_info: "Example Organization",
      fees: `KSh ${(i+1) * 5000}`,
      prerequisites: "Registration with relevant regulatory authorities",
      category,
      subcategory: null,
      location,
      tender_url: null
    });
  }
  
  return tenders;
}

// Main scraping function
async function scrapeTenders() {
  console.log("Starting tender scraping process...");
  let tenders = [];
  let successfulSources = 0;
  
  // Try to scrape each source
  for (const source of sources) {
    try {
      console.log(`Scraping source: ${source.name} (${source.url})`);
      
      // Log scrape attempt
      const { data: logEntry, error: logError } = await supabase
        .from('scraping_logs')
        .insert({
          source: source.name,
          status: 'in_progress',
        })
        .select();
      
      if (logError) {
        console.error('Error creating log entry:', logError);
      }
      
      const logId = logEntry?.[0]?.id;
      
      try {
        // Fetch the source webpage
        const html = await fetchWithTimeout(source.url);
        const $ = cheerio.load(html);
        
        // Find tender items
        const tenderItems = $(source.selectors.tenderList);
        console.log(`Found ${tenderItems.length} potential tenders from ${source.name}`);
        
        // Process tender items (max 10 per source to avoid timeouts)
        const itemsToProcess = Math.min(tenderItems.length, 10);
        let successfulItems = 0;
        
        for (let i = 0; i < itemsToProcess; i++) {
          try {
            const item = tenderItems.eq(i);
            
            // Extract tender data
            const title = item.find(source.selectors.title).text().trim();
            if (!title || title.length < 5) continue;
            
            const deadlineText = item.find(source.selectors.deadline).text().trim();
            if (!deadlineText) continue;
            
            const deadline = parseDeadlineDate(deadlineText);
            if (!deadline) continue;
            
            // Get optional fields
            const organization = item.find(source.selectors.organization).text().trim() || source.name;
            
            // Get details link if available
            let detailsUrl = null;
            const link = item.find(source.selectors.detailsLink).attr('href');
            if (link) {
              detailsUrl = link.startsWith('http') ? link : `${source.baseUrl}${link.startsWith('/') ? '' : '/'}${link}`;
            }
            
            // Guess category from title
            const category = guessTenderCategory(title);
            
            // Create tender object
            const tender = {
              title: title.substring(0, 255),
              description: `Tender by ${organization}. Deadline: ${new Date(deadline).toLocaleDateString()}.`,
              requirements: null,
              deadline,
              contact_info: organization,
              fees: null,
              prerequisites: null,
              category,
              subcategory: null,
              location: "Kenya", // Default
              tender_url: detailsUrl
            };
            
            // Try to get more details if URL is available
            if (detailsUrl) {
              try {
                console.log(`Fetching details for: ${title}`);
                const detailsHtml = await fetchWithTimeout(detailsUrl, 8000);
                const $details = cheerio.load(detailsHtml);
                
                // Look for full description
                const $content = $details('article, .content, .tender-details, .description');
                if ($content.length) {
                  tender.description = $content.text().trim().substring(0, 1000);
                  
                  // Try to extract specific sections
                  const fullText = $content.text();
                  
                  // Extract requirements
                  const reqMatch = fullText.match(/requirements?:(.+?)(?:prerequisites|eligibility|deadline|submission|$/si);
                  if (reqMatch) {
                    tender.requirements = reqMatch[1].trim().substring(0, 500);
                  }
                  
                  // Extract prerequisites
                  const prereqMatch = fullText.match(/prerequisites?:(.+?)(?:requirements|eligibility|deadline|submission|$/si);
                  if (prereqMatch) {
                    tender.prerequisites = prereqMatch[1].trim().substring(0, 500);
                  }
                  
                  // Extract fees
                  const feesMatch = fullText.match(/(?:fees?|cost|price|amount):(.+?)(?:requirements|eligibility|deadline|submission|$/si);
                  if (feesMatch) {
                    tender.fees = feesMatch[1].trim().substring(0, 100);
                  }
                }
              } catch (error) {
                console.error(`Error fetching details for ${title}:`, error);
                // Continue with basic tender data
              }
            }
            
            tenders.push(tender);
            successfulItems++;
          } catch (itemError) {
            console.error(`Error processing tender item ${i+1}:`, itemError);
          }
        }
        
        // Update log entry
        if (logId) {
          await supabase
            .from('scraping_logs')
            .update({
              status: 'completed',
              records_found: tenderItems.length,
              records_inserted: successfulItems
            })
            .eq('id', logId);
        }
        
        successfulSources++;
        console.log(`Successfully scraped ${successfulItems} valid tenders from ${source.name}`);
      } catch (sourceError) {
        console.error(`Failed to scrape ${source.name}:`, sourceError);
        
        // Update log entry with failure
        if (logId) {
          await supabase
            .from('scraping_logs')
            .update({
              status: 'failed',
              error_message: sourceError.message
            })
            .eq('id', logId);
        }
      }
    } catch (error) {
      console.error(`Error processing source ${source.name}:`, error);
    }
  }
  
  // If no tenders were found, create example tenders
  if (tenders.length === 0) {
    // Check if we already have tenders in the database
    const { count, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error checking existing tenders:', countError);
    } else if (!count || count === 0) {
      // Only add example tenders if DB is empty
      console.log('No existing tenders in database, adding example tenders');
      tenders = createExampleTenders();
    } else {
      console.log(`Database already has ${count} tenders, no need for examples`);
    }
  }
  
  // Insert tenders into database
  let insertedCount = 0;
  
  if (tenders.length > 0) {
    try {
      console.log(`Inserting ${tenders.length} tenders into database`);
      
      // Process in batches to avoid timeouts
      for (let i = 0; i < tenders.length; i += 5) {
        const batch = tenders.slice(i, i + 5);
        const { error } = await supabase
          .from('tenders')
          .upsert(batch, {
            onConflict: 'title',
            ignoreDuplicates: true
          });
        
        if (error) {
          console.error(`Error inserting batch ${i/5 + 1}:`, error);
        } else {
          insertedCount += batch.length;
          console.log(`Successfully inserted batch ${i/5 + 1} of ${Math.ceil(tenders.length/5)}`);
        }
      }
    } catch (error) {
      console.error('Error inserting tenders:', error);
    }
  }
  
  // Try to remove expired tenders
  try {
    const { error } = await supabase.rpc('remove_expired_tenders');
    if (error) {
      console.error('Error removing expired tenders:', error);
    } else {
      console.log('Successfully removed expired tenders');
    }
  } catch (error) {
    console.error('Error removing expired tenders:', error);
  }
  
  // Get final count
  const { count: finalCount } = await supabase
    .from('tenders')
    .select('*', { count: 'exact', head: true });
  
  return {
    success: true,
    sources_checked: sources.length,
    sources_successful: successfulSources,
    tenders_scraped: tenders.length,
    tenders_inserted: insertedCount,
    total_tenders: finalCount || 0
  };
}

// Handle requests
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('Scrape tenders function called');
    const result = await scrapeTenders();
    console.log('Scrape result:', JSON.stringify(result));
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in scrape-tenders function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
