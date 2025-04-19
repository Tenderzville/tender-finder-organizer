import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

// Fetch wrapper using native Deno client
async function denoFetch(url: string): Promise<Response> {
  const cmd = new Deno.Command("curl", {
    args: [
      "--insecure", // Skip SSL verification
      "-L", // Follow redirects
      "-s", // Silent mode
      "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
      url
    ]
  });

  try {
    const { stdout } = await cmd.output();
    const text = new TextDecoder().decode(stdout);
    
    return new Response(text, {
      status: text ? 200 : 404,
      headers: new Headers({
        'content-type': 'text/html'
      })
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch ${url}: ${errorMessage}`);
  }
}

// Retry mechanism for fetching sources
export async function fetchSourceWithRetry(url: string): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await denoFetch(url);
      
      if (response.ok) {
        return await response.text();
      }
      
      console.log(`Attempt ${attempt} failed for ${url}`);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch after ${maxRetries} attempts`);
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error: unknown) {
      if (attempt === maxRetries) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch ${url}: ${errorMessage}`);
      }
      console.error(`Attempt ${attempt} error:`, error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(`Failed to fetch content from ${url}`);
}

// Function to fetch MyGov content
export async function fetchMyGovContent(): Promise<string> {
  const urls = [
    "http://www.mygov.go.ke/all-tenders",
    "http://mygov.go.ke/all-tenders",
    "http://www.mygov.go.ke/tenders",
    "http://mygov.go.ke/tenders"
  ];

  for (const url of urls) {
    try {
      console.log(`Attempting to fetch from ${url}...`);
      const response = await denoFetch(url);

      if (response.ok) {
        const html = await response.text();
        if (html && html.length > 1000 && (html.includes('tender') || html.includes('Tender'))) {
          console.log(`Successfully fetched content from ${url}`);
          return html;
        }
      }
    } catch (error: unknown) {
      console.error(`Error fetching from ${url}:`, error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error("Could not fetch tender content from any MyGov URL");
}

// Parse date from various formats
export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Try standard formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  // Try DD/MM/YYYY format
  const ddmmyyyy = /(\d{1,2})[\/\.-]?(\d{1,2})[\/\.-]?(\d{4})/;
  const ddmmyyyyMatch = dateStr.match(ddmmyyyy);
  if (ddmmyyyyMatch) {
    const parsedDate = new Date(
      parseInt(ddmmyyyyMatch[3]), // year
      parseInt(ddmmyyyyMatch[2]) - 1, // month (0-indexed)
      parseInt(ddmmyyyyMatch[1]) // day
    );
    if (!isNaN(parsedDate.getTime())) return parsedDate;
  }
  
  // Try to extract date from text
  const datePattern = /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i;
  const textMatch = dateStr.match(datePattern);
  if (textMatch) {
    const months: { [key: string]: number } = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    
    const day = parseInt(textMatch[1]);
    const month = months[textMatch[2].toLowerCase().substring(0, 3)];
    const year = parseInt(textMatch[3]);
    
    const parsedDate = new Date(year, month, day);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
  }
  
  // Default to current date plus 14 days if parsing fails
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);
  return defaultDate;
}

// Function to select elements using XPath
export function XPathSelect(html: string, xpath: string): string[] {
  try {
    const parser = new DOMParser();
    const document = parser.parseFromString(html, "text/html");
    
    if (!document) {
      console.error("Failed to parse HTML document");
      return [];
    }
    
    const result: string[] = [];
    const nodes = document.querySelectorAll(xpath); // Using querySelector instead of evaluate
    
    nodes.forEach(node => {
      if (node.textContent) {
        result.push(node.textContent);
      }
    });
    
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`XPath selection error: ${errorMessage}`);
    return [];
  }
}

// Function to extract keywords from a string
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Remove common stop words and punctuation
  const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'for', 'with', 'in', 'on', 'at', 'by', 'to', 'of'];
  
  // Convert to lowercase and remove punctuation
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words and filter
  const words = cleaned.split(/\s+/).filter(word => 
    word.length > 2 && !stopWords.includes(word)
  );
  
  // Deduplicate words
  return [...new Set(words)];
}

// Function to generate Google search URL for tenders
export function generateTenderSearchUrl(keywords: string[], days = 7): string {
  // Add tender-specific terms
  const searchTerms = [...keywords, 'tender', 'procurement', 'bid', 'rfp'];
  
  // Create a time filter for recent results
  const timeFilter = days > 0 ? `&tbs=qdr:d${days}` : '';
  
  // Generate the search URL
  return `https://www.google.com/search?q=${encodeURIComponent(searchTerms.join(' '))}${timeFilter}`;
}
