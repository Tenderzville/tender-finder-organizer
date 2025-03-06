// inspect-website.ts - Script to inspect the structure of tender websites

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
        'Connection': 'keep-alive'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    const text = await response.text();
    console.log(`Content length: ${text.length} characters`);
    
    // Print the first 500 characters to see the structure
    console.log("\nContent preview:");
    console.log(text.substring(0, 500));
    
    // Check for table elements
    const tableCount = (text.match(/<table/g) || []).length;
    console.log(`\nFound ${tableCount} table elements`);
    
    // Check for common tender-related elements
    const trCount = (text.match(/<tr/g) || []).length;
    console.log(`Found ${trCount} table rows`);
    
    // Check if specific tender-related keywords exist
    const hasTenderWord = text.includes('tender');
    const hasContractWord = text.includes('contract');
    console.log(`\nIncludes 'tender' word: ${hasTenderWord}`);
    console.log(`Includes 'contract' word: ${hasContractWord}`);
    
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
}

// Run the main function
main();
