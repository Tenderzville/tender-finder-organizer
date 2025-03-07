
import { Tender } from './types';
import { fetchSourceWithRetry } from './utils';

/**
 * Dedicated scraper for AGPO (Access to Government Procurement Opportunities) tenders
 * These are procurement opportunities specifically for youth, women and persons with disabilities
 */
export async function scrapeAGPOTenders(): Promise<Tender[]> {
  console.log("Starting to scrape AGPO tenders...");
  const tenders: Tender[] = [];
  
  try {
    // AGPO tenders can be found on multiple sources
    const sources = [
      {
        name: 'agpo.go.ke',
        url: 'https://agpo.go.ke/opportunities',
        type: 'website'
      },
      {
        name: 'treasury.go.ke',
        url: 'https://www.treasury.go.ke/procurement-opportunities/',
        type: 'website'
      },
      // Add more AGPO-specific sources as needed
    ];
    
    for (const source of sources) {
      console.log(`Scraping AGPO tenders from ${source.name}...`);
      
      try {
        const html = await fetchSourceWithRetry(source.url);
        
        // Parse the tender data specific to this source
        const agpoTenders = parseAGPOTenders(html, source);
        
        console.log(`Found ${agpoTenders.length} AGPO tenders from ${source.name}`);
        tenders.push(...agpoTenders);
      } catch (error) {
        console.error(`Error scraping AGPO tenders from ${source.name}:`, error);
      }
    }
    
    return tenders;
  } catch (error) {
    console.error("Error in AGPO scraper:", error);
    return [];
  }
}

/**
 * Parse HTML content to extract AGPO tender information
 */
function parseAGPOTenders(html: string, source: { name: string, url: string, type: string }): Tender[] {
  const tenders: Tender[] = [];
  
  // Simple regex pattern to find tender information in the HTML
  // In a production environment, use a proper HTML parser like cheerio
  const tenderPattern = /<div[^>]*class="[^"]*tender-item[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  
  while ((match = tenderPattern.exec(html)) !== null) {
    const tenderHtml = match[1];
    
    // Extract tender details
    const titleMatch = /<h3[^>]*>([\s\S]*?)<\/h3>/i.exec(tenderHtml);
    const descMatch = /<p[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(tenderHtml);
    const deadlineMatch = /Deadline:[\s]*([\d\/\-\.]+)/i.exec(tenderHtml);
    const categoryMatch = /Category:[\s]*<[^>]*>([\s\S]*?)<\/[^>]*>/i.exec(tenderHtml);
    
    if (titleMatch) {
      const title = titleMatch[1].trim();
      const description = descMatch ? descMatch[1].trim() : "";
      const deadline = deadlineMatch ? new Date(deadlineMatch[1]) : new Date();
      const category = categoryMatch ? categoryMatch[1].trim() : "";
      
      // Determine the specific AGPO category
      let agpoType = "general";
      if (title.toLowerCase().includes("youth") || description.toLowerCase().includes("youth")) {
        agpoType = "youth";
      } else if (title.toLowerCase().includes("women") || description.toLowerCase().includes("women")) {
        agpoType = "women";
      } else if (
        title.toLowerCase().includes("pwd") || 
        description.toLowerCase().includes("pwd") ||
        title.toLowerCase().includes("persons with disabilities") || 
        description.toLowerCase().includes("persons with disabilities")
      ) {
        agpoType = "pwds";
      }
      
      tenders.push({
        title,
        description,
        deadline,
        procuring_entity: "AGPO Entity",
        tender_no: `AGPO-${Date.now()}-${tenders.length}`,
        category,
        tender_url: source.url,
        location: "Kenya",
        points_required: 0,
        affirmative_action: {
          type: agpoType,
          percentage: 30,
          details: `30% procurement preference for ${agpoType}`
        }
      });
    }
  }
  
  return tenders;
}
