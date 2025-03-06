// test-local.ts - Script to test the scraper locally
import { scrapeMyGov, scrapeTendersGo } from "./scraper.ts";

async function testScraper() {
  console.log("==== Testing Scraper Locally ====");
  
  try {
    // Test MyGov scraper
    console.log("\n=== Testing MyGov Scraper ===");
    const myGovTenders = await scrapeMyGov();
    console.log(`Found ${myGovTenders.length} tenders from MyGov:`);
    myGovTenders.forEach((tender, index) => {
      console.log(`\nTender #${index + 1}:`);
      console.log(`- Title: ${tender.title}`);
      console.log(`- Deadline: ${new Date(tender.deadline).toLocaleDateString()}`);
      console.log(`- Category: ${tender.category}`);
    });

    // Test Tenders.go.ke scraper
    console.log("\n=== Testing Tenders.go.ke Scraper ===");
    const tendersGoTenders = await scrapeTendersGo();
    console.log(`Found ${tendersGoTenders.length} tenders from Tenders.go.ke:`);
    tendersGoTenders.forEach((tender, index) => {
      console.log(`\nTender #${index + 1}:`);
      console.log(`- Title: ${tender.title}`);
      console.log(`- Deadline: ${new Date(tender.deadline).toLocaleDateString()}`);
      console.log(`- Category: ${tender.category}`);
    });

    console.log("\n==== Scraper Test Complete ====");
  } catch (error) {
    console.error("Error testing scraper:", error);
  }
}

// Run the test
testScraper();
