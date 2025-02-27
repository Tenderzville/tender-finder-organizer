
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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

function generateMockTenders(count = 20): ScrapedTender[] {
  const categories = ['Construction', 'IT', 'Healthcare', 'Consulting', 'Supplies', 'Agriculture', 'Education', 'Transport'];
  const organizations = [
    'Ministry of Health', 
    'Ministry of Education', 
    'Kenya Power', 
    'Kenya Railways', 
    'County Government of Nairobi', 
    'University of Nairobi', 
    'Kenya Airports Authority',
    'Ministry of Finance',
    'Kenya Bureau of Standards',
    'Kenya Ports Authority'
  ];
  const locations = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'South Africa', 'Ethiopia', 'Nigeria', 'Ghana', 'International'];
  const fees = ['5,000', '10,000', '15,000', '25,000', '50,000', '100,000', 'Contact for pricing'];
  
  const mockTenders: ScrapedTender[] = [];
  
  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const organization = organizations[Math.floor(Math.random() * organizations.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const fee = fees[Math.floor(Math.random() * fees.length)];
    
    // Set deadline between 2 weeks and 2 months from now
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14 + Math.floor(Math.random() * 45));
    
    const tenderNumber = Math.floor(Math.random() * 10000) + 1;
    
    mockTenders.push({
      title: `${category} Tender #${tenderNumber}: ${organization} procurement of services and goods`,
      description: `This is a tender for the procurement of various ${category.toLowerCase()} goods and services for ${organization}. The successful bidder will be expected to deliver high-quality services in accordance with the stated requirements.\n\nReference Number: KE-${tenderNumber}-${new Date().getFullYear()}\n\nBidding opens: ${new Date().toLocaleDateString()}\nOnline submissions: Available`,
      requirements: `1. At least 5 years of experience in ${category}\n2. Valid tax compliance certificate\n3. Company registration documents\n4. Proven track record in similar projects\n5. Financial capability to execute the project\n6. Qualified personnel`,
      deadline: deadline.toISOString(),
      contact_info: organization,
      fees: `KSh ${fee}`,
      prerequisites: `Bidders must be registered with relevant authorities and have all necessary permits.`,
      category,
      location,
      tender_url: null
    });
  }
  
  return mockTenders;
}

async function scrapeTenders() {
  console.log('Starting tender scraping process...');
  
  try {
    // Generate mock tenders
    const mockTenders = generateMockTenders(20);
    console.log(`Generated ${mockTenders.length} mock tenders`);
    
    // Log scraping attempt
    const { data: logEntry, error: logError } = await supabase
      .from('scraping_logs')
      .insert({
        source: 'Mock Tender Generator',
        status: 'in_progress',
        records_found: mockTenders.length
      })
      .select();

    if (logError) {
      console.error('Error creating log entry:', logError);
    }

    const logId = logEntry?.[0]?.id;
    
    // Check if we have any tenders already
    const { count: existingCount, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error checking existing tenders:', countError);
      return { success: false, error: countError.message };
    }
    
    console.log(`Found ${existingCount || 0} existing tenders in the database`);
    
    // Delete all existing tenders if needed (for testing)
    // Uncomment this section if you want to clear all tenders and start fresh
    /*
    if (existingCount && existingCount > 0) {
      const { error: deleteError } = await supabase
        .from('tenders')
        .delete()
        .gt('id', 0);
      
      if (deleteError) {
        console.error('Error deleting existing tenders:', deleteError);
        return { success: false, error: deleteError.message };
      }
      
      console.log('Successfully deleted all existing tenders');
    }
    */
    
    // Insert mock tenders
    for (let i = 0; i < mockTenders.length; i += 10) {
      const batch = mockTenders.slice(i, i + 10);
      const { error: insertError } = await supabase
        .from('tenders')
        .upsert(batch, {
          onConflict: 'title',
          ignoreDuplicates: true
        });
      
      if (insertError) {
        console.error(`Error inserting batch ${i/10 + 1}:`, insertError);
      } else {
        console.log(`Successfully inserted batch ${i/10 + 1} of ${Math.ceil(mockTenders.length/10)}`);
      }
    }
    
    // Update log entry with success
    if (logId) {
      await supabase
        .from('scraping_logs')
        .update({
          status: 'completed',
          records_inserted: mockTenders.length
        })
        .eq('id', logId);
    }
    
    // Remove expired tenders
    await removeExpiredTenders();
    
    // Get the current count of tenders
    const { count: finalCount } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    return { 
      success: true, 
      tenders_scraped: mockTenders.length,
      total_tenders: finalCount
    };
  } catch (error) {
    console.error('Error in scrape-tenders function:', error);
    return { success: false, error: error.message };
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
