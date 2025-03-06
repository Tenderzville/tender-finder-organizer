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
    
    // The website has been modernized and now uses a different structure
    // First, let's try to fetch the main HTML page
    const html = await fetchSourceWithRetry('https://tenders.go.ke/website/tenders/index');
    console.log(`Initial HTML fetched, length: ${html.length}`);
    
    // Tenders.go.ke is a single-page application that loads data dynamically
    // Let's try multiple possible API endpoints that might contain tender data
    const possibleApiEndpoints = [
      'https://tenders.go.ke/api/tenders',
      'https://tenders.go.ke/website/api/tenders',
      'https://tenders.go.ke/api/v1/tenders',
      'https://tenders.go.ke/api/public/tenders',
      'https://tenders.go.ke/website/tenders/api/list',
      'https://tenders.go.ke/website/tenders/data',
      'https://tenders.go.ke/tenders.json'
    ];
    
    // Check if we can find any script URLs in the HTML that might provide clues
    const scriptMatches = html.match(/<script[^>]*src="([^"]*)"/g);
    if (scriptMatches) {
      console.log("Found script tags that might load data:");
      for (const scriptTag of scriptMatches) {
        const srcMatch = scriptTag.match(/src="([^"]*)"/); 
        if (srcMatch && srcMatch[1]) {
          const scriptUrl = srcMatch[1].startsWith('http') 
            ? srcMatch[1] 
            : `https://tenders.go.ke${scriptUrl.startsWith('/') ? '' : '/'}${srcMatch[1]}`;
          
          console.log(`Checking script at: ${scriptUrl}`);
          try {
            // Fetch the script content
            const scriptContent = await fetchSourceWithRetry(scriptUrl);
            
            // Look for API endpoints in script
            const apiEndpointMatches = scriptContent.match(/(\/api\/[^\s'"]+)/g);
            if (apiEndpointMatches) {
              console.log(`Found ${apiEndpointMatches.length} potential API endpoints in script`);
              
              // Add these endpoints to our list to try
              for (const endpoint of apiEndpointMatches) {
                const fullEndpoint = `https://tenders.go.ke${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
                if (!possibleApiEndpoints.includes(fullEndpoint)) {
                  possibleApiEndpoints.push(fullEndpoint);
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching script ${scriptUrl}:`, error.message);
          }
        }
      }
    }
    
    console.log(`Trying ${possibleApiEndpoints.length} possible API endpoints for tender data`);
    
    // Try each potential API endpoint
    for (const apiUrl of possibleApiEndpoints) {
      try {
        console.log(`Trying endpoint: ${apiUrl}`);
        const apiResponse = await fetchSourceWithRetry(apiUrl, undefined, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          }
        });
        
        // Check if the response looks like JSON
        if (apiResponse && (apiResponse.startsWith('{') || apiResponse.startsWith('['))) {
          try {
            const tenderData = JSON.parse(apiResponse);
            const dataArray = Array.isArray(tenderData) ? tenderData : 
                              tenderData.data ? tenderData.data : 
                              tenderData.tenders ? tenderData.tenders : 
                              tenderData.results ? tenderData.results : null;
            
            if (dataArray && Array.isArray(dataArray) && dataArray.length > 0) {
              console.log(`Found ${dataArray.length} tenders at endpoint: ${apiUrl}`);
              
              // Process the tender data from the API
              dataArray.forEach((item: any) => {
                try {
                  // Extract tender details based on common API response structures
                  const title = item.title || item.name || item.tenderTitle || item.subject || 'No Title';
                  const deadline = item.closingDate || item.deadline || item.submissionDate || item.closing_date || new Date().toISOString();
                  const url = item.documentUrl || item.tenderUrl || item.url || item.document_url || '';
                  const description = item.description || item.details || item.summary || title;
                  
                  tenders.push({
                    title,
                    description,
                    deadline: new Date(deadline).toISOString(),
                    category: 'Government',
                    url,
                    source: 'tenders.go.ke'
                  });
                } catch (error) {
                  console.error('Error processing tender item:', error);
                }
              });
              
              // If we found tenders, we can break the loop
              if (tenders.length > 0) {
                console.log(`Successfully extracted ${tenders.length} tenders from ${apiUrl}`);
                break;
              }
            }
          } catch (error) {
            console.error(`Error parsing JSON from ${apiUrl}:`, error.message);
          }
        } else {
          console.log(`Response from ${apiUrl} is not JSON`);
        }
      } catch (error) {
        console.error(`Error fetching from ${apiUrl}:`, error.message);
      }
    }
    
    // If we still don't have any tenders, try alternative approaches
    if (tenders.length === 0) {
      console.log("No tenders found via API endpoints, trying alternative scraping method...");
      
      // Try to find tenders in the HTML directly using modern selectors
      // Many modern sites use div-based layouts instead of tables
      const $ = cheerio.load(html);
      
      // Look for common container patterns used in modern websites
      $('.tender-item, .tender_item, .tenders-list > div, .card, .tender-card').each((index, element) => {
        try {
          const $el = $(element);
          
          // Extract tender details
          const title = $el.find('.title, h2, h3, .tender-title').first().text().trim() ||
                     $el.find('*[class*="title"]').first().text().trim();
                     
          const description = $el.find('.description, p, .tender-description').first().text().trim() ||
                           title;
                           
          const deadlineText = $el.find('.deadline, .date, .closing-date, .tender-date').first().text().trim() ||
                           $el.find('*[class*="date"]').first().text().trim() ||
                           '';
                           
          const url = $el.find('a').attr('href') ||
                   $el.find('a[class*="download"]').attr('href') ||
                   $el.find('a[class*="detail"]').attr('href') ||
                   '';
          
          // Process the deadline text to extract a date
          let deadline = new Date();
          if (deadlineText) {
            const dateMatch = deadlineText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
            if (dateMatch) {
              try {
                deadline = parseDate(dateMatch[0]);
              } catch (e) {
                console.error(`Could not parse date from ${deadlineText}:`, e);
              }
            }
          }
          
          // Only add if we have a title
          if (title && title.length > 0) {
            tenders.push({
              title,
              description,
              deadline: deadline.toISOString(),
              category: 'Government',
              url: url ? (url.startsWith('http') ? url : `https://tenders.go.ke${url.startsWith('/') ? '' : '/'}${url}`) : '',
              source: 'tenders.go.ke'
            });
          }
        } catch (error) {
          console.error('Error processing tender element:', error);
        }
      });
    }
    
    // If still no tenders found, add a note for future improvement
    if (tenders.length === 0) {
      console.log("Could not find any tenders. This website may require a headless browser approach in the future.");
    }
    
    console.log(`Tenders.go.ke scraping complete. Found ${tenders.length} tenders.`);
    return tenders;
  } catch (error) {
    console.error("Error scraping Tenders.go.ke:", error);
    return [];
  }
}

// Fallback function to scrape Tenders.go.ke using Puppeteer (headless browser)
export async function scrapeTendersGoPuppeteer(): Promise<Tender[]> {
  console.log("Starting to scrape Tenders.go.ke using Puppeteer...");
  const tenders: Tender[] = [];
  
  try {
    // Import puppeteer dynamically
    const puppeteer = await import('https://deno.land/x/puppeteer@16.2.0/mod.ts');
    
    // Launch a headless browser
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu']
    });
    
    try {
      const page = await browser.newPage();
      
      // Set a realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set viewport
      await page.setViewport({ width: 1280, height: 800 });
      
      // Navigate to tenders.go.ke
      console.log("Navigating to tenders.go.ke...");
      await page.goto('https://tenders.go.ke/website/tenders/index', { 
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Wait for content to load - adjust the selector based on actual page structure
      console.log("Waiting for tender content to load...");
      await page.waitForSelector('.tender-card, .tender-item, .card, table tbody tr', { 
        timeout: 30000,
        visible: true 
      }).catch(() => console.log("Timeout waiting for tender items, proceeding anyway"));
      
      // Gather all network requests to find API calls
      const apiRequests: string[] = [];
      page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') && request.method() === 'GET') {
          apiRequests.push(url);
          console.log(`Detected API request: ${url}`);
        }
      });
      
      // Give some time for all content to load and APIs to be called
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // If we detected API calls, try to fetch directly from those
      if (apiRequests.length > 0) {
        console.log(`Found ${apiRequests.length} potential API endpoints`);
        
        // Try each API endpoint
        for (const apiUrl of apiRequests) {
          try {
            const response = await fetch(apiUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log(`Successfully fetched data from ${apiUrl}`);
              
              // Process API data to extract tenders
              const dataArray = Array.isArray(data) ? data : 
                              data.data ? data.data : 
                              data.tenders ? data.tenders : 
                              data.results ? data.results : null;
                              
              if (dataArray && Array.isArray(dataArray) && dataArray.length > 0) {
                console.log(`Found ${dataArray.length} tenders in API response`);
                
                dataArray.forEach((item: any) => {
                  try {
                    const title = item.title || item.name || item.tenderTitle || item.subject || '';
                    const deadline = item.closingDate || item.deadline || item.submissionDate || item.closing_date || new Date().toISOString();
                    const url = item.documentUrl || item.tenderUrl || item.url || item.document_url || '';
                    const description = item.description || item.details || item.summary || title;
                    
                    if (title) {
                      tenders.push({
                        title,
                        description,
                        deadline: new Date(deadline).toISOString(),
                        category: 'Government',
                        url,
                        source: 'tenders.go.ke'
                      });
                    }
                  } catch (error) {
                    console.error('Error processing API tender item:', error);
                  }
                });
                
                // If we found tenders, we can break
                if (tenders.length > 0) break;
              }
            }
          } catch (error) {
            console.error(`Error fetching from API ${apiUrl}:`, error);
          }
        }
      }
      
      // If we haven't found tenders from API calls, extract from the page HTML
      if (tenders.length === 0) {
        console.log("Extracting tenders directly from page HTML...");
        
        // Get the HTML content of the page
        const pageHTML = await page.content();
        
        // Use Cheerio to parse the HTML
        const $ = cheerio.load(pageHTML);
        
        // Try different selectors to find tender items
        $('.tender-item, .tender_item, .tenders-list > div, .card, .tender-card, table tr').each((index, element) => {
          try {
            const $el = $(element);
            
            // Extract tender details
            const title = $el.find('.title, h2, h3, .tender-title, a').first().text().trim() ||
                       $el.find('*[class*="title"]').first().text().trim();
                       
            const description = $el.find('.description, p, .tender-description').first().text().trim() ||
                             title;
                             
            const deadlineText = $el.find('.deadline, .date, .closing-date, .tender-date').first().text().trim() ||
                             $el.find('*[class*="date"]').first().text().trim() ||
                             '';
                             
            const url = $el.find('a').attr('href') ||
                     $el.find('a[class*="download"]').attr('href') ||
                     $el.find('a[class*="detail"]').attr('href') ||
                     '';
            
            // Process the deadline text to extract a date
            let deadline = new Date();
            if (deadlineText) {
              const dateMatch = deadlineText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
              if (dateMatch) {
                try {
                  deadline = parseDate(dateMatch[0]);
                } catch (e) {
                  console.error(`Could not parse date from ${deadlineText}:`, e);
                }
              }
            }
            
            // Only add if we have a title
            if (title && title.length > 0) {
              tenders.push({
                title,
                description,
                deadline: deadline.toISOString(),
                category: 'Government',
                url: url ? (url.startsWith('http') ? url : `https://tenders.go.ke${url.startsWith('/') ? '' : '/'}${url}`) : '',
                source: 'tenders.go.ke'
              });
            }
          } catch (error) {
            console.error('Error processing HTML tender element:', error);
          }
        });
      }
      
      console.log(`Extracted ${tenders.length} tenders using Puppeteer`);       
    } finally {
      // Close the browser
      await browser.close();
      console.log("Headless browser closed");
    }
  } catch (error) {
    console.error("Error using Puppeteer for scraping:", error);
    console.log("Note: To use this feature, install Puppeteer with 'deno install -A -r https://deno.land/x/puppeteer/install.ts'");
  }
  
  console.log(`Tenders.go.ke Puppeteer scraping complete. Found ${tenders.length} tenders.`);
  return tenders;
}

// Check if Puppeteer is available
async function checkPuppeteerAvailable(): Promise<boolean> {
  try {
    await import('https://deno.land/x/puppeteer@16.2.0/mod.ts');
    return true;
  } catch {
    return false;
  }
}

// Main function to run all scrapers and gather tenders
export async function main() {
  console.log("\n=== Starting Kenya Tender Finder Scraper ===\n");
  let allTenders: Tender[] = [];

  // Scrape MyGov tenders
  console.log("\n=== Scraping MyGov Tenders ===\n");
  const myGovTenders = await scrapeMyGov();
  console.log(`Found ${myGovTenders.length} tenders from MyGov`);
  allTenders = [...allTenders, ...myGovTenders];

  // Scrape Tenders.go.ke
  console.log("\n=== Scraping Tenders.go.ke ===\n");
  const tendersGoTenders = await scrapeTendersGo();
  console.log(`Found ${tendersGoTenders.length} tenders from Tenders.go.ke`);
  allTenders = [...allTenders, ...tendersGoTenders];
  
  // If regular scraping of Tenders.go.ke didn't work, try with puppeteer if available
  if (tendersGoTenders.length === 0) {
    console.log("\n=== Attempting Puppeteer Fallback for Tenders.go.ke ===\n");
    try {
      // Check if puppeteer is available by importing dynamically
      const puppeteerAvailable = await checkPuppeteerAvailable();
      
      if (puppeteerAvailable) {
        console.log("Puppeteer is available, using headless browser approach");
        const puppeteerTenders = await scrapeTendersGoPuppeteer();
        console.log(`Found ${puppeteerTenders.length} tenders using Puppeteer approach`);
        allTenders = [...allTenders, ...puppeteerTenders];
      } else {
        console.log("Puppeteer is not available. Install it to enable headless browser scraping for complex sites.");
      }
    } catch (error) {
      console.error("Error with Puppeteer fallback:", error);
    }
  }

  // Scrape private sector tenders (last 48 hours)
  console.log("\n=== Scraping Private Sector Tenders (last 48 hours) ===\n");
  const privateTenders = await scrapePrivateTenders([], 2); // 2 days = 48 hours
  console.log(`Found ${privateTenders.length} private sector tenders`);
  allTenders = [...allTenders, ...privateTenders];

  // Display results
  console.log(`\n=== Scraping Complete: Found ${allTenders.length} tenders in total ===\n`);
  
  // Show sample of tenders
  if (allTenders.length > 0) {
    console.log("\n=== Sample Tenders Preview ===\n");
    allTenders.slice(0, 3).forEach((tender, index) => {
      console.log(`Tender #${index + 1}:`);
      console.log(`- Title: ${tender.title}`);
      console.log(`- Deadline: ${tender.deadline}`);
      console.log(`- Category: ${tender.category}`);
      console.log(`- URL: ${tender.url}`);
      console.log("---");
    });
  }

  return allTenders;
}

// Run the main function when this script is executed directly
if (import.meta.main) {
  main();
}
