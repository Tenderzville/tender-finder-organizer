
import cheerio from "cheerio";
import { format, addDays, parseISO } from "date-fns";
import { TenderData } from "./types.ts";

// Function to scrape mygov.go.ke/all-tenders
export async function scrapeMygov(): Promise<TenderData[]> {
  try {
    console.log("Starting scrape from mygov.go.ke/all-tenders");
    
    const response = await fetch("https://mygov.go.ke/all-tenders");
    if (!response.ok) {
      throw new Error(`Failed to fetch mygov.go.ke: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const tenders: TenderData[] = [];
    
    $('#datatable tbody tr').each((index, element) => {
      const title = $(element).find('td.views-field-title').text().trim();
      const procuringEntity = $(element).find('td.views-field-field-ten').text().trim();
      const documentUrl = $(element).find('td.views-field-field-tender-documents a').attr('href') || '';
      const closingDate = $(element).find('td.views-field-field-tender-closing-date').text().trim();
      
      // Skip empty entries
      if (!title) return;
      
      // Parse the date (assuming DD/MM/YYYY format)
      let deadline = new Date();
      if (closingDate) {
        const parts = closingDate.split('/');
        if (parts.length === 3) {
          deadline = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      
      tenders.push({
        title,
        description: title,
        requirements: "See tender document for requirements",
        deadline: deadline.toISOString(),
        contact_info: procuringEntity,
        fees: null,
        prerequisites: null,
        category: "Government",
        subcategory: null,
        tender_url: documentUrl,
        location: "Kenya",
        points_required: 0
      });
    });
    
    console.log(`Found ${tenders.length} tenders from mygov.go.ke`);
    return tenders;
  } catch (error) {
    console.error("Error scraping mygov.go.ke:", error);
    return [];
  }
}

// Function to scrape tenders.go.ke/tenders
export async function scrapeTendersGoKe(): Promise<TenderData[]> {
  try {
    console.log("Starting scrape from tenders.go.ke/tenders");
    
    const response = await fetch("https://tenders.go.ke/tenders");
    if (!response.ok) {
      throw new Error(`Failed to fetch tenders.go.ke: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const tenders: TenderData[] = [];
    
    // Adjust the selector based on the actual structure of tenders.go.ke
    $('.tender-listing, .tender-item').each((index, element) => {
      const title = $(element).find('.tender-title, h3').text().trim();
      const description = $(element).find('.tender-description, .description').text().trim() || title;
      const entity = $(element).find('.procuring-entity, .entity').text().trim();
      const dateText = $(element).find('.closing-date, .deadline').text().trim();
      const category = $(element).find('.category').text().trim() || "Government";
      const link = $(element).find('a').attr('href') || '';
      
      // Skip empty entries
      if (!title) return;
      
      // Default deadline (2 weeks from now)
      let deadline = addDays(new Date(), 14);
      
      // Try to parse date if available
      if (dateText) {
        // This is a simplistic date parser, adjust based on actual format
        const dateMatch = dateText.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
        if (dateMatch) {
          const day = parseInt(dateMatch[1]);
          const month = parseInt(dateMatch[2]);
          const year = parseInt(dateMatch[3]) < 100 
            ? parseInt(dateMatch[3]) + 2000 
            : parseInt(dateMatch[3]);
          deadline = new Date(year, month - 1, day);
        }
      }
      
      // Construct full URL if it's a relative path
      let fullUrl = link;
      if (link && !link.startsWith('http')) {
        fullUrl = `https://tenders.go.ke${link.startsWith('/') ? '' : '/'}${link}`;
      }
      
      tenders.push({
        title,
        description,
        requirements: "See tender document for requirements",
        deadline: deadline.toISOString(),
        contact_info: entity,
        fees: null,
        prerequisites: null,
        category,
        subcategory: null,
        tender_url: fullUrl,
        location: "Kenya",
        points_required: 0
      });
    });
    
    console.log(`Found ${tenders.length} tenders from tenders.go.ke`);
    return tenders;
  } catch (error) {
    console.error("Error scraping tenders.go.ke:", error);
    return [];
  }
}

// Fallback function to generate sample data if scraping fails
export function generateSampleTenders(): TenderData[] {
  console.log("Generating sample tenders as fallback");
  const tenders: TenderData[] = [];
  
  const categories = ["Construction", "IT", "Supplies", "Services", "Consultancy"];
  const locations = ["Nairobi", "Mombasa", "Kisumu", "National"];
  
  for (let i = 1; i <= 10; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const deadline = addDays(new Date(), 7 + Math.floor(Math.random() * 30));
    
    tenders.push({
      title: `Sample Tender ${i}: ${category} Project`,
      description: `This is a sample tender for a ${category.toLowerCase()} project in ${location}.`,
      requirements: "Sample requirements. See tender document for details.",
      deadline: deadline.toISOString(),
      contact_info: `Ministry of ${category}`,
      fees: Math.random() > 0.5 ? `KES ${Math.floor(Math.random() * 1000000)}` : null,
      prerequisites: null,
      category,
      subcategory: null,
      tender_url: "https://example.com/tender",
      location,
      points_required: 0
    });
  }
  
  return tenders;
}
