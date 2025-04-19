import { format, addDays, subDays } from "https://esm.sh/date-fns@2.30.0";
import { fetchSourceWithRetry, parseDate, adaptiveSelect, extractKeywords } from "./utils.ts";
import type { Tender } from "./types.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

interface TenderCandidate {
  title: string;
  description: string;
  deadlineText: string;
  url: string;
  confidence: number;
}

// Extract tenders using adaptive scraping
async function extractTendersAdaptively(html: string, baseUrl: string): Promise<TenderCandidate[]> {
  const candidates: TenderCandidate[] = [];
  
  console.log("\nAnalyzing page content:");
  console.log("- Document length:", html.length);
  console.log("- Contains tender keywords:", /tender|procurement|bid/i.test(html));
  
  // Load with cheerio for additional pattern matching
  const $ = cheerio.load(html);
  
  // Try multiple selector patterns
  const selectors = [
    // Standard patterns
    'table tr td', '.tender-item', '.card', '.listing',
    // Text-based patterns
    'div:contains("tender"), div:contains("Tender")',
    'p:contains("tender"), p:contains("Tender")',
    // Table-based patterns
    'tr:has(td:contains("tender")), tr:has(td:contains("Tender"))',
    // Link-based patterns
    'a[href*="tender"], a[href*="procurement"]'
  ];
  
  for (const selector of selectors) {
    console.log(`\nTrying selector: ${selector}`);
    $(selector).each((_, element) => {
      try {
        const $el = $(element);
        const text = $el.text().trim();
        
        // Skip if too short
        if (text.length < 20) return;
        
        // Look for title-like content
        const potentialTitle = $el.find('h1, h2, h3, h4, strong, b').first().text().trim() || 
                             text.split('\n')[0].trim();
        
        if (potentialTitle) {
          console.log(`Found potential tender title: "${potentialTitle.substring(0, 50)}..."`);
          
          // Look for deadline nearby
          const nearbyText = $el.parent().text();
          const deadlineMatch = nearbyText.match(/closing.*?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})|(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
          const deadlineText = deadlineMatch ? deadlineMatch[0] : '';
          
          // Calculate confidence
          const confidence = calculateConfidence(potentialTitle, text, deadlineText);
          console.log(`Confidence score: ${confidence.toFixed(2)}`);
          
          if (confidence > 0.4) { // Lower threshold for initial candidates
            candidates.push({
              title: potentialTitle,
              description: text,
              deadlineText,
              url: baseUrl,
              confidence
            });
            console.log("✓ Added as candidate");
          }
        }
      } catch (error) {
        console.error('Error processing element:', error);
      }
    });
  }
  
  console.log(`\nExtraction complete. Found ${candidates.length} potential tender candidates`);
  return candidates;
}

// Calculate confidence score for a tender candidate
function calculateConfidence(title: string, description: string, deadline: string): number {
  let score = 0;
  
  // Check title quality (more lenient)
  if (title.length > 5) score += 0.2;
  if (/tender|bid|procurement|contract|supply|provision|rfp|eoi/i.test(title)) score += 0.3;
  if (/\d{4}|\bKES\b|\bUSD\b/i.test(title)) score += 0.1; // Contains year or currency
  
  // Check description quality (more lenient)
  if (description.length > 30) score += 0.2;
  if (/requirements|specification|scope|detail/i.test(description)) score += 0.1;
  
  // Check deadline quality (more lenient)
  if (deadline) {
    score += 0.1; // Some deadline text exists
    if (parseDate(deadline)) score += 0.2; // Parseable date
    if (/closing|submission|deadline/i.test(deadline)) score += 0.1; // Contains deadline-related terms
  }
  
  return score;
}

// Extract tenders from MyGov website using adaptive scraping
export async function scrapeMyGov(): Promise<Tender[]> {
  console.log("Starting adaptive scraping of MyGov tenders...");
  const tenders: Tender[] = [];
  
  try {
    const html = await fetchSourceWithRetry("https://www.mygov.go.ke/tenders");
    console.log("MyGov HTML fetched, length:", html.length);
    
    if (!html || html.length === 0) {
      throw new Error("Failed to fetch HTML from MyGov");
    }
    
    // Extract tender candidates using adaptive scraping
    const candidates = await extractTendersAdaptively(html, "https://www.mygov.go.ke/tenders");
    
    // Convert high-confidence candidates to tenders
    for (const candidate of candidates) {
      if (candidate.confidence >= 0.7) { // Higher threshold for final inclusion
        const deadlineDate = parseDate(candidate.deadlineText);
        
        tenders.push({
          title: candidate.title,
          description: candidate.description,
          deadline: deadlineDate.toISOString(),
          contact_info: "See tender document for contact information",
          category: "Government",
          location: "Kenya",
          tender_url: candidate.url,
          requirements: "See tender document for detailed requirements",
          points_required: 0
        });
      }
    }
    
    console.log(`MyGov adaptive scraping complete. Found ${tenders.length} high-confidence tenders.`);
    return tenders;
  } catch (error) {
    console.error("Error in scrapeMyGov:", error);
    return [];
  }
}

// Extract tenders from Tenders.go.ke website using adaptive scraping
export async function scrapeTendersGo(): Promise<Tender[]> {
  console.log("Starting adaptive scraping of Tenders.go.ke...");
  const tenders: Tender[] = [];
  
  try {
    const html = await fetchSourceWithRetry("https://tenders.go.ke/website/tenders/index");
    console.log("Tenders.go.ke HTML fetched, length:", html.length);
    
    if (!html || html.length === 0) {
      throw new Error("Failed to fetch HTML from Tenders.go.ke");
    }
    
    // Extract tender candidates using adaptive scraping
    const candidates = await extractTendersAdaptively(html, "https://tenders.go.ke/website/tenders/index");
    
    // Convert high-confidence candidates to tenders
    for (const candidate of candidates) {
      if (candidate.confidence >= 0.7) {
        const deadlineDate = parseDate(candidate.deadlineText);
        
        tenders.push({
          title: candidate.title,
          description: candidate.description,
          deadline: deadlineDate.toISOString(),
          contact_info: "See tender document for contact information",
          category: "Government",
          location: "Kenya",
          tender_url: candidate.url,
          requirements: "See tender document for detailed requirements",
          points_required: 0
        });
      }
    }
    
    console.log(`Tenders.go.ke adaptive scraping complete. Found ${tenders.length} high-confidence tenders.`);
    return tenders;
  } catch (error) {
    console.error("Error in scrapeTendersGo:", error);
    return [];
  }
}

// Function to scrape private sector tenders
export async function scrapePrivateTenders(existingTenders: Tender[] = [], daysBack = 2): Promise<Tender[]> {
  console.log(`Scraping private sector tenders from last ${daysBack} days...`);
  const tenders: Tender[] = [];

  const sources = [
    {
      url: 'https://tenderskenya.com',
      selector: '.tender-listing',
      category: 'Private',
      location: 'Kenya'
    },
    {
      url: 'https://tenders.africa',
      selector: '.tender-item',
      category: 'Private',
      location: 'Kenya'
    }
  ];

  for (const source of sources) {
    try {
      console.log(`Attempting to fetch from ${source.url}...`);
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch from ${source.url}: ${response.status}`);
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      $(source.selector).each((_index, element) => {
        try {
          const $el = $(element);
          const title = $el.find('h3, .title').first().text().trim();
          const description = $el.find('.description, p').first().text().trim();
          const deadlineText = $el.find('.deadline, .date').first().text().trim();
          const organization = $el.find('.company, .organization').first().text().trim();
          const tenderUrl = $el.find('a').attr('href');

          if (!title || !deadlineText) {
            console.log(`Skipping tender - missing required fields (title: ${!!title}, deadline: ${!!deadlineText})`);
            return;
          }

          // Parse deadline and ensure it's valid
          const deadline = parseDate(deadlineText);
          const cutoffDate = subDays(new Date(), daysBack);
          
          if (deadline >= cutoffDate) {
            const tender: Tender = {
              title,
              description: description || title,
              deadline: deadline.toISOString(),
              contact_info: organization || 'Contact via tender document',
              category: source.category,
              location: source.location,
              tender_url: tenderUrl ? (tenderUrl.startsWith('http') ? tenderUrl : `${source.url}${tenderUrl.startsWith('/') ? '' : '/'}${tenderUrl}`) : undefined,
              requirements: 'See tender document for requirements',
              fees: null,
              prerequisites: null,
              points_required: 0
            };

            // Don't add if we already have this tender
            const isDuplicate = existingTenders.some(existing => 
              existing.tender_url === tender.tender_url || 
              existing.title === tender.title
            );

            if (!isDuplicate) {
              tenders.push(tender);
              console.log(`Found new tender: ${title} (Deadline: ${deadline.toISOString()})`);
            } else {
              console.log(`Skipping duplicate tender: ${title}`);
            }
          } else {
            console.log(`Skipping old tender: ${title} (Deadline: ${deadline.toISOString()})`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error processing private tender:', errorMessage);
        }
      });

      console.log(`Processed ${source.url} - found ${tenders.length} valid tenders`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error scraping ${source.url}:`, errorMessage);
    }
  }

  console.log(`Found ${tenders.length} private sector tenders from the last ${daysBack} days`);
  return tenders;
}

// Main function to run all scrapers and gather tenders
export async function main() {
  console.log("\n=== Starting Kenya Tender Finder Scraper (Adaptive Version) ===\n");
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

  // Scrape private sector tenders (last 48 hours)
  console.log("\n=== Scraping Private Sector Tenders (last 48 hours) ===\n");
  const privateTenders = await scrapePrivateTenders([], 2); // 2 days = 48 hours
  console.log(`Found ${privateTenders.length} private sector tenders`);
  allTenders = [...allTenders, ...privateTenders];

  // Display results
  console.log(`\n=== Scraping Complete: Found ${allTenders.length} tenders in total ===\n`);
  
  if (allTenders.length > 0) {
    console.log("\n=== Sample Tenders Preview ===\n");
    allTenders.slice(0, 3).forEach((tender, index) => {
      console.log(`Tender #${index + 1}:`);
      console.log(`- Title: ${tender.title}`);
      console.log(`- Deadline: ${tender.deadline}`);
      console.log(`- Confidence: High`);
      console.log("---");
    });
  }

  return allTenders;
}

// Run the main function when this script is executed directly
if (import.meta.main) {
  main();
}
