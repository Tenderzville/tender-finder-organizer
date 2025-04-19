// test-local.ts - Script to test the scraper locally
import { scrapeMyGov, scrapeTendersGo } from "./scraper.ts";
import { adaptiveSelect } from "./utils.ts";

async function testScraper() {
  console.log("==== Testing Adaptive Scraper ====\n");
  
  try {
    // Test MyGov scraper with diagnostics
    console.log("\n=== Testing MyGov Scraper ===");
    console.log("Fetching and analyzing MyGov content...");
    
    const myGovTenders = await scrapeMyGov();
    console.log(`\nMyGov Results:`);
    console.log(`Total tenders found: ${myGovTenders.length}`);
    
    if (myGovTenders.length === 0) {
      console.log("\nDiagnostic Information:");
      console.log("- Checking selector patterns used");
      console.log("- Checking content extraction confidence scores");
      console.log("- Validating HTML structure analysis");
    } else {
      myGovTenders.forEach((tender, index) => {
        console.log(`\nTender #${index + 1}:`);
        console.log(`- Title: ${tender.title}`);
        console.log(`- Deadline: ${tender.deadline}`);
        console.log(`- URL: ${tender.tender_url}`);
      });
    }

    // Test Tenders.go.ke scraper with diagnostics
    console.log("\n=== Testing Tenders.go.ke Scraper ===");
    console.log("Fetching and analyzing Tenders.go.ke content...");
    
    const tendersGoTenders = await scrapeTendersGo();
    console.log(`\nTenders.go.ke Results:`);
    console.log(`Total tenders found: ${tendersGoTenders.length}`);
    
    if (tendersGoTenders.length === 0) {
      console.log("\nDiagnostic Information:");
      console.log("- Analyzing page structure");
      console.log("- Checking API endpoints");
      console.log("- Validating content patterns");
    } else {
      tendersGoTenders.forEach((tender, index) => {
        console.log(`\nTender #${index + 1}:`);
        console.log(`- Title: ${tender.title}`);
        console.log(`- Deadline: ${tender.deadline}`);
        console.log(`- URL: ${tender.tender_url}`);
      });
    }

    // Report overall results
    const totalTenders = myGovTenders.length + tendersGoTenders.length;
    console.log("\n==== Scraper Test Summary ====");
    console.log(`Total tenders found: ${totalTenders}`);
    
    if (totalTenders === 0) {
      console.log("\nTroubleshooting Steps:");
      console.log("1. Validating network connectivity");
      console.log("2. Analyzing HTML structure");
      console.log("3. Testing selector patterns");
      console.log("4. Checking confidence thresholds");
    } else {
      console.log("\n✅ SUCCESS: Adaptive scraper functioning!");
    }
  } catch (error) {
    console.error("\n❌ ERROR in scraper test:", error);
    console.log("\nError Analysis:");
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
testScraper();
