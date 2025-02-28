// This file will be processed by Supabase
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { load } from "cheerio";
import { format, parseISO, isValid, addMonths } from "date-fns";
import { scrapeTenders } from './scraper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client for connecting to database
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Extract tender details using regular expressions
function extractTenderDetails(content: string) {
  // Initialize object with default values
  const details: Record<string, string> = {
    requirements: '',
    prerequisites: '',
    deadline: '',
    contact_info: '',
    fees: '',
  };

  // Fixed regex pattern - adding closing parenthesis
  const requirementsRegex = /requirements?:(.+?)(?:prerequisites|eligibility|deadline|submission|$)/si;
  const prerequisitesRegex = /prerequisites?|eligibility:(.+?)(?:deadline|submission|$)/si;
  const deadlineRegex = /deadline:(.+?)(?:submission|contact|$)/si;
  const contactRegex = /contact:(.+?)(?:fees|cost|$)/si;
  const feesRegex = /fees?|costs?:(.+?)(?:\n\n|\n$|$)/si;

  // Extract each section
  const reqMatch = content.match(requirementsRegex);
  const preMatch = content.match(prerequisitesRegex);
  const deadlineMatch = content.match(deadlineRegex);
  const contactMatch = content.match(contactRegex);
  const feesMatch = content.match(feesRegex);

  // Assign extracted content if found
  if (reqMatch && reqMatch[1]) details.requirements = reqMatch[1].trim();
  if (preMatch && preMatch[1]) details.prerequisites = preMatch[1].trim();
  if (deadlineMatch && deadlineMatch[1]) details.deadline = deadlineMatch[1].trim();
  if (contactMatch && contactMatch[1]) details.contact_info = contactMatch[1].trim();
  if (feesMatch && feesMatch[1]) details.fees = feesMatch[1].trim();

  return details;
}

// Parse and format tender deadline
function parseTenderDeadline(deadlineText: string) {
  // Default to 1 month from now if we can't parse the date
  const defaultDate = addMonths(new Date(), 1);
  
  if (!deadlineText) {
    return format(defaultDate, "yyyy-MM-dd'T'HH:mm:ss");
  }

  // Try to identify and parse common date formats
  const dateRegex = /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})|(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})|(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)(?:\s+|,\s*)(\d{4})|([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i;
  
  const match = deadlineText.match(dateRegex);
  if (match) {
    let parsedDate;
    
    // DD/MM/YYYY format
    if (match[1] && match[2] && match[3]) {
      const year = match[3].length === 2 ? `20${match[3]}` : match[3];
      parsedDate = parseISO(`${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`);
    } 
    // YYYY/MM/DD format
    else if (match[4] && match[5] && match[6]) {
      parsedDate = parseISO(`${match[4]}-${match[5].padStart(2, '0')}-${match[6].padStart(2, '0')}`);
    }
    // DD Month YYYY format
    else if (match[7] && match[8] && match[9]) {
      const months: Record<string, string> = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
      };
      const month = months[match[8].toLowerCase()];
      if (month) {
        parsedDate = parseISO(`${match[9]}-${month}-${match[7].padStart(2, '0')}`);
      }
    }
    // Month DD, YYYY format
    else if (match[10] && match[11] && match[12]) {
      const months: Record<string, string> = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
      };
      const month = months[match[10].toLowerCase()];
      if (month) {
        parsedDate = parseISO(`${match[12]}-${month}-${match[11].padStart(2, '0')}`);
      }
    }
    
    if (isValid(parsedDate)) {
      return format(parsedDate, "yyyy-MM-dd'T'HH:mm:ss");
    }
  }
  
  // If all else fails, return default date
  return format(defaultDate, "yyyy-MM-dd'T'HH:mm:ss");
}

// Categorize tender based on its title and description
function categorizeTender(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  
  const categories: Record<string, string[]> = {
    'Construction': ['construction', 'building', 'infrastructure', 'renovation', 'facility'],
    'IT Services': ['software', 'hardware', 'it ', 'computer', 'technology', 'digital', 'system'],
    'Healthcare': ['medical', 'health', 'hospital', 'clinic', 'pharmaceutical', 'medicine'],
    'Education': ['education', 'school', 'university', 'college', 'training', 'learning'],
    'Transportation': ['transport', 'logistics', 'shipping', 'freight', 'vehicle'],
    'Energy': ['energy', 'power', 'electricity', 'renewable', 'solar', 'wind'],
    'Agriculture': ['agriculture', 'farming', 'crop', 'livestock', 'food'],
    'Financial': ['financial', 'banking', 'insurance', 'accounting', 'audit'],
    'Telecommunications': ['telecom', 'communication', 'network', 'internet', 'mobile'],
    'Consulting': ['consulting', 'advisory', 'management', 'strategy'],
    'Security': ['security', 'surveillance', 'guard', 'protection'],
    'Legal': ['legal', 'law', 'attorney', 'legislation', 'compliance'],
    'Manufacturing': ['manufacturing', 'production', 'assembly', 'factory'],
    'Retail': ['retail', 'wholesale', 'merchandise', 'store', 'shop'],
    'Research': ['research', 'development', 'innovation', 'r&d']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting tender scraping process...');
    
    // Count existing tenders before scraping
    const { count: existingCount, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting existing tenders:', countError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to count existing tenders',
          details: countError
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`Found ${existingCount || 0} existing tenders in database`);
    
    // Get tenders from external sources using the imported scrapeTenders function
    // Make sure to pass the supabase client to the function
    const scrapedTenders = await scrapeTenders(supabase);
    console.log(`Successfully scraped ${scrapedTenders.length} tenders`);
    
    if (scrapedTenders.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No new tenders found',
          tenders_scraped: 0,
          total_tenders: existingCount || 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Process and store each tender
    let insertedCount = 0;
    const processedTenders = [];
    
    for (const tender of scrapedTenders) {
      // Extract additional details from description
      let tenderDetails = {};
      try {
        if (tender.description) {
          tenderDetails = extractTenderDetails(tender.description);
        }
      } catch (err) {
        console.error(`Error extracting details from tender: ${tender.title}`, err);
      }
      
      // Parse deadline
      let formattedDeadline;
      try {
        const deadlineText = 
          tenderDetails?.deadline || 
          tender.deadline ||
          '';
        formattedDeadline = parseTenderDeadline(deadlineText);
      } catch (err) {
        console.error(`Error parsing deadline for tender: ${tender.title}`, err);
        formattedDeadline = format(addMonths(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss");
      }
      
      // Determine category
      const category = categorizeTender(tender.title, tender.description || '');
      
      // Prepare tender data
      const tenderData = {
        title: tender.title,
        description: tender.description,
        tender_url: tender.url,
        deadline: formattedDeadline,
        category: category,
        location: tender.location || 'International',
        requirements: tenderDetails?.requirements || '',
        prerequisites: tenderDetails?.prerequisites || '',
        contact_info: tenderDetails?.contact_info || tender.contact || '',
        fees: tenderDetails?.fees || '',
      };
      
      // Check if tender with this URL already exists
      const { data: existingTender, error: searchError } = await supabase
        .from('tenders')
        .select('*')
        .eq('tender_url', tenderData.tender_url)
        .maybeSingle();
      
      if (searchError) {
        console.error(`Error checking if tender exists: ${tenderData.title}`, searchError);
        continue;
      }
      
      // If tender doesn't exist or has no URL, insert it
      if (!existingTender || !tenderData.tender_url) {
        const { data, error } = await supabase
          .from('tenders')
          .insert(tenderData)
          .select();
        
        if (error) {
          console.error(`Error inserting tender: ${tenderData.title}`, error);
        } else {
          console.log(`Successfully inserted tender: ${tenderData.title}`);
          insertedCount++;
          processedTenders.push(data[0]);
        }
      } else {
        console.log(`Tender already exists: ${tenderData.title}`);
      }
    }
    
    // Log the scraping operation
    await supabase.from('scraping_logs').insert({
      source: 'scheduled',
      status: 'success',
      records_found: scrapedTenders.length,
      records_inserted: insertedCount
    });
    
    // Get updated count
    const { count: newCount } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Scraping completed. Inserted ${insertedCount} new tenders. Total tenders: ${newCount}`);
    
    return new Response(
      JSON.stringify({ 
        message: 'Tenders scraped successfully',
        tenders_scraped: insertedCount,
        total_tenders: newCount || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in scrape-tenders function:', error);
    
    // Log the error
    await supabase.from('scraping_logs').insert({
      source: 'scheduled',
      status: 'error',
      error_message: error.message || 'Unknown error'
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape tenders',
        details: error.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
