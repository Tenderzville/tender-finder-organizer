import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

// Cache of successful selectors with their success rates
const selectorCache: Map<string, {
  pattern: string,
  successRate: number,
  lastSuccess: Date,
  matches: number
}> = new Map();

// Learn from successful extractions
function learnPattern(html: string, extractedContent: string): string[] {
  const patterns: string[] = [];
  if (!extractedContent) return patterns;

  // Try to find common parent elements
  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  if (!document) return patterns;

  // Find elements containing the exact content
  const elements = document.querySelectorAll("*");
  elements.forEach(element => {
    if (element.textContent?.includes(extractedContent)) {
      let selector = generateUniqueSelector(element);
      patterns.push(selector);
    }
  });

  return patterns;
}

// Generate a unique CSS selector for an element
function generateUniqueSelector(element: Element): string {
  let selector = element.tagName.toLowerCase();
  
  // Add classes that look relevant
  const classes = Array.from(element.classList)
    .filter(c => /tender|title|description|deadline|date/i.test(c));
  if (classes.length) {
    selector += '.' + classes.join('.');
  }

  // Add relevant attributes
  const attrs = element.getAttributeNames()
    .filter(attr => /data-|aria-|id/i.test(attr))
    .map(attr => `[${attr}="${element.getAttribute(attr)}"]`);
  selector += attrs.join('');

  return selector;
}

// Adaptive selector function
export async function adaptiveSelect(html: string, targetType: 'title' | 'deadline' | 'description'): string[] {
  // Start with cached successful patterns
  let patterns = Array.from(selectorCache.entries())
    .filter(([_, data]) => data.pattern.includes(targetType))
    .sort((a, b) => b[1].successRate - a[1].successRate)
    .map(([pattern]) => pattern);

  // Common fallback patterns based on type
  const fallbackPatterns = {
    title: ['.tender-title', '.title', 'h1', 'h2', 'h3', '[class*="title"]'],
    deadline: ['.deadline', '.closing-date', '.tender-date', '[class*="date"]'],
    description: ['.description', '.tender-description', 'p', '[class*="desc"]']
  };

  patterns = [...patterns, ...fallbackPatterns[targetType]];

  const results: string[] = [];
  for (const pattern of patterns) {
    try {
      const nodes = document.querySelectorAll(pattern);
      nodes.forEach(node => {
        if (node.textContent?.trim()) {
          results.push(node.textContent.trim());
          
          // Update success rate
          const cacheEntry = selectorCache.get(pattern) || {
            pattern,
            successRate: 0,
            lastSuccess: new Date(),
            matches: 0
          };
          
          cacheEntry.matches++;
          cacheEntry.successRate = (cacheEntry.successRate + 1) / 2;
          cacheEntry.lastSuccess = new Date();
          selectorCache.set(pattern, cacheEntry);
        }
      });
      
      if (results.length > 0) break;
    } catch (error) {
      console.error(`Error with pattern ${pattern}:`, error);
      continue;
    }
  }

  return results;
}

// Enhanced fetch wrapper with multiple strategies
export async function enhancedFetch(url: string): Promise<string> {
  // List of user agents to rotate
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0'
  ];

  // Try different fetch strategies
  const strategies = [
    // Strategy 1: Direct fetch with rotating user agents
    async () => {
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.text();
    },
    
    // Strategy 2: Using curl command
    async () => {
      const cmd = new Deno.Command("curl", {
        args: [
          "--insecure",
          "-L",
          "-s",
          "-A", userAgents[0],
          url
        ]
      });
      const { stdout } = await cmd.output();
      const text = new TextDecoder().decode(stdout);
      if (!text) throw new Error('Empty response from curl');
      return text;
    },
    
    // Strategy 3: Fetch with additional headers
    async () => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgents[1],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.text();
    }
  ];

  let lastError;
  for (const strategy of strategies) {
    try {
      console.log(`Trying fetch strategy for ${url}...`);
      const result = await strategy();
      if (result && result.length > 100) { // Basic validation of response
        console.log(`Successfully fetched ${url} (${result.length} bytes)`);
        return result;
      }
    } catch (error) {
      console.error(`Strategy failed for ${url}:`, error);
      lastError = error;
    }
    // Add delay between retries
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw lastError || new Error(`All fetch strategies failed for ${url}`);
}

// Update the fetchSourceWithRetry function to use enhancedFetch
export async function fetchSourceWithRetry(url: string): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await enhancedFetch(url);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.error(`Attempt ${attempt} failed:`, error);
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
    }
  }

  throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
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
