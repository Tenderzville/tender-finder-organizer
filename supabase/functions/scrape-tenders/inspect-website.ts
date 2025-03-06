
// inspect-website.ts - Script to inspect the structure of tender websites
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

// Function to fetch and analyze a website
async function inspectWebsite(url: string) {
  console.log(`\n=== Inspecting ${url} ===\n`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    const text = await response.text();
    console.log(`Content length: ${text.length} characters`);
    
    // Print the first 500 characters to see the structure
    console.log("\nContent preview:");
    console.log(text.substring(0, 500));
    
    // Try using DOM parser for better analysis
    try {
      const parser = new DOMParser();
      const document = parser.parseFromString(text, "text/html");
      
      if (document) {
        // Check for tables and their structure
        const tables = document.querySelectorAll("table");
        console.log(`\nFound ${tables.length} table elements`);
        
        for (let i = 0; i < Math.min(tables.length, 3); i++) {
          const table = tables[i];
          const rows = table.querySelectorAll("tr");
          console.log(`Table ${i+1} has ${rows.length} rows`);
          
          // Check table headers
          const headers = table.querySelectorAll("th");
          if (headers.length > 0) {
            console.log(`  Table ${i+1} headers: ${Array.from(headers).map(h => h.textContent?.trim()).join(", ")}`);
          }
          
          // Sample a row
          if (rows.length > 1) {
            const sampleRow = rows[1]; // Get first non-header row
            const cells = sampleRow.querySelectorAll("td");
            console.log(`  Sample row has ${cells.length} cells`);
            if (cells.length > 0) {
              console.log(`  First few cells: ${Array.from(cells).slice(0, 3).map(c => c.textContent?.trim()).join(" | ")}`);
            }
          }
        }
        
        // Look for forms that might be used for tender searches
        const forms = document.querySelectorAll("form");
        console.log(`\nFound ${forms.length} forms`);
        
        // Look for potential API endpoints
        const scripts = document.querySelectorAll("script");
        console.log(`\nFound ${scripts.length} script elements`);
        let apiPatterns = [];
        for (const script of scripts) {
          const content = script.textContent || "";
          const apiMatches = content.match(/(\/api\/[^\s'"]+)|(['"]https?:\/\/[^\s'"]+api[^\s'"]+['"])/g);
          if (apiMatches) {
            apiPatterns = [...apiPatterns, ...apiMatches];
          }
        }
        
        if (apiPatterns.length > 0) {
          console.log("\nPotential API endpoints found:");
          apiPatterns.slice(0, 5).forEach(api => console.log(`  ${api}`));
        }
        
        // Check for iframes that might contain tender data
        const iframes = document.querySelectorAll("iframe");
        console.log(`\nFound ${iframes.length} iframes`);
        
        // Check for tender-specific content
        const tenderElements = document.querySelectorAll(".tender, .tender-item, [class*='tender'], [id*='tender']");
        console.log(`\nFound ${tenderElements.length} elements with tender-related class names`);
      }
    } catch (domError) {
      console.error("Error using DOM parser:", domError);
      
      // Fallback to regex-based analysis
      // Check for table elements
      const tableCount = (text.match(/<table/g) || []).length;
      console.log(`\nFound ${tableCount} table elements (regex)`);
      
      // Check for common tender-related elements
      const trCount = (text.match(/<tr/g) || []).length;
      console.log(`Found ${trCount} table rows (regex)`);
    }
    
    // Check if specific tender-related keywords exist
    const keywords = ['tender', 'contract', 'procurement', 'bid', 'rfp', 'deadline', 'submission'];
    console.log("\nKeyword presence:");
    keywords.forEach(keyword => {
      const count = (text.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      console.log(`  "${keyword}": ${count} occurrences`);
    });
    
    return text;
  } catch (error) {
    console.error(`Error inspecting ${url}:`, error);
    return "";
  }
}

// Main function
async function main() {
  const tendersGoKe = "https://tenders.go.ke/website/tenders/index";
  await inspectWebsite(tendersGoKe);
  
  // Check MyGov site as well
  const myGovKe = "https://www.mygov.go.ke/all-tenders";
  await inspectWebsite(myGovKe);
}

// Run the main function
if (import.meta.main) {
  main();
}

export { inspectWebsite };
