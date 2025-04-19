import { subDays } from "https://esm.sh/date-fns@2.30.0";
import { fetchSourceWithRetry, parseDate, fetchMyGovContent } from "./utils.ts";
import type { Tender } from "./types.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

// Extract tenders from MyGov website
export async function scrapeMyGov(): Promise<Tender[]> {
  console.log("Starting to scrape MyGov tenders...");
  const tenders: Tender[] = [];
  
  try {
    const html = await fetchMyGovContent();
    if (!html) {
      throw new Error("Could not fetch MyGov content");
    }

    const $ = cheerio.load(html);
    
    // Find all tender elements in the table
    $('tr').each((_index, element) => {
      try {
        const cells = $(element).find('td');
        
        if (cells.length >= 2) {
          const title = cells.eq(0).text().trim();
          const ministry = cells.eq(1).text().trim();
          const closingDate = cells.eq(3).text().trim();
          const pdfLink = cells.find('a[href$=".pdf"]').attr('href');

          // Skip header rows or empty rows
          if (!title || title.toLowerCase() === 'title' || title.toLowerCase() === 'header') {
            return;
          }

          // Parse the closing date and ensure it's valid
          const deadline = parseDate(closingDate);

          // Only add tenders that haven't expired
          if (deadline >= new Date()) {
            const tender: Tender = {
              title,
              description: `Procuring Entity: ${ministry}`,
              deadline: deadline.toISOString(),
              contact_info: ministry || "See tender document for contact details",
              category: "Government",
              location: "Kenya",
              tender_url: pdfLink ? (pdfLink.startsWith('http') ? pdfLink : `https://www.mygov.go.ke${pdfLink.startsWith('/') ? '' : '/'}${pdfLink}`) : undefined,
              requirements: "See tender document for detailed requirements",
              fees: null,
              prerequisites: null,
              points_required: 0
            };

            tenders.push(tender);
            console.log(`Found tender: ${title} (Deadline: ${deadline.toISOString()})`);
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error processing tender row:", errorMessage);
      }
    });

    console.log(`MyGov scraping complete. Found ${tenders.length} tenders.`);
    return tenders;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in scrapeMyGov:", errorMessage);
    return [];
  }
}

// Extract tenders from Tenders.go.ke website
export async function scrapeTendersGo(): Promise<Tender[]> {
  console.log("Starting to scrape Tenders.go.ke...");
  const tenders: Tender[] = [];
  
  try {
    // Now fetch the tenders page
    const html = await fetchSourceWithRetry('http://tenders.go.ke/website/tenders/index');
    console.log(`Initial HTML fetched, length: ${html.length}`);

    // Parse the HTML to find tender listings directly
    const $ = cheerio.load(html);
    
    $('.tender-item, .tender_item, .tenders-list > div, tr').each((_index, element) => {
      try {
        const $el = $(element);
        
        // Extract tender details
        const title = $el.find('.title, h3, td:first-child').first().text().trim();
        const organization = $el.find('.organization, td:nth-child(2)').first().text().trim();
        const deadlineText = $el.find('.deadline, td:nth-child(4)').first().text().trim();
        const pdfLink = $el.find('a[href$=".pdf"]').attr('href');

        // Skip empty or header rows
        if (!title || title.toLowerCase() === 'title' || title.toLowerCase() === 'header') {
          return;
        }

        // Parse deadline and ensure it's valid
        const deadline = parseDate(deadlineText);

        // Create tender object
        const tender: Tender = {
          title,
          description: `Procuring Entity: ${organization}`,
          deadline: deadline.toISOString(),
          contact_info: organization || "See tender document for contact details",
          category: "Government",
          location: "Kenya",
          tender_url: pdfLink ? (pdfLink.startsWith('http') ? pdfLink : `http://tenders.go.ke${pdfLink.startsWith('/') ? '' : '/'}${pdfLink}`) : undefined,
          requirements: "See tender document for detailed requirements",
          fees: null,
          prerequisites: null,
          points_required: 0
        };

        tenders.push(tender);
        console.log(`Found tender: ${title} (Deadline: ${deadline.toISOString()})`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error processing tender row:", errorMessage);
      }
    });

    console.log(`Tenders.go.ke scraping complete. Found ${tenders.length} tenders.`);
    return tenders;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error scraping Tenders.go.ke:", errorMessage);
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
      console.log(`- URL: ${tender.tender_url}`);
      console.log("---");
    });
  }

  return allTenders;
}

// Run the main function when this script is executed directly
if (import.meta.main) {
  main();
}
