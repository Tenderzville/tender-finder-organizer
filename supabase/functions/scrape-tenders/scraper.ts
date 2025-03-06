import { format, addDays, subDays } from "https://esm.sh/date-fns@2.30.0";
import { fetchSourceWithRetry, parseDate, XPathSelect, extractKeywords, generateTenderSearchUrl } from "./utils.ts";
import type { Tender } from "./types.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
// Remove Puppeteer import as it's causing compatibility issues
// import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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
    
    // Use direct HTTP request instead of Puppeteer
    const html = await fetchSourceWithRetry(baseUrl);
    
    console.log("MyGov HTML fetched, length:", html.length);
    
    if (!html || html.length === 0) {
      console.error("Failed to fetch HTML from MyGov");
      return [];
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
        
        // If no URL was found, look for links in other cells
        if (!tenderUrl) {
          for (let i = 0; i < cells.length; i++) {
            const cellUrl = extractLink(cells.eq(i));
            if (cellUrl) {
              tenderUrl = cellUrl;
              break;
            }
          }
        }
        
        // Ensure URL is absolute
        if (tenderUrl && !tenderUrl.startsWith('http')) {
          tenderUrl = tenderUrl.startsWith('/') 
            ? `https://www.mygov.go.ke${tenderUrl}`
            : `https://www.mygov.go.ke/${tenderUrl}`;
        }
        
        // If no URL was found, default to base URL
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
        console.log(`Scraped tender: ${description} | URL: ${tenderUrl}`);
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
          
          // Extract tender URL more thoroughly
          let tenderUrl = "";
          
          // Look for links in any cell
          for (let i = 0; i < cells.length; i++) {
            const cellUrl = extractLink(cells.eq(i));
            if (cellUrl) {
              tenderUrl = cellUrl;
              break;
            }
          }
          
          // If no direct link found, look for onclick attributes that might contain URLs
          if (!tenderUrl) {
            const onclickAttr = $(element).attr('onclick') || '';
            const urlMatch = onclickAttr.match(/window\.location\s*=\s*['"]([^'"]+)['"]/);
            if (urlMatch && urlMatch[1]) {
              tenderUrl = urlMatch[1];
            }
          }
          
          // Ensure URL is absolute
          if (tenderUrl && !tenderUrl.startsWith('http')) {
            tenderUrl = tenderUrl.startsWith('/') 
              ? `https://www.mygov.go.ke${tenderUrl}`
              : `https://www.mygov.go.ke/${tenderUrl}`;
          }
          
          // If no URL was found, default to base URL
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
          console.log(`Scraped tender: ${description} | URL: ${tenderUrl}`);
        } catch (error) {
          console.error("Error processing tender row:", error);
        }
      });
    }
    
    console.log(`MyGov scraping complete. Found ${tenders.length} tenders.`);
    return tenders;
  } catch (error) {
    console.error("Error in scrapeMyGov:", error);
    return [];
  }
}

// Extract tenders from Tenders.go.ke website using direct HTTP requests
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
    
    // Fetch the main tenders page
    const html = await fetchSourceWithRetry('https://tenders.go.ke/website/tenders/index');
    
    // Parse the HTML and extract tenders
    const $ = cheerio.load(html);
    $('table tbody tr').each((index, element) => {
      try {
        const cells = $(element).find('td');
        if (cells.length >= 3) {
          // Extract tender information from table cells
          const title = cells.eq(0).text().trim() || cells.eq(1).text().trim() || "Unknown Tender";
          const organization = cells.length > 2 ? cells.eq(2).text().trim() : "";
          const deadlineText = cells.length > 3 ? cells.eq(3).text().trim() : "";
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
            tender_url: 'https://tenders.go.ke/website/tenders/index',
            location: "Kenya",
            points_required: 0
          };
          
          tenders.push(tender);
          console.log(`Extracted tender from Tenders.go.ke: ${title}`);
        }
      } catch (err) {
        console.error("Error processing tender row:", err);
      }
    });
    
    console.log(`Tenders.go.ke scraping complete. Found ${tenders.length} tenders.`);
    return tenders;
  } catch (error) {
    console.error("Error in scrapeTendersGo:", error);
    return [];
  }
}

// Scrape tenders from private companies via Google search
export async function scrapePrivateTenders(keywords: string[] = [], days = 2): Promise<Tender[]> {
  console.log(`Starting to scrape private sector tenders from the last ${days} days...`);
  const tenders: Tender[] = [];
  
  try {
    // If no keywords provided, use some default industry keywords
    if (!keywords.length) {
      keywords = [
        "construction", "technology", "ict", "telecom", "engineering", 
        "consulting", "energy", "oil", "mining", "healthcare", "education"
      ];
    }
    
    // Create search URLs for different industries
    const searchUrls: string[] = [];
    
    // Generate a search URL for each keyword
    for (const keyword of keywords) {
      const url = generateTenderSearchUrl([keyword], days);
      searchUrls.push(url);
    }
    
    console.log(`Created ${searchUrls.length} search URLs for private sector tenders`);
    
    // Scrape the first few search results for each URL
    for (const url of searchUrls.slice(0, 3)) { // Limit to first 3 searches to avoid rate limiting
      try {
        console.log(`Searching for private tenders with URL: ${url}`);
        
        // Use direct HTTP request instead of Puppeteer
        const html = await fetchSourceWithRetry(url);
        
        if (html && html.length > 0) {
          console.log(`Google search results fetched, length: ${html.length}`);
          
          // Parse the HTML and extract search results
          const $ = cheerio.load(html);
          
          // Extract search results
          $('.g').each((index, element) => {
            try {
              // Limit to first 5 results per search
              if (index >= 5) return;
              
              const titleElement = $(element).find('h3').first();
              const linkElement = $(element).find('a').first();
              const snippetElement = $(element).find('.VwiC3b, .s3v9rd').first(); // Multiple potential selectors
              
              const title = titleElement.text().trim();
              const link = linkElement.attr('href') || "";
              const snippet = snippetElement.text().trim();
              
              // Check if the result has a date within the last 48 hours
              const dateMatch = snippet.match(/\d{1,2}\s+(hour|day|min|sec)s?\s+ago|today|yesterday/i);
              const hasRecentDate = !!dateMatch;
              
              // Only include results that look like tenders and are recent
              if (title && snippet && link && 
                  (title.toLowerCase().includes('tender') || 
                   title.toLowerCase().includes('procurement') || 
                   title.toLowerCase().includes('bid') || 
                   title.toLowerCase().includes('rfp') || 
                   snippet.toLowerCase().includes('tender') || 
                   snippet.toLowerCase().includes('procurement'))) {
                
                // Try to extract a date from the snippet
                const deadlineMatch = snippet.match(/closing date[^\d]*(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{4}|\d{1,2}\s+[a-z]{3,}\s+\d{4})/i);
                const deadlineDate = deadlineMatch ? parseDate(deadlineMatch[1]) : addDays(new Date(), 14);
                
                // Create tender object
                const tender: Tender = {
                  title: title,
                  description: snippet,
                  requirements: "Check the tender document for detailed requirements.",
                  deadline: deadlineDate.toISOString(),
                  contact_info: "Check the tender document for contact information",
                  fees: null,
                  prerequisites: null,
                  category: "Private",
                  subcategory: keywords.find(k => title.toLowerCase().includes(k.toLowerCase())) || null,
                  tender_url: link,
                  location: "Kenya", // Default to Kenya but could be extracted
                  points_required: 0
                };
                
                tenders.push(tender);
                console.log(`Extracted private tender: ${title} | URL: ${link}`);
              }
            } catch (error) {
              console.error("Error processing search result:", error);
            }
          });
        }
        
        // Add a short delay between searches to avoid triggering anti-scraping measures
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error searching URL ${url}:`, error);
      }
    }
    
    console.log(`Private sector tenders scraping complete. Found ${tenders.length} tenders.`);
    return tenders;
  } catch (error) {
    console.error("Error in scrapePrivateTenders:", error);
    return [];
  }
}

// Main function to run all the scrapers
async function main() {
  console.log("\n=== Starting Kenya Tender Finder Scraper ===\n");
  
  try {
    console.log("\n=== Scraping MyGov Tenders ===\n");
    const myGovTenders = await scrapeMyGov();
    console.log(`Found ${myGovTenders.length} tenders from MyGov`);
    
    console.log("\n=== Scraping Tenders.go.ke Tenders ===\n");
    const tendersGoTenders = await scrapeTendersGo();
    console.log(`Found ${tendersGoTenders.length} tenders from Tenders.go.ke`);
    
    console.log("\n=== Scraping Private Sector Tenders (last 48 hours) ===\n");
    const privateTenders = await scrapePrivateTenders([], 2); // 2 days = 48 hours
    console.log(`Found ${privateTenders.length} private sector tenders`);
    
    // Combine all results
    const allTenders = [...myGovTenders, ...tendersGoTenders, ...privateTenders];
    console.log(`\n=== Scraping Complete: Found ${allTenders.length} tenders in total ===\n`);
    
    // Print the first few tenders as a preview
    if (allTenders.length > 0) {
      console.log("\n=== Sample Tenders Preview ===\n");
      allTenders.slice(0, 3).forEach((tender, index) => {
        console.log(`Tender #${index + 1}:`);
        console.log(`- Title: ${tender.title}`);
        console.log(`- Deadline: ${tender.deadline}`);
        console.log(`- Category: ${tender.category}`);
        console.log(`- URL: ${tender.tender_url}`);
        console.log("---");
      });
    }
    
    // Here you would typically save the results to a database
    // For now, we'll just return them
    return allTenders;
  } catch (error) {
    console.error("Error running scrapers:", error);
    return [];
  }
}

// Run the main function when this script is executed directly
if (import.meta.main) {
  main();
}
