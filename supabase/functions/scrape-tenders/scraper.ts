// Use import map for modules
import { load } from "cheerio";
import { format, parseISO, isValid, addMonths, addDays } from "date-fns";

interface TenderData {
  id?: string;
  title: string;
  description?: string;
  url?: string;
  deadline?: string;
  location?: string;
  contact?: string;
  source?: string;
  category?: string;
}

// Main scraping function - accepts supabase client as a parameter
export const scrapeTenders = async (supabaseClient: any) => {
  console.log('Starting tender scraping process...');
  
  // Initialize array to store scraped tenders
  const scrapedTenders: TenderData[] = [];
  let successfulSources = 0;
  let errors: string[] = [];
  
  try {
    // Kenyan Government Tenders: MyGov
    try {
      await scrapeMyGovKe(scrapedTenders);
      console.log('Successfully scraped MyGov.ke tenders');
      successfulSources++;
    } catch (error) {
      console.error('Error scraping MyGov.ke:', error);
      errors.push(`MyGov.ke: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Kenyan Government Tenders: tenders.go.ke
    try {
      await scrapeKenyaTenders(scrapedTenders);
      console.log('Successfully scraped tenders.go.ke');
      successfulSources++;
    } catch (error) {
      console.error('Error scraping tenders.go.ke:', error);
      errors.push(`tenders.go.ke: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // First source: UN Development Business
    try {
      await scrapeUNDB(scrapedTenders);
      console.log('Successfully scraped UNDB tenders');
      successfulSources++;
    } catch (error) {
      console.error('Error scraping UNDB:', error);
      errors.push(`UNDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Second source: World Bank
    try {
      await scrapeWorldBank(scrapedTenders);
      console.log('Successfully scraped World Bank tenders');
      successfulSources++;
    } catch (error) {
      console.error('Error scraping World Bank:', error);
      errors.push(`World Bank: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Third source: Public Tenders
    try {
      await scrapePublicTenders(scrapedTenders);
      console.log('Successfully scraped Public Tenders');
      successfulSources++;
    } catch (error) {
      console.error('Error scraping Public Tenders:', error);
      errors.push(`Public Tenders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Filter tenders by date criteria
    const filteredTenders = filterTendersByDate(scrapedTenders);
    
    // Log the completion
    console.log(`Completed scraping. Found ${scrapedTenders.length} total tenders, ${filteredTenders.length} meet criteria.`);
    
    // If no sources were successful, throw an error
    if (successfulSources === 0) {
      throw new Error(`All sources failed: ${errors.join('; ')}`);
    }
    
    // Log the scraping success in the database
    if (supabaseClient) {
      await supabaseClient.from('scraping_logs').insert({
        source: 'scheduled',
        status: successfulSources > 0 ? 'success' : 'partial_success',
        records_found: scrapedTenders.length,
        records_filtered: filteredTenders.length,
        records_inserted: 0, // Will be updated in the main function
        error_message: errors.length > 0 ? errors.join('; ') : null
      });
      
      // Prepare data for notifications if new tenders were found
      if (filteredTenders.length > 0) {
        await prepareNotifications(supabaseClient, filteredTenders);
      }
    }
    
    // Return the filtered tenders
    return filteredTenders;
  } catch (error) {
    console.error('Error during tender scraping:', error);
    
    // Log the error in the database
    if (supabaseClient) {
      await supabaseClient.from('scraping_logs').insert({
        source: 'scheduled',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error in scraper',
        records_found: scrapedTenders.length,
        records_inserted: 0
      });
    }
    
    // Re-throw the error to be handled by the caller
    throw error;
  }
};

// Filter tenders by date criteria
function filterTendersByDate(tenders: TenderData[]): TenderData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const filteredTenders = tenders.filter(tender => {
    // Skip tenders without a deadline
    if (!tender.deadline) return false;
    
    try {
      // Parse the deadline - handle different formats
      const deadlineDate = parseDeadlineDate(tender.deadline);
      
      // Calculate days until deadline
      const daysUntilDeadline = Math.ceil(
        (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Keep tenders with 14+ days until deadline
      return daysUntilDeadline >= 14;
    } catch (error) {
      console.warn(`Could not parse deadline for tender: ${tender.title} - ${tender.deadline}`);
      return false;
    }
  });
  
  return filteredTenders;
}

// Parse different date formats
function parseDeadlineDate(deadlineStr: string): Date {
  // Try different date formats
  const formats = [
    // Standard format
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,
    // Month name format
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
    // Year first format
    /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/
  ];
  
  for (const format of formats) {
    const match = deadlineStr.match(format);
    if (match) {
      // Format specific parsing
      if (format === formats[0]) {
        // DD/MM/YYYY
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      } else if (format === formats[1]) {
        // DD Month YYYY
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const month = monthNames.indexOf(match[2].toLowerCase().substring(0, 3));
        return new Date(parseInt(match[3]), month, parseInt(match[1]));
      } else {
        // YYYY/MM/DD
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      }
    }
  }
  
  // If nothing matched, try Date.parse() as fallback
  const timestamp = Date.parse(deadlineStr);
  if (!isNaN(timestamp)) {
    return new Date(timestamp);
  }
  
  throw new Error(`Unable to parse date: ${deadlineStr}`);
}

// Prepare notifications for new tenders
async function prepareNotifications(supabaseClient: any, newTenders: TenderData[]) {
  try {
    // Get users with notification preferences
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('id, email, notification_preferences')
      .eq('notifications_enabled', true);
    
    if (usersError) {
      console.error('Error fetching users for notifications:', usersError);
      return;
    }
    
    // Process each user
    for (const user of users) {
      // Skip users without notification preferences
      if (!user.notification_preferences) continue;
      
      // Filter tenders matching user preferences
      const matchingTenders = newTenders.filter(tender => {
        // Check categories, locations, etc.
        const prefs = user.notification_preferences;
        
        // Simple keyword matching in title and description
        const keywords = prefs.keywords || [];
        if (keywords.length > 0) {
          const text = `${tender.title} ${tender.description || ''}`.toLowerCase();
          if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
            return true;
          }
        }
        
        // Location matching
        const locations = prefs.locations || [];
        if (locations.length > 0 && tender.location) {
          if (locations.some(loc => tender.location?.toLowerCase().includes(loc.toLowerCase()))) {
            return true;
          }
        }
        
        return false;
      });
      
      // Create notifications for matching tenders
      if (matchingTenders.length > 0) {
        for (const tender of matchingTenders) {
          await supabaseClient.from('notifications').insert({
            user_id: user.id,
            type: 'new_tender',
            title: 'New Tender Available',
            content: `A new tender matching your interests is available: ${tender.title}`,
            metadata: { tender_id: tender.id },
            read: false
          });
        }
      }
    }
    
    console.log(`Processed notifications for ${users.length} users`);
  } catch (error) {
    console.error('Error preparing notifications:', error);
  }
}

// Scrape Kenyan MyGov tenders
async function scrapeMyGovKe(tenders: TenderData[]) {
  console.log('Scraping MyGov Kenya tenders...');
  
  const response = await fetch('https://www.mygov.go.ke/all-tenders', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch MyGov.ke: ${response.status} ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = load(html);
  
  const initialCount = tenders.length;
  
  // Find tender listings on the page - adjust selectors based on actual site structure
  $('.tender-item, .tender-listing, .opportunity-item').each((index, element) => {
    const title = $(element).find('h3, .tender-title, .opportunity-title').text().trim();
    const url = new URL(
      $(element).find('a').attr('href') || '',
      'https://www.mygov.go.ke'
    ).toString();
    
    const description = $(element).find('.description, .tender-description, .details').text().trim();
    const deadline = $(element).find('.deadline, .closing-date, .due-date').text().trim();
    const location = $(element).find('.location, .region').text().trim() || 'Kenya';
    const category = $(element).find('.category, .sector, .type').text().trim() || 'Government';
    
    if (title) {
      tenders.push({
        title,
        description,
        url,
        deadline,
        location,
        category,
        source: 'MyGov Kenya'
      });
    }
  });
  
  const foundCount = tenders.length - initialCount;
  if (foundCount === 0) {
    throw new Error('No tenders found on MyGov.ke - page structure may have changed');
  }
  
  console.log(`Found ${foundCount} tenders from MyGov Kenya`);
}

// Scrape Kenyan Tenders (tenders.go.ke)
async function scrapeKenyaTenders(tenders: TenderData[]) {
  console.log('Scraping Kenya Tenders Portal...');
  
  const response = await fetch('https://tenders.go.ke/tenders', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tenders.go.ke: ${response.status} ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = load(html);
  
  const initialCount = tenders.length;
  
  // Find tender listings - adjust selectors based on actual site structure
  $('.tender-item, .tender-listing, table tr').each((index, element) => {
    // Skip header rows
    if ($(element).find('th').length) return;
    
    let title, url, deadline, location, category;
    
    // Table structure
    if ($(element).find('td').length) {
      const cells = $(element).find('td');
      title = cells.eq(1).text().trim();
      url = new URL(
        cells.eq(1).find('a').attr('href') || '',
        'https://tenders.go.ke'
      ).toString();
      deadline = cells.eq(3).text().trim();
      location = 'Kenya';
      category = cells.eq(2).text().trim() || 'Government';
    } else {
      // Non-table structure
      title = $(element).find('h3, .tender-title').text().trim();
      url = new URL(
        $(element).find('a').attr('href') || '',
        'https://tenders.go.ke'
      ).toString();
      deadline = $(element).find('.deadline, .closing-date').text().trim();
      location = $(element).find('.location').text().trim() || 'Kenya';
      category = $(element).find('.category').text().trim() || 'Government';
    }
    
    const description = $(element).find('.description, .tender-description, .details').text().trim();
    
    if (title) {
      tenders.push({
        title,
        description,
        url,
        deadline,
        location,
        category,
        source: 'Kenya Tenders Portal'
      });
    }
  });
  
  const foundCount = tenders.length - initialCount;
  if (foundCount === 0) {
    throw new Error('No tenders found on tenders.go.ke - page structure may have changed');
  }
  
  console.log(`Found ${foundCount} tenders from Kenya Tenders Portal`);
}

// Scrape UN Development Business tenders
async function scrapeUNDB(tenders: TenderData[]) {
  console.log('Scraping UN Development Business tenders...');
  
  const response = await fetch('https://devbusiness.un.org/content/procurement-notices', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch UNDB: ${response.status} ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = load(html);
  
  const initialCount = tenders.length;
  
  // Find tender listings on the page
  $('.node--type-tender').each((index, element) => {
    const title = $(element).find('h2.node__title a').text().trim();
    const url = 'https://devbusiness.un.org' + $(element).find('h2.node__title a').attr('href');
    const description = $(element).find('.field--name-field-tender-description').text().trim();
    const deadline = $(element).find('.field--name-field-deadline .datetime').text().trim();
    const location = $(element).find('.field--name-field-country a').text().trim();
    
    if (title) {
      tenders.push({
        title,
        description,
        url,
        deadline,
        location,
        source: 'UNDB'
      });
    }
  });
  
  const foundCount = tenders.length - initialCount;
  if (foundCount === 0) {
    throw new Error('No tenders found - page structure may have changed');
  }
  
  console.log(`Found ${foundCount} tenders from UNDB`);
}

// Scrape World Bank tenders
async function scrapeWorldBank(tenders: TenderData[]) {
  try {
    console.log('Scraping World Bank tenders...');
    
    // Example URL for World Bank tenders
    const response = await fetch('https://projects.worldbank.org/en/projects-operations/procurement?srce=both');
    const html = await response.text();
    const $ = load(html);
    
    // Find tender listings on the page
    $('.list-item').each((index, element) => {
      const title = $(element).find('h3 a').text().trim();
      const url = 'https://projects.worldbank.org' + $(element).find('h3 a').attr('href');
      const description = $(element).find('.description').text().trim();
      const deadlineElement = $(element).find('.notice-date');
      const deadline = deadlineElement.length ? deadlineElement.text().trim() : '';
      
      if (title) {
        tenders.push({
          title,
          description,
          url,
          deadline,
          location: 'International',
          source: 'World Bank'
        });
      }
    });
    
    console.log(`Found ${tenders.length} tenders (including World Bank)`);
  } catch (error) {
    console.error('Error scraping World Bank:', error);
    throw error;
  }
}

// Scrape general public tenders
async function scrapePublicTenders(tenders: TenderData[]) {
  try {
    console.log('Scraping Public Tenders...');
    
    // Example URL for public tenders
    const response = await fetch('https://www.publictendering.com/latest-tenders/');
    const html = await response.text();
    const $ = load(html);
    
    // Find tender listings on the page
    $('.tender-item').each((index, element) => {
      const title = $(element).find('.tender-title').text().trim();
      const url = $(element).find('.tender-title a').attr('href');
      const description = $(element).find('.tender-excerpt').text().trim();
      const deadline = $(element).find('.tender-deadline').text().replace('Deadline:', '').trim();
      const location = $(element).find('.tender-location').text().replace('Location:', '').trim();
      const contact = $(element).find('.tender-contact').text().replace('Contact:', '').trim();
      
      if (title) {
        tenders.push({
          title,
          description,
          url,
          deadline,
          location,
          contact,
          source: 'Public Tendering'
        });
      }
    });
    
    console.log(`Found ${tenders.length} tenders total`);
  } catch (error) {
    console.error('Error scraping Public Tenders:', error);
    throw error;
  }
}
