
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

// Retry mechanism for fetching sources with optional proxy support
export async function fetchSourceWithRetry(url: string, proxyUrl?: string, options?: RequestInit, maxRetries = 3): Promise<string> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Fetching URL: ${url} (attempt ${retries + 1})${proxyUrl ? ' via proxy' : ''}`);
      
      // Basic headers to mimic a browser
      const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };
      
      let response;
      
      if (proxyUrl) {
        // Use proxy if available
        response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || defaultHeaders)
          },
          body: JSON.stringify({ url, ...options }),
        });
      } else {
        // Direct fetch without proxy, merging provided options with defaults
        const mergedOptions: RequestInit = {
          headers: {
            ...defaultHeaders,
            ...(options?.headers || {})
          },
          ...options
        };
        // If options has headers, they'll override the default headers we just set
        if (options?.headers) {
          mergedOptions.headers = {
            ...defaultHeaders,
            ...options.headers
          };
        }
        
        response = await fetch(url, mergedOptions);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error(`Error fetching ${url}: ${error.message}`);
      retries++;
      
      if (retries >= maxRetries) {
        console.error(`Max retries reached for ${url}`);
        return ""; // Return empty string after max retries
      }
      
      // Exponential backoff
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
    }
  }
  
  return "";
}

// Parse date from various formats
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try standard formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  // Try DD/MM/YYYY format
  const ddmmyyyy = /(\d{1,2})[\/\.-]?(\d{1,2})[\/\.-]?(\d{4})/;
  const ddmmyyyyMatch = dateStr.match(ddmmyyyy);
  if (ddmmyyyyMatch) {
    return new Date(
      parseInt(ddmmyyyyMatch[3]), // year
      parseInt(ddmmyyyyMatch[2]) - 1, // month (0-indexed)
      parseInt(ddmmyyyyMatch[1]) // day
    );
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
    
    return new Date(year, month, day);
  }
  
  return null;
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
    const nodes = document.evaluate(xpath, document, null, 0, null);
    
    let node;
    while (node = nodes.iterateNext()) {
      result.push(node.textContent || "");
    }
    
    return result;
  } catch (error) {
    console.error(`XPath selection error: ${error.message}`);
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
