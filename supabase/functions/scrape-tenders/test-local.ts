
// test-local.ts - Script to test the scraper locally
import { scrapeMyGov, scrapeTendersGo } from "./scraper.ts";

async function testScraper() {
  console.log("==== Testing Scraper Locally ====");
  
  try {
    // Test MyGov scraper
    console.log("\n=== Testing MyGov Scraper ===");
    console.log("Attempting to scrape tenders from MyGov (supplies.go.ke)...");
    
    const myGovTenders = await scrapeMyGov();
    console.log(`SUCCESS! Found ${myGovTenders.length} tenders from MyGov:`);
    
    if (myGovTenders.length === 0) {
      console.log("⚠️ WARNING: No tenders found from MyGov. The website structure may have changed.");
    } else {
      myGovTenders.forEach((tender, index) => {
        console.log(`\nTender #${index + 1}:`);
        console.log(`- Title: ${tender.title}`);
        console.log(`- Deadline: ${tender.deadline ? new Date(tender.deadline).toLocaleDateString() : "Unknown"}`);
        console.log(`- Category: ${tender.category || "Uncategorized"}`);
        console.log(`- URL: ${tender.url || "No URL provided"}`);
      });
    }

    // Test Tenders.go.ke scraper
    console.log("\n=== Testing Tenders.go.ke Scraper ===");
    console.log("Attempting to scrape tenders from Tenders.go.ke...");
    
    const tendersGoTenders = await scrapeTendersGo();
    console.log(`SUCCESS! Found ${tendersGoTenders.length} tenders from Tenders.go.ke:`);
    
    if (tendersGoTenders.length === 0) {
      console.log("⚠️ WARNING: No tenders found from Tenders.go.ke. The website structure may have changed.");
    } else {
      tendersGoTenders.forEach((tender, index) => {
        console.log(`\nTender #${index + 1}:`);
        console.log(`- Title: ${tender.title}`);
        console.log(`- Deadline: ${tender.deadline ? new Date(tender.deadline).toLocaleDateString() : "Unknown"}`);
        console.log(`- Category: ${tender.category || "Uncategorized"}`);
        console.log(`- URL: ${tender.url || "No URL provided"}`);
      });
    }

    // Report on total tenders found
    const totalTenders = myGovTenders.length + tendersGoTenders.length;
    console.log(`\n==== Scraper Test Complete ====`);
    console.log(`Total tenders found: ${totalTenders}`);
    
    if (totalTenders === 0) {
      console.log("❌ ERROR: No tenders found from any source. The scraper may need to be updated.");
    } else {
      console.log("✅ SUCCESS: Successfully scraped tenders!");
    }
  } catch (error) {
    console.error("❌ ERROR testing scraper:", error);
    console.log("\nDetailed error information:");
    console.error(error.stack || error);
    console.log("\nThe scraper may need to be updated to match changes on the tender websites.");
  }
}

// Run the test
testScraper();
