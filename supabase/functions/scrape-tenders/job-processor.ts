
import { format, addDays } from "https://esm.sh/date-fns@2.30.0";
import { fetchSourceWithRetry, parseDate } from "./utils.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import type { Tender } from "./types.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

// Process a specific job
export async function processJob(supabase: any, job: any) {
  console.log(`Processing job: ${job.source} - ${job.url}`);
  
  try {
    // Mark job as processing
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    // Process based on source
    let tenders: Tender[] = [];
    
    if (job.source === 'mygov') {
      tenders = await scrapeMyGov(job.url);
    } else if (job.source === 'tenders.go.ke') {
      tenders = await scrapeTendersGo(job.url);
    } else {
      throw new Error(`Unknown source: ${job.source}`);
    }
    
    console.log(`Found ${tenders.length} tenders from ${job.source}`);
    
    // Save results
    if (tenders.length > 0) {
      // First save to results table
      for (const tender of tenders) {
        await supabase
          .from('scraping_results')
          .insert({
            job_id: job.id,
            tender_data: tender
          });
      }
      
      // Then process and save to tenders table
      let insertedCount = 0;
      for (const tender of tenders) {
        try {
          // Check if tender already exists by URL or title
          const { data: existingTenders } = await supabase
            .from("tenders")
            .select("id")
            .or(`title.eq."${tender.title}",tender_url.eq."${tender.tender_url}"`)
            .limit(1);
          
          if (existingTenders && existingTenders.length > 0) {
            console.log(`Tender already exists: ${tender.title}`);
            continue;
          }
          
          // Determine affirmative action status based on content analysis
          let affirmativeAction = null;
          const lowerTitle = tender.title.toLowerCase();
          const lowerDesc = (tender.description || "").toLowerCase();
          
          if (
            lowerTitle.includes("youth") || 
            lowerDesc.includes("youth") || 
            lowerTitle.includes("agpo") || 
            lowerDesc.includes("agpo")
          ) {
            affirmativeAction = { 
              type: "youth", 
              percentage: 30,
              details: "30% procurement preference for youth-owned businesses"
            };
          } else if (
            lowerTitle.includes("women") || 
            lowerDesc.includes("women")
          ) {
            affirmativeAction = {
              type: "women",
              percentage: 30,
              details: "30% procurement preference for women-owned businesses"
            };
          } else if (
            lowerTitle.includes("pwd") || 
            lowerDesc.includes("pwd") || 
            lowerTitle.includes("persons with disabilities") || 
            lowerDesc.includes("persons with disabilities")
          ) {
            affirmativeAction = {
              type: "pwds",
              percentage: 30,
              details: "30% procurement preference for businesses owned by persons with disabilities"
            };
          } else {
            affirmativeAction = { type: "none" };
          }
          
          // Generate a deadline 14-30 days in the future if not specified
          const deadline = tender.deadline ? new Date(tender.deadline) : addDays(new Date(), 14 + Math.floor(Math.random() * 16));
          
          // Insert the tender with affirmative action info
          const { error: insertError } = await supabase
            .from("tenders")
            .insert({
              ...tender,
              deadline,
              category: tender.category || "Government",
              affirmative_action: affirmativeAction
            });
          
          if (insertError) {
            console.error(`Error inserting tender "${tender.title}":`, insertError);
            continue;
          }
          
          insertedCount++;
        } catch (err) {
          console.error(`Error processing tender "${tender.title}":`, err);
        }
      }
      
      console.log(`Inserted ${insertedCount} new tenders from ${job.source}`);
    }
    
    // Mark job as complete
    await supabase.rpc('complete_scraping_job', {
      p_job_id: job.id,
      p_status: 'completed'
    });
    
    return tenders.length;
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);
    
    // Mark job as failed
    await supabase.rpc('complete_scraping_job', {
      p_job_id: job.id,
      p_status: 'failed',
      p_error_message: error.message || 'Unknown error'
    });
    
    throw error;
  }
}

// Process the next job in the queue
export async function processNextJob(supabase: any) {
  console.log("Getting next job from queue");
  
  const { data: nextJob, error } = await supabase.rpc('get_next_scraping_job');
  
  if (error) {
    console.error("Error getting next job:", error);
    throw error;
  }
  
  if (!nextJob || nextJob.length === 0) {
    console.log("No pending jobs found");
    return 0;
  }
  
  const job = nextJob[0];
  console.log(`Found job: ${job.source} - ${job.url}`);
  
  return await processJob(supabase, job);
}

// Extract tenders from MyGov website
async function scrapeMyGov(url: string): Promise<Tender[]> {
  console.log("Starting to scrape MyGov tenders...");
  const tenders: Tender[] = [];
  
  try {
    // Fetch the main tenders page
    const baseUrl = url || "https://www.mygov.go.ke/all-tenders";
    
    // Use direct HTTP request with enhanced headers
    const html = await fetchSourceWithRetry(baseUrl, undefined, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    console.log("MyGov HTML fetched, length:", html.length);
    
    if (!html || html.length === 0) {
      console.error("Failed to fetch HTML from MyGov");
      return [];
    }
    
    // Using Cheerio to parse HTML
    const $ = cheerio.load(html);
    
    // Extract tenders from the table - first try with modern DOM parser
    try {
      const parser = new DOMParser();
      const document = parser.parseFromString(html, "text/html");
      
      if (document) {
        // Try to get tables using DOM API first
        const tables = document.querySelectorAll("table");
        console.log(`Found ${tables.length} tables using DOM parser`);
        
        if (tables.length > 0) {
          for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            const rows = table.querySelectorAll("tr");
            
            console.log(`Table ${i+1} has ${rows.length} rows`);
            
            // Skip first row (header)
            for (let j = 1; j < rows.length; j++) {
              const row = rows[j];
              const cells = row.querySelectorAll("td");
              
              if (cells.length >= 4) {
                const descriptionText = cells[1]?.textContent?.trim() || '';
                const ministryText = cells[2]?.textContent?.trim() || '';
                const postedDate = cells[3]?.textContent?.trim() || '';
                const deadlineText = cells[4]?.textContent?.trim() || '';
                
                // Extract link if available
                let tenderUrl = '';
                const links = cells[1]?.querySelectorAll('a') || [];
                if (links.length > 0) {
                  tenderUrl = links[0].getAttribute('href') || '';
                }
                
                if (descriptionText) {
                  // Ensure URL is absolute
                  if (tenderUrl && !tenderUrl.startsWith('http')) {
                    tenderUrl = tenderUrl.startsWith('/') 
                      ? `https://www.mygov.go.ke${tenderUrl}`
                      : `https://www.mygov.go.ke/${tenderUrl}`;
                  }
                  
                  // Parse deadline
                  const deadlineDate = parseDate(deadlineText) || addDays(new Date(), 14 + Math.floor(Math.random() * 16));
                  
                  // Create tender object
                  tenders.push({
                    title: descriptionText,
                    description: `Ministry/Department: ${ministryText}. Posted on: ${postedDate}`,
                    requirements: "Please check the tender document for detailed requirements.",
                    deadline: deadlineDate.toISOString(),
                    contact_info: ministryText || "Check tender document for contact information",
                    fees: null,
                    prerequisites: null,
                    category: "Government",
                    subcategory: null,
                    tender_url: tenderUrl || baseUrl,
                    location: "Kenya",
                    points_required: 0
                  });
                }
              }
            }
          }
        }
      }
    } catch (domError) {
      console.error("Error using DOM parser, falling back to Cheerio:", domError);
    }
    
    // If no tenders found yet, try Cheerio parsing
    if (tenders.length === 0) {
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
          let tenderUrl = descriptionCell.find('a').attr('href') || '';
          
          // If no URL was found, look for links in other cells
          if (!tenderUrl) {
            for (let i = 0; i < cells.length; i++) {
              const cellUrl = cells.eq(i).find('a').attr('href');
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
    }
    
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
            const cellUrl = cells.eq(i).find('a').attr('href');
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
async function scrapeTendersGo(url: string): Promise<Tender[]> {
  console.log("Starting to scrape Tenders.go.ke...");
  const tenders: Tender[] = [];
  
  try {
    // The website has been modernized and now uses a different structure
    // First, let's try to fetch the main HTML page
    const baseUrl = url || 'https://tenders.go.ke/website/tenders/index';
    const html = await fetchSourceWithRetry(baseUrl, undefined, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    console.log(`Initial HTML fetched, length: ${html.length}`);
    
    // First, try using the DOM parser for more reliable HTML parsing
    try {
      const parser = new DOMParser();
      const document = parser.parseFromString(html, "text/html");
      
      if (document) {
        // Try to find tables that might contain tenders
        const tables = document.querySelectorAll("table");
        console.log(`Found ${tables.length} tables using DOM parser`);
        
        for (let i = 0; i < tables.length; i++) {
          const table = tables[i];
          // Check if this table looks like it contains tenders
          const headers = table.querySelectorAll("th");
          const headerTexts = Array.from(headers).map(h => h.textContent?.toLowerCase() || "");
          
          // Check if headers contain tender-related terms
          const isTenderTable = headerTexts.some(text => 
            text.includes("tender") || 
            text.includes("description") || 
            text.includes("deadline") || 
            text.includes("reference")
          );
          
          if (isTenderTable) {
            console.log(`Table ${i+1} appears to be a tender table`);
            const rows = table.querySelectorAll("tr");
            
            // Skip the header row
            for (let j = 1; j < rows.length; j++) {
              const row = rows[j];
              const cells = row.querySelectorAll("td");
              
              if (cells.length >= 3) {
                // Extract tender details - adjust these indices based on the actual table structure
                const title = cells[0]?.textContent?.trim() || cells[1]?.textContent?.trim() || "";
                const descriptionCell = cells.length > 1 ? cells[1]?.textContent?.trim() : "";
                const deadlineCell = Array.from(cells).find(cell => 
                  cell.textContent?.includes("/") || 
                  cell.textContent?.includes("-")
                );
                const deadlineText = deadlineCell?.textContent?.trim() || "";
                
                // Extract link
                let tenderUrl = "";
                for (let k = 0; k < cells.length; k++) {
                  const links = cells[k].querySelectorAll("a");
                  if (links.length > 0) {
                    tenderUrl = links[0].getAttribute("href") || "";
                    break;
                  }
                }
                
                // Ensure URL is absolute
                if (tenderUrl && !tenderUrl.startsWith('http')) {
                  tenderUrl = tenderUrl.startsWith('/') 
                    ? `https://tenders.go.ke${tenderUrl}`
                    : `https://tenders.go.ke/${tenderUrl}`;
                }
                
                // Parse deadline
                const deadlineDate = parseDate(deadlineText) || addDays(new Date(), 14 + Math.floor(Math.random() * 16));
                
                if (title) {
                  tenders.push({
                    title,
                    description: descriptionCell || title,
                    requirements: "Please check the tender document for detailed requirements.",
                    deadline: deadlineDate.toISOString(),
                    contact_info: "Check tender document for contact information",
                    fees: null,
                    prerequisites: null,
                    category: "Government",
                    subcategory: null,
                    tender_url: tenderUrl || baseUrl,
                    location: "Kenya",
                    points_required: 0
                  });
                }
              }
            }
          }
        }
      }
    } catch (domError) {
      console.error("Error using DOM parser, falling back to Cheerio:", domError);
    }
    
    // If no tenders found with DOM parser, try Cheerio
    if (tenders.length === 0) {
      // Using Cheerio as a fallback
      const $ = cheerio.load(html);
      
      // Look for common container patterns used in modern websites
      $('.tender-item, .tender_item, .tenders-list > div, .card, .tender-card, table tr').each((index, element) => {
        try {
          const $el = $(element);
          
          // Extract tender details
          const title = $el.find('.title, h2, h3, .tender-title, a').first().text().trim() ||
                      $el.find('*[class*="title"]').first().text().trim() ||
                      $el.find('td').first().text().trim();
                      
          const description = $el.find('.description, p, .tender-description').first().text().trim() ||
                            title;
                            
          const deadlineText = $el.find('.deadline, .date, .closing-date, .tender-date').first().text().trim() ||
                            $el.find('*[class*="date"]').first().text().trim() ||
                            $el.find('td:contains("/")').first().text().trim() ||
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
                const parsedDate = parseDate(dateMatch[0]);
                if (parsedDate) {
                  deadline = parsedDate;
                }
              } catch (e) {
                console.error(`Could not parse date from ${deadlineText}:`, e);
              }
            }
          }
          
          // Only add if we have a title
          if (title && title.length > 0 && !title.toLowerCase().includes("header")) {
            tenders.push({
              title,
              description,
              requirements: "Please check the tender document for detailed requirements.",
              deadline: deadline.toISOString(),
              contact_info: "Check tender document for contact information",
              fees: null,
              prerequisites: null,
              category: "Government",
              subcategory: null,
              tender_url: url ? (url.startsWith('http') ? url : `https://tenders.go.ke${url.startsWith('/') ? '' : '/'}${url}`) : baseUrl,
              location: "Kenya",
              points_required: 0
            });
          }
        } catch (error) {
          console.error('Error processing tender element:', error);
        }
      });
    }
    
    // Deduplicate tenders based on title
    const uniqueTenders: Tender[] = [];
    const titles = new Set();
    
    for (const tender of tenders) {
      if (!titles.has(tender.title)) {
        titles.add(tender.title);
        uniqueTenders.push(tender);
      }
    }
    
    console.log(`Tenders.go.ke scraping complete. Found ${uniqueTenders.length} unique tenders.`);
    return uniqueTenders;
  } catch (error) {
    console.error("Error scraping Tenders.go.ke:", error);
    return [];
  }
}
