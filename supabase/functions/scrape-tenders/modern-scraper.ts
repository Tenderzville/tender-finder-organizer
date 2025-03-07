
// Modern scraper implementation that handles SPAs more effectively
import { Tender } from './types';

export interface ScrapeResult {
  success: boolean;
  source: string;
  tenders: Tender[];
  error?: string;
  recordsFound: number;
}

// Detect and handle SPA frameworks
export async function detectFramework(html: string): Promise<string> {
  // Check for common frameworks
  if (html.includes('react')) return 'React';
  if (html.includes('vue')) return 'Vue';
  if (html.includes('angular')) return 'Angular';
  if (html.includes('next')) return 'Next.js';
  if (html.includes('nuxt')) return 'Nuxt.js';
  return 'Unknown';
}

// Extract API endpoints from script tags
export function extractApiEndpoints(html: string): string[] {
  const endpoints: string[] = [];
  
  // Look for API endpoints in script tags
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    const scriptContent = match[1];
    
    // Look for API endpoint patterns
    const apiPatterns = [
      /['"]\/api\/([^'"]+)['"]/g,
      /['"]https?:\/\/[^'"]*\/api\/([^'"]+)['"]/g,
      /fetch\(['"]([^'"]+)['"]\)/g,
      /url:\s*['"]([^'"]+)['"]/g,
      /axios\.get\(['"]([^'"]+)['"]\)/g
    ];
    
    for (const pattern of apiPatterns) {
      let apiMatch;
      while ((apiMatch = pattern.exec(scriptContent)) !== null) {
        if (apiMatch[1].includes('tender') || apiMatch[1].includes('bid')) {
          endpoints.push(apiMatch[1]);
        }
      }
    }
  }
  
  return [...new Set(endpoints)]; // Remove duplicates
}

export async function scrapeSPA(url: string): Promise<ScrapeResult> {
  console.log(`Starting SPA-aware scrape of ${url}`);
  
  try {
    // Fetch the main HTML
    const response = await fetch(url);
    const html = await response.text();
    
    // Detect the framework
    const framework = await detectFramework(html);
    console.log(`Detected framework: ${framework}`);
    
    // Extract potential API endpoints
    const apiEndpoints = extractApiEndpoints(html);
    console.log(`Found ${apiEndpoints.length} potential API endpoints`);
    
    // Try each endpoint
    let tenders: Tender[] = [];
    let successfulEndpoint = '';
    
    for (const endpoint of apiEndpoints) {
      try {
        // Construct the full URL if needed
        const fullEndpoint = endpoint.startsWith('http') 
          ? endpoint 
          : new URL(endpoint, url).toString();
        
        console.log(`Trying endpoint: ${fullEndpoint}`);
        
        const apiResponse = await fetch(fullEndpoint, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (apiResponse.headers.get('content-type')?.includes('application/json')) {
          const data = await apiResponse.json();
          
          // Look for arrays that might contain tender data
          const potentialTenders = findTenderArrays(data);
          
          if (potentialTenders.length > 0) {
            console.log(`Found ${potentialTenders.length} potential tenders at ${fullEndpoint}`);
            tenders = potentialTenders.map(mapToStandardTender);
            successfulEndpoint = fullEndpoint;
            break;
          }
        }
      } catch (error) {
        console.log(`Error with endpoint ${endpoint}: ${error.message}`);
        // Continue to next endpoint
      }
    }
    
    if (tenders.length > 0) {
      return {
        success: true,
        source: url,
        tenders,
        recordsFound: tenders.length
      };
    }
    
    // If no API endpoints worked, try to scrape directly from the HTML
    tenders = scrapeDirectFromHTML(html);
    
    return {
      success: tenders.length > 0,
      source: url,
      tenders,
      recordsFound: tenders.length,
      error: tenders.length === 0 ? 'No tenders found' : undefined
    };
    
  } catch (error) {
    console.error(`Error scraping SPA ${url}: ${error.message}`);
    return {
      success: false,
      source: url,
      tenders: [],
      error: error.message,
      recordsFound: 0
    };
  }
}

// Find arrays in the response that might contain tender data
function findTenderArrays(data: any): any[] {
  if (!data) return [];
  
  // If data is already an array, check if it looks like tenders
  if (Array.isArray(data)) {
    if (
      data.length > 0 && 
      (data[0].title || data[0].name || data[0].description) && 
      (data[0].deadline || data[0].closingDate || data[0].date)
    ) {
      return data;
    }
  }
  
  // If data is an object, look for arrays in its properties
  if (typeof data === 'object') {
    for (const key in data) {
      if (
        Array.isArray(data[key]) && 
        data[key].length > 0 && 
        typeof data[key][0] === 'object'
      ) {
        // Check if this array contains what looks like tender data
        const item = data[key][0];
        if (
          (item.title || item.name || item.tender_title) && 
          (item.deadline || item.closing_date || item.date || item.published)
        ) {
          return data[key];
        }
      }
      
      // Recursively check nested objects
      const result = findTenderArrays(data[key]);
      if (result.length > 0) {
        return result;
      }
    }
  }
  
  return [];
}

// Map various tender formats to our standard format
function mapToStandardTender(item: any): Tender {
  return {
    title: item.title || item.name || item.tender_title || item.tender_name || 'Untitled Tender',
    reference: item.reference || item.ref || item.id || item.tender_id || item.number || '',
    description: item.description || item.details || item.tender_description || '',
    requirements: item.requirements || item.eligibility || item.qualification || '',
    deadline: item.deadline || item.closing_date || item.close_date || item.end_date || '',
    publication_date: item.publication_date || item.published || item.start_date || item.date || '',
    location: item.location || item.region || item.county || '',
    category: item.category || item.sector || item.type || '',
    procuring_entity: item.procuring_entity || item.entity || item.organization || item.procurer || '',
    amount: parseFloat(item.amount || item.budget || item.value || '0') || 0,
    currency: item.currency || 'KES',
    url: item.url || item.link || item.tender_url || '',
    source: item.source || 'API',
    status: getStatus(item.deadline || item.closing_date || '')
  };
}

// Determine the status of the tender based on deadline
function getStatus(deadlineStr: string): string {
  if (!deadlineStr) return 'unknown';
  
  try {
    const deadline = new Date(deadlineStr);
    const now = new Date();
    
    if (isNaN(deadline.getTime())) return 'unknown';
    
    if (deadline < now) return 'closed';
    
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    if (deadline <= sevenDaysFromNow) return 'closing_soon';
    
    return 'open';
  } catch (e) {
    return 'unknown';
  }
}

// Scrape tender data directly from HTML as a fallback
function scrapeDirectFromHTML(html: string): Tender[] {
  const tenders: Tender[] = [];
  
  // Look for tables that might contain tender data
  const tableRegex = /<table\b[^>]*>([\s\S]*?)<\/table>/g;
  let tableMatch;
  
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableContent = tableMatch[1];
    
    // Extract rows
    const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/g;
    let rowMatch;
    
    const rows: string[][] = [];
    
    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const rowContent = rowMatch[1];
      
      // Extract cells
      const cellRegex = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g;
      let cellMatch;
      const cells: string[] = [];
      
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        const cellContent = cellMatch[1].replace(/<[^>]+>/g, '').trim();
        cells.push(cellContent);
      }
      
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    
    // If we have header and data rows
    if (rows.length > 1) {
      const headers = rows[0];
      
      // Check if this looks like a tender table
      const hasTenderKeywords = headers.some(header => 
        /tender|bid|procurement|contract/i.test(header)
      );
      
      if (hasTenderKeywords) {
        // Process data rows
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          
          if (rowData.length >= 3) { // Assume at least 3 columns for a valid tender
            const tender: Partial<Tender> = {
              title: '',
              source: 'HTML'
            };
            
            // Try to map columns to our data structure
            for (let j = 0; j < headers.length && j < rowData.length; j++) {
              const header = headers[j].toLowerCase();
              const value = rowData[j];
              
              if (/title|name|subject/i.test(header)) {
                tender.title = value;
              } else if (/reference|ref|number|id/i.test(header)) {
                tender.reference = value;
              } else if (/closing|deadline|end date/i.test(header)) {
                tender.deadline = value;
                tender.status = getStatus(value);
              } else if (/publish|start|publication/i.test(header)) {
                tender.publication_date = value;
              } else if (/authority|entity|organization|ministry/i.test(header)) {
                tender.procuring_entity = value;
              } else if (/location|region|county/i.test(header)) {
                tender.location = value;
              } else if (/category|sector|type/i.test(header)) {
                tender.category = value;
              }
            }
            
            if (tender.title) {
              tenders.push(tender as Tender);
            }
          }
        }
      }
    }
  }
  
  return tenders;
}
