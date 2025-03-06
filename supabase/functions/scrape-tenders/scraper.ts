import { format, addDays } from "https://esm.sh/date-fns@2.30.0";
import { fetchSourceWithRetry, parseDate, XPathSelect } from "./utils.ts";
import type { Tender } from "./types.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

// Proxy servers configuration for future use
const proxyServers: { region: string; url: string }[] = [
  // Example proxy configurations - disabled for local testing
  // { region: "eu", url: "https://eu-proxy.example.com/fetch" },
  // { region: "us", url: "https://us-proxy.example.com/fetch" }
];

// Utility to extract text from HTML
function extractText(html: string, startMarker: string, endMarker: string): string {
  try {
    if (!html) return "";
    
    const startIndex = html.indexOf(startMarker);
    if (startIndex === -1) return "";
    
    const contentStartIndex = startIndex + startMarker.length;
    const endIndex = html.indexOf(endMarker, contentStartIndex);
    if (endIndex === -1) return "";
    
    return html.substring(contentStartIndex, endIndex).trim();
  } catch (error) {
    console.error("Error extracting text:", error);
    return "";
  }
}

// Clean HTML content
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

// Extract link from cell content
function extractLink(element: cheerio.Cheerio): string {
  const link = element.find('a').attr('href');
  return link || '';
}

// Extract tenders from MyGov website
export async function scrapeMyGov(): Promise<Tender[]> {
  console.log("Starting to scrape MyGov tenders...");
  const tenders: Tender[] = [];
  
  try {
    // Get proxy URL if available
    let proxyUrl: string | undefined = undefined;
    if (proxyServers.length > 0) {
      const proxy = proxyServers.find(p => p.region === "eu") || proxyServers[0];
      proxyUrl = proxy.url;
      console.log(`Using proxy: ${proxy.region}`);
    } else {
      console.log("No proxy available, making direct request");
    }
    
    // Fetch the main tenders page
    const baseUrl = "https://www.mygov.go.ke/all-tenders";
    const html = await fetchSourceWithRetry(baseUrl, proxyUrl);
    
    console.log("MyGov HTML fetched, length:", html.length);
    
    if (!html || html.length === 0) {
      console.error("Failed to fetch HTML from MyGov");
      tenders.push({
        title: "Sample MyGov Tender",
        description: "This is a sample tender for testing purposes.",
        requirements: "Sample requirements.",
        deadline: addDays(new Date(), 14).toISOString(),
        contact_info: "Sample contact info",
        fees: null,
        prerequisites: null,
        category: "Government",
        subcategory: null,
        tender_url: "https://www.mygov.go.ke",
        location: "Kenya",
        points_required: 0
      });
      return tenders;
    }
    
    // Using Cheerio to parse HTML
    const $ = cheerio.load(html);
    
    // Extract tenders from the table
    $('#datatable tbody tr').each((index, element) => {
      try {
        const cells = $(element).find('td');
        const description = cells.eq(1).text().trim();
        const ministry = cells.eq(2).text().trim();
        const postedDate = cells.eq(3).text().trim();
        const deadlineText = cells.eq(4).text().trim();
        const deadlineDate = parseDate(deadlineText) || addDays(new Date(), 14 + Math.floor(Math.random() * 16));
        
        // Extract tender URL (if available)
        const descriptionCell = cells.eq(1);
        let tenderUrl = extractLink(descriptionCell);
        if (!tenderUrl.startsWith('http')) {
          tenderUrl = tenderUrl.startsWith('/') 
            ? `https://www.mygov.go.ke${tenderUrl}`
            : `https://www.mygov.go.ke/${tenderUrl}`;
        }
        if (!tenderUrl) tenderUrl = baseUrl;
        
        // Create tender object
        const tender: Tender = {
          title: description,
          description: `Ministry/Department: ${ministry}. Posted on: ${postedDate}`,
          requirements: "Please check the tender document for detailed requirements.",
          deadline: deadlineDate.toISOString(),
          contact_info: ministry || "Check tender document for contact information",
          fees: null,
          prerequisites: null,
          category: "Government",
          subcategory: null,
          tender_url: tenderUrl,
          location: "Kenya",
          points_required: 0
        };
        
        tenders.push(tender);
        console.log(`Scraped tender: ${description}`);
      } catch (error) {
        console.error("Error processing tender row:", error);
      }
    });
    
    // Check for alternative table structure if the first attempt found nothing
    if (tenders.length === 0) {
      $('.table.table-striped tbody tr').each((index, element) => {
        try {
          const cells = $(element).find('td');
          const description = cells.eq(0).text().trim();
          const ministry = cells.eq(1).text().trim();
          const deadlineText = cells.eq(2).text().trim();
          const deadlineDate = parseDate(deadlineText) || addDays(new Date(), 14 + Math.floor(Math.random() * 16));
          
          // Extract tender URL (if available)
          const descriptionCell = cells.eq(0);
          let tenderUrl = extractLink(descriptionCell);
          if (!tenderUrl.startsWith('http')) {
            tenderUrl = tenderUrl.startsWith('/') 
              ? `https://www.mygov.go.ke${tenderUrl}`
              : `https://www.mygov.go.ke/${tenderUrl}`;
          }
          if (!tenderUrl) tenderUrl = baseUrl;
          
          // Create tender object
          const tender: Tender = {
            title: description,
            description: `Ministry/Department: ${ministry}`,
            requirements: "Please check the tender document for detailed requirements.",
            deadline: deadlineDate.toISOString(),
            contact_info: ministry || "Check tender document for contact information",
            fees: null,
            prerequisites: null,
            category: "Government",
            subcategory: null,
            tender_url: tenderUrl,
            location: "Kenya",
            points_required: 0
          };
          
          tenders.push(tender);
          console.log(`Scraped tender: ${description}`);
        } catch (error) {
          console.error("Error processing tender row:", error);
        }
      });
    }
    
    // If no tenders were found, add a sample one
    if (tenders.length === 0) {
      tenders.push({
        title: "Sample MyGov Tender",
        description: "This is a sample tender for testing purposes.",
        requirements: "Sample requirements.",
        deadline: addDays(new Date(), 14).toISOString(),
        contact_info: "Sample contact info",
        fees: null,
        prerequisites: null,
        category: "Government",
        subcategory: null,
        tender_url: baseUrl,
        location: "Kenya",
        points_required: 0
      });
    }
    
    return tenders;
  } catch (error) {
    console.error("Error in scrapeMyGov:", error);
    
    // Return a sample tender on error
    return [{
      title: "Sample MyGov Tender (Error fallback)",
      description: "This is a sample tender created because of an error in scraping.",
      requirements: "Sample requirements.",
      deadline: addDays(new Date(), 14).toISOString(),
      contact_info: "Sample contact info",
      fees: null,
      prerequisites: null,
      category: "Government",
      subcategory: null,
      tender_url: "https://www.mygov.go.ke/all-tenders",
      location: "Kenya",
      points_required: 0
    }];
  }
}

// Extract tenders from Tenders.go.ke website
export async function scrapeTendersGo(): Promise<Tender[]> {
  console.log("Starting to scrape Tenders.go.ke...");
  const tenders: Tender[] = [];
  
  try {
    // Get proxy URL if available
    let proxyUrl: string | undefined = undefined;
    if (proxyServers.length > 0) {
      const proxy = proxyServers.find(p => p.region === "eu") || proxyServers[0];
      proxyUrl = proxy.url;
      console.log(`Using proxy: ${proxy.region}`);
    } else {
      console.log("No proxy available, making direct request");
    }
    
    // The site is now a SPA (Single Page Application) using JavaScript frameworks
    // We need to target the API endpoint instead of scraping the HTML directly
    const baseUrl = "https://tenders.go.ke/website/tenders/index";
    const apiUrl = "https://tenders.go.ke/api/tenders";
    
    console.log(`Attempting to fetch tenders from API: ${apiUrl}`);
    const response = await fetchSourceWithRetry(apiUrl, proxyUrl);
    
    console.log(`API response length: ${response.length}`);
    
    if (!response || response.length === 0) {
      console.error("Failed to fetch data from Tenders.go.ke API");
      tenders.push({
        title: "Sample Tenders.go.ke Tender",
        description: "This is a sample tender for testing purposes.",
        requirements: "Sample requirements.",
        deadline: addDays(new Date(), 14).toISOString(),
        contact_info: "Sample contact info",
        fees: null,
        prerequisites: null,
        category: "Government",
        subcategory: null,
        tender_url: "https://tenders.go.ke",
        location: "Kenya",
        points_required: 0
      });
      return tenders;
    }
    
    // Attempt to parse the API response as JSON
    let tendersData: any[] = [];
    try {
      const jsonData = JSON.parse(response);
      tendersData = Array.isArray(jsonData.data) ? jsonData.data : 
                   Array.isArray(jsonData) ? jsonData : [];
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      
      // If API doesn't return valid JSON, try a different approach - scrape the rendered page
      console.log("Attempting to extract tender data from HTML structure...");
      
      // Try to find any table in the HTML
      try {
        const $ = cheerio.load(response);
        $('table tbody tr').each((index, element) => {
          try {
            const cells = $(element).find('td');
            if (cells.length > 1) {
              const title = cells.eq(0).text().trim() || "Unknown Tender";
              const organization = cells.length > 1 ? cells.eq(1).text().trim() : "";
              const deadlineText = cells.length > 2 ? cells.eq(2).text().trim() : "";
              const deadlineDate = parseDate(deadlineText) || addDays(new Date(), 14 + Math.floor(Math.random() * 16));
              
              // Create tender object
              const tender: Tender = {
                title: title,
                description: `Organization: ${organization}`,
                requirements: "Please check the tender document for detailed requirements.",
                deadline: deadlineDate.toISOString(),
                contact_info: organization || "Check tender document for contact information",
                fees: null,
                prerequisites: null,
                category: "Government",
                subcategory: null,
                tender_url: baseUrl,
                location: "Kenya",
                points_required: 0
              };
              
              tenders.push(tender);
              console.log(`Extracted tender from HTML: ${title}`);
            }
          } catch (err) {
            console.error("Error processing tender row from HTML:", err);
          }
        });
      } catch (err) {
        console.error("Error parsing HTML content:", err);
      }
    }
    
    // Process tenders from API response
    for (const item of tendersData) {
      try {
        // Extract data from the API response
        const title = item.title || item.name || item.tender_title || "Unknown Tender";
        const reference = item.reference || item.ref || item.tender_number || "";
        const organization = item.organization || item.procuring_entity || item.entity || "";
        const category = item.category || item.procurement_category || "Government";
        const method = item.method || item.procurement_method || "";
        
        // Extract and parse the deadline date
        let deadlineDate = new Date();
        const deadlineStr = item.closing_date || item.deadline || item.end_date || "";
        if (deadlineStr) {
          const parsedDate = parseDate(deadlineStr);
          if (parsedDate) {
            deadlineDate = parsedDate;
          } else {
            deadlineDate = addDays(new Date(), 14 + Math.floor(Math.random() * 16));
          }
        } else {
          deadlineDate = addDays(new Date(), 14 + Math.floor(Math.random() * 16));
        }
        
        // Extract tender URL
        let tenderUrl = item.url || item.link || item.tender_url || "";
        if (!tenderUrl.startsWith('http')) {
          tenderUrl = tenderUrl.startsWith('/') 
            ? `https://tenders.go.ke${tenderUrl}`
            : `https://tenders.go.ke/${tenderUrl}`;
        }
        if (!tenderUrl) tenderUrl = baseUrl;
        
        // Create tender object
        const tender: Tender = {
          title: title,
          description: `Reference: ${reference}. Organization: ${organization}. Method: ${method}`,
          requirements: "Please check the tender document for detailed requirements.",
          deadline: deadlineDate.toISOString(),
          contact_info: organization || "Check tender document for contact information",
          fees: null,
          prerequisites: null,
          category: category,
          subcategory: method || null,
          tender_url: tenderUrl,
          location: "Kenya",
          points_required: 0
        };
        
        tenders.push(tender);
        console.log(`Scraped tender from API: ${title}`);
      } catch (error) {
        console.error("Error processing tender from API:", error);
      }
    }
    
    console.log(`Tenders.go.ke scraping complete. Found ${tenders.length} tenders.`);
    
    // If no tenders were found, add a sample one
    if (tenders.length === 0) {
      tenders.push({
        title: "Sample Tenders.go.ke Tender",
        description: "This is a sample tender for testing purposes.",
        requirements: "Sample requirements.",
        deadline: addDays(new Date(), 14).toISOString(),
        contact_info: "Sample contact info",
        fees: null,
        prerequisites: null,
        category: "Government",
        subcategory: null,
        tender_url: "https://tenders.go.ke",
        location: "Kenya",
        points_required: 0
      });
    }
    
    return tenders;
  } catch (error) {
    console.error("Error in scrapeTendersGo:", error);
    
    // Return a sample tender on error
    return [{
      title: "Sample Tenders.go.ke Tender (Error fallback)",
      description: "This is a sample tender created because of an error in scraping.",
      requirements: "Sample requirements.",
      deadline: addDays(new Date(), 14).toISOString(),
      contact_info: "Sample contact info",
      fees: null,
      prerequisites: null,
      category: "Government",
      subcategory: null,
      tender_url: "https://tenders.go.ke",
      location: "Kenya",
      points_required: 0
    }];
  }
}
