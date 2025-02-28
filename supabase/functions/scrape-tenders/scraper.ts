
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';

interface TenderData {
  title: string;
  description?: string;
  url?: string;
  deadline?: string;
  location?: string;
  contact?: string;
  source?: string;
}

// Main scraping function - accepts supabase client as a parameter
export const scrapeTenders = async (supabaseClient: any) => {
  console.log('Starting tender scraping process...');
  
  // Initialize array to store scraped tenders
  const scrapedTenders: TenderData[] = [];
  
  try {
    // First source: UN Development Business
    await scrapeUNDB(scrapedTenders);
    
    // Second source: World Bank
    await scrapeWorldBank(scrapedTenders);
    
    // Third source: Public Tenders
    await scrapePublicTenders(scrapedTenders);
    
    // Log the completion
    console.log(`Completed scraping. Found ${scrapedTenders.length} total tenders.`);
    
    // Log the scraping success in the database
    if (supabaseClient) {
      await supabaseClient.from('scraping_logs').insert({
        source: 'scheduled',
        status: 'success',
        records_found: scrapedTenders.length,
        records_inserted: 0 // Will be updated in the main function
      });
    }
  } catch (error) {
    console.error('Error during tender scraping:', error);
    
    // Log the error in the database
    if (supabaseClient) {
      await supabaseClient.from('scraping_logs').insert({
        source: 'scheduled',
        status: 'error',
        error_message: error.message || 'Unknown error in scraper'
      });
    }
  }
  
  return scrapedTenders;
};

// Scrape UN Development Business tenders
async function scrapeUNDB(tenders: TenderData[]) {
  try {
    console.log('Scraping UN Development Business tenders...');
    
    // Example URL for UNDB tenders
    const response = await fetch('https://devbusiness.un.org/content/procurement-notices');
    const html = await response.text();
    const $ = load(html);
    
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
    
    console.log(`Found ${tenders.length} tenders from UNDB`);
  } catch (error) {
    console.error('Error scraping UNDB:', error);
  }
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
    
    // If no tenders were found, add some sample tenders for testing
    if (tenders.length === 0) {
      console.log('Adding sample tenders for testing...');
      addSampleTenders(tenders);
    }
  }
}

// Add sample tenders for testing when no real tenders are found
function addSampleTenders(tenders: TenderData[]) {
  const sampleTenders = [
    {
      title: "Supply of IT Equipment for Municipal Offices",
      description: "Procurement of desktop computers, laptops, printers, and networking equipment for municipal government offices. Requirements: At least 50 desktop computers with i5 processors, 16GB RAM, 512GB SSD. 25 laptops with similar specifications. 10 network printers with scanning capabilities. All equipment must have 3-year warranty. Deadline: April 30, 2023. Contact: procurement@municipality.gov",
      deadline: "April 30, 2023",
      location: "New York",
      contact: "procurement@municipality.gov",
      source: "Sample"
    },
    {
      title: "Road Construction Project - Highway Extension",
      description: "Construction of 25km highway extension connecting northern suburbs to downtown. Requirements: Experienced road construction company with at least 10 years in highway development. Must have completed at least 3 similar projects. Equipment and workforce must be available immediately. Prerequisites: Valid construction license, environmental impact assessment capability. Deadline: May 15, 2023. Contact: highways@transportation.gov",
      deadline: "May 15, 2023",
      location: "Chicago",
      contact: "highways@transportation.gov",
      source: "Sample"
    },
    {
      title: "Medical Supplies for Regional Hospitals",
      description: "Supply of essential medical equipment and consumables for five regional hospitals. Requirements: Various medical supplies including surgical instruments, patient monitoring systems, and laboratory equipment. All products must be FDA approved and meet international quality standards. Delivery schedule: Phased over 6 months. Fees: Bid security of $50,000 required. Deadline: March 25, 2023. Contact: medical.procurement@health.gov",
      deadline: "March 25, 2023",
      location: "Los Angeles",
      contact: "medical.procurement@health.gov",
      source: "Sample"
    },
    {
      title: "School Renovation Project",
      description: "Complete renovation of 5 public schools including classrooms, laboratories, and recreational facilities. Requirements: Comprehensive renovation including structural repairs, electrical rewiring, plumbing upgrades, and interior finishing. Construction period: Must be completed during summer vacation. Prerequisites: Experience in educational institution projects. Deadline: February 28, 2023. Contact: education.projects@schools.gov",
      deadline: "February 28, 2023",
      location: "Boston",
      contact: "education.projects@schools.gov",
      source: "Sample"
    },
    {
      title: "Smart City Technology Implementation",
      description: "Implementation of IoT sensors, data analytics platform, and citizen engagement mobile application for smart city initiative. Requirements: End-to-end solution including hardware installation, software development, and 5-year maintenance plan. Deadline: June 10, 2023. Contact: smartcity@technology.gov",
      deadline: "June 10, 2023",
      location: "San Francisco",
      contact: "smartcity@technology.gov",
      source: "Sample"
    }
  ];
  
  for (const tender of sampleTenders) {
    tenders.push(tender);
  }
  
  console.log(`Added ${sampleTenders.length} sample tenders for testing`);
}
