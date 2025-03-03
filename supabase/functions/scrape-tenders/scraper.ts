
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import type { Tender } from "./types.ts";

/**
 * Scrapes tenders from mygov.go.ke
 */
export async function scrapeMyGov(): Promise<Partial<Tender>[]> {
  console.log("Starting to scrape MyGov website...");
  try {
    const response = await fetch("https://mygov.go.ke/all-tenders", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch MyGov page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`Fetched MyGov HTML content (${html.length} bytes)`);
    
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      throw new Error("Failed to parse HTML document");
    }
    
    const tenders: Partial<Tender>[] = [];
    const rows = doc.querySelectorAll("#datatable tbody tr");
    
    console.log(`Found ${rows.length} rows in the tenders table`);
    
    rows.forEach((row) => {
      try {
        const noCell = row.querySelector("td.views-field-counter");
        const titleCell = row.querySelector("td.views-field-title");
        const entityCell = row.querySelector("td.views-field-field-ten");
        const documentCell = row.querySelector("td.views-field-field-tender-documents a");
        const closingDateCell = row.querySelector("td.views-field-field-tender-closing-date");
        
        if (!titleCell) {
          console.log("Skipping row without title cell");
          return;
        }
        
        const title = titleCell.textContent.trim();
        const entity = entityCell ? entityCell.textContent.trim() : "Not specified";
        const documentUrl = documentCell ? documentCell.getAttribute("href") : null;
        const closingDateText = closingDateCell ? closingDateCell.textContent.trim() : "";
        
        // Parse closing date
        let deadline = null;
        if (closingDateText) {
          try {
            // Handle various date formats
            const dateParts = closingDateText.split(/[\s\/\-\.]+/);
            if (dateParts.length >= 3) {
              const day = parseInt(dateParts[0], 10);
              const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
              const year = parseInt(dateParts[2], 10);
              deadline = new Date(year, month, day);
            }
          } catch (e) {
            console.error(`Failed to parse date: ${closingDateText}`, e);
          }
        }
        
        // Extract more details from the title
        let category = "Government";
        if (title.toLowerCase().includes("construction")) {
          category = "Construction";
        } else if (title.toLowerCase().includes("supply") || title.toLowerCase().includes("goods")) {
          category = "Supplies";
        } else if (title.toLowerCase().includes("service")) {
          category = "Services";
        } else if (title.toLowerCase().includes("consultancy")) {
          category = "Consultancy";
        }
        
        // Create tender object
        const tender: Partial<Tender> = {
          title,
          contact_info: entity,
          tender_url: documentUrl,
          deadline: deadline ? deadline.toISOString() : null,
          category,
          description: `Tender from ${entity}. Please check the tender document for more details.`,
          location: "Kenya"
        };
        
        tenders.push(tender);
      } catch (err) {
        console.error("Error processing row:", err);
      }
    });
    
    console.log(`Successfully scraped ${tenders.length} tenders from MyGov`);
    return tenders;
  } catch (error) {
    console.error("Error scraping MyGov:", error);
    return [];
  }
}

/**
 * Scrapes tenders from tenders.go.ke
 */
export async function scrapeTendersGo(): Promise<Partial<Tender>[]> {
  console.log("Starting to scrape Tenders.go.ke website...");
  try {
    const response = await fetch("https://tenders.go.ke/tenders", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Tenders.go.ke page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`Fetched Tenders.go.ke HTML content (${html.length} bytes)`);
    
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      throw new Error("Failed to parse HTML document");
    }
    
    const tenders: Partial<Tender>[] = [];
    
    // Adjust selector based on actual page structure
    const tenderItems = doc.querySelectorAll(".tender-item, .tenders-list tr, .tender-listing");
    
    console.log(`Found ${tenderItems.length} tender items on the page`);
    
    tenderItems.forEach((item, index) => {
      try {
        // Adjust these selectors based on the actual structure of the page
        const titleElement = item.querySelector(".tender-title, h3, .title");
        const orgElement = item.querySelector(".organization, .entity, .procuring-entity");
        const deadlineElement = item.querySelector(".deadline, .closing-date, .end-date");
        const linkElement = item.querySelector("a");
        
        if (!titleElement) {
          console.log(`Skipping item ${index} without title element`);
          return;
        }
        
        const title = titleElement.textContent.trim();
        const organization = orgElement ? orgElement.textContent.trim() : "Not specified";
        const deadlineText = deadlineElement ? deadlineElement.textContent.trim() : "";
        const link = linkElement ? linkElement.getAttribute("href") : null;
        
        // Parse deadline
        let deadline = null;
        if (deadlineText) {
          try {
            // Extract date parts from text like "Closing Date: 15/04/2023"
            const dateMatch = deadlineText.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
            if (dateMatch) {
              const day = parseInt(dateMatch[1], 10);
              const month = parseInt(dateMatch[2], 10) - 1; // JS months are 0-indexed
              let year = parseInt(dateMatch[3], 10);
              // Handle 2-digit years
              if (year < 100) {
                year += year < 50 ? 2000 : 1900;
              }
              deadline = new Date(year, month, day);
            }
          } catch (e) {
            console.error(`Failed to parse date: ${deadlineText}`, e);
          }
        }
        
        // Determine category
        let category = "Government";
        if (title.toLowerCase().includes("construction") || title.toLowerCase().includes("build")) {
          category = "Construction";
        } else if (title.toLowerCase().includes("supply") || title.toLowerCase().includes("goods")) {
          category = "Supplies";
        } else if (title.toLowerCase().includes("service")) {
          category = "Services";
        }
        
        // Create tender object
        const tender: Partial<Tender> = {
          title,
          contact_info: organization,
          tender_url: link ? (link.startsWith("http") ? link : `https://tenders.go.ke${link}`) : null,
          deadline: deadline ? deadline.toISOString() : null,
          category,
          description: `Tender from ${organization}. Please check the tender document for more details.`,
          location: "Kenya"
        };
        
        tenders.push(tender);
      } catch (err) {
        console.error(`Error processing tender item ${index}:`, err);
      }
    });
    
    console.log(`Successfully scraped ${tenders.length} tenders from Tenders.go.ke`);
    return tenders;
  } catch (error) {
    console.error("Error scraping Tenders.go.ke:", error);
    return [];
  }
}
