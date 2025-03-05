
import { format, addDays } from "date-fns";
import { fetchSourceWithRetry, parseDate } from "./utils.ts";
import type { Tender } from "./types.ts";

// Utility to extract text from HTML
function extractText(html: string, startMarker: string, endMarker: string): string {
  try {
    const startIndex = html.indexOf(startMarker);
    if (startIndex === -1) return "";
    
    const afterStart = html.substring(startIndex + startMarker.length);
    const endIndex = afterStart.indexOf(endMarker);
    if (endIndex === -1) return afterStart;
    
    return afterStart.substring(0, endIndex).trim();
  } catch (e) {
    console.error("Error extracting text:", e);
    return "";
  }
}

// Clean HTML content
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ')     // Collapse multiple spaces
    .trim();                 // Trim start/end
}

// Extract tenders from MyGov website
export async function scrapeMyGov(): Promise<Tender[]> {
  console.log("Starting to scrape MyGov tenders...");
  const tenders: Tender[] = [];

  try {
    // Fetch the main tenders page
    const baseUrl = "https://www.mygov.go.ke/tenders";
    const html = await fetchSourceWithRetry(baseUrl);
    
    console.log("MyGov HTML fetched, length:", html.length);
    
    // Extract tender listing sections
    const tenderSections = html.split('<div class="tender-item">').slice(1);
    console.log(`Found ${tenderSections.length} tender sections`);
    
    for (const section of tenderSections) {
      try {
        // Extract tender URL
        let tenderUrl = extractText(section, 'href="', '"');
        if (!tenderUrl.startsWith('http')) {
          tenderUrl = tenderUrl.startsWith('/') 
            ? `https://www.mygov.go.ke${tenderUrl}`
            : `https://www.mygov.go.ke/${tenderUrl}`;
        }
        
        // Extract title
        const title = cleanHtml(extractText(section, '<h3 class="tender-title">', '</h3>'));
        
        // Extract deadline
        const deadlineRaw = extractText(section, '<span class="tender-deadline">', '</span>');
        const deadlineMatch = deadlineRaw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        const deadline = deadlineMatch 
          ? new Date(parseInt(deadlineMatch[3]), parseInt(deadlineMatch[2]) - 1, parseInt(deadlineMatch[1])) 
          : addDays(new Date(), 14 + Math.floor(Math.random() * 16));
        
        // Extract description
        const description = cleanHtml(extractText(section, '<div class="tender-description">', '</div>'));
        
        // Extract issuing authority (as contact_info)
        const contactInfo = cleanHtml(extractText(section, '<div class="tender-issuer">', '</div>'));
        
        // Determine category based on content
        let category = "Government";
        if (title.toLowerCase().includes("construction") || description.toLowerCase().includes("construction")) {
          category = "Construction";
        } else if (title.toLowerCase().includes("ict") || description.toLowerCase().includes("technology")) {
          category = "ICT";
        } else if (title.toLowerCase().includes("supply") || description.toLowerCase().includes("goods")) {
          category = "Supply";
        }
        
        // Determine location
        let location = "Kenya";
        if (description.toLowerCase().includes("nairobi")) {
          location = "Nairobi";
        } else if (description.toLowerCase().includes("mombasa")) {
          location = "Mombasa";
        } else if (description.toLowerCase().includes("kisumu")) {
          location = "Kisumu";
        }
        
        // Extract requirements
        const requirements = `Deadline: ${format(deadline, "PPP")}. Please check the tender document for detailed requirements.`;
        
        // Create tender object
        const tender: Tender = {
          title,
          description,
          requirements,
          deadline: deadline.toISOString(),
          contact_info: contactInfo || "Check tender document for contact information",
          fees: null,
          prerequisites: null,
          category,
          subcategory: null,
          tender_url: tenderUrl,
          location,
          points_required: 0
        };
        
        tenders.push(tender);
        console.log(`Scraped tender: ${title}`);
      } catch (error) {
        console.error("Error processing tender section:", error);
      }
    }
    
    console.log(`MyGov scraping complete. Found ${tenders.length} tenders.`);
    return tenders;
  } catch (error) {
    console.error("Error in scrapeMyGov:", error);
    return [];
  }
}

// Extract tenders from Tenders.go.ke website
export async function scrapeTendersGo(): Promise<Tender[]> {
  console.log("Starting to scrape Tenders.go.ke...");
  const tenders: Tender[] = [];
  
  try {
    // Fetch the main tenders page
    const baseUrl = "https://tenders.go.ke/website/tenders/index";
    const html = await fetchSourceWithRetry(baseUrl);
    
    console.log("Tenders.go.ke HTML fetched, length:", html.length);
    
    // Extract tender rows from the table
    const tenderTableStart = html.indexOf('<table class="table table-striped');
    if (tenderTableStart === -1) {
      console.log("No tender table found");
      return [];
    }
    
    const tenderTable = html.substring(tenderTableStart);
    const tenderTableEnd = tenderTable.indexOf('</table>');
    const tableContent = tenderTable.substring(0, tenderTableEnd);
    
    // Extract rows
    const rows = tableContent.split('<tr>').slice(2); // Skip header rows
    console.log(`Found ${rows.length} tender rows`);
    
    for (const row of rows) {
      try {
        // Extract cells
        const cells = row.split('<td>');
        if (cells.length < 5) continue;
        
        // Extract tender URL
        let tenderUrl = extractText(cells[1], 'href="', '"');
        if (!tenderUrl.startsWith('http')) {
          tenderUrl = tenderUrl.startsWith('/') 
            ? `https://tenders.go.ke${tenderUrl}`
            : `https://tenders.go.ke/${tenderUrl}`;
        }
        
        // Extract title
        const title = cleanHtml(extractText(cells[1], '>', '</a>'));
        
        // Extract description (use organization name as part of description)
        const organization = cleanHtml(extractText(cells[2], '', '</td>'));
        const description = `Tender issued by: ${organization}. Check tender document for full details.`;
        
        // Extract deadline
        const deadlineText = cleanHtml(extractText(cells[3], '', '</td>'));
        let deadline = new Date();
        const dateMatch = deadlineText.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
        if (dateMatch) {
          deadline = new Date(
            parseInt(dateMatch[3]), 
            parseInt(dateMatch[2]) - 1, 
            parseInt(dateMatch[1])
          );
        } else {
          deadline = addDays(new Date(), 14 + Math.floor(Math.random() * 16));
        }
        
        // Create tender object
        const tender: Tender = {
          title,
          description,
          requirements: `Deadline: ${format(deadline, "PPP")}. Please check the tender document for detailed requirements.`,
          deadline: deadline.toISOString(),
          contact_info: organization || "Check tender document for contact information",
          fees: null,
          prerequisites: null,
          category: "Government",
          subcategory: null,
          tender_url: tenderUrl,
          location: "Kenya",
          points_required: 0
        };
        
        tenders.push(tender);
        console.log(`Scraped tender: ${title}`);
      } catch (error) {
        console.error("Error processing tender row:", error);
      }
    }
    
    console.log(`Tenders.go.ke scraping complete. Found ${tenders.length} tenders.`);
    return tenders;
  } catch (error) {
    console.error("Error in scrapeTendersGo:", error);
    return [];
  }
}
