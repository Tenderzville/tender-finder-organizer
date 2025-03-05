
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

export function createSupabaseClient() {
  const client = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  console.log('Supabase client created successfully');
  return client;
}

export function parseDate(dateText: string): string | null {
  console.log('Attempting to parse date:', dateText);
  try {
    // Try standard ISO format first
    let parsedDate = new Date(dateText);
    
    // If invalid, try DD/MM/YYYY format
    if (isNaN(parsedDate.getTime())) {
      const parts = dateText.split(/[\/\-\.]/);
      if (parts.length >= 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
        const year = parseInt(parts[2]);
        parsedDate = new Date(year, month, day);
      }
    }
    
    // Verify the date is valid
    if (!isNaN(parsedDate.getTime())) {
      console.log('Date parsed successfully:', parsedDate.toISOString());
      return parsedDate.toISOString();
    }
    
    console.log('Invalid date format:', dateText);
    return null;
  } catch (error) {
    console.error(`Failed to parse date: ${dateText}`, error);
    return null;
  }
}

export async function fetchSourceWithRetry(url: string, retries = 3): Promise<string> {
  console.log(`Attempting to fetch ${url}, retries left: ${retries}`);
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      console.log(`Successfully fetched ${url}, HTML length: ${html.length}`);
      return html;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

// Helper to extract content using XPath-like selectors (simplified)
export function XPathSelect(html: string, selector: string): string {
  // This is a very simple implementation and won't handle complex XPath
  // In a real solution, you'd use a proper HTML parser
  try {
    const parts = selector.split('/');
    let currentContent = html;
    
    for (const part of parts) {
      if (!part || part === '') continue;
      
      if (part.includes('[')) {
        // Handle indexed elements like div[2]
        const tagName = part.split('[')[0];
        const index = parseInt(part.split('[')[1]) || 0;
        
        const matches = currentContent.split(`<${tagName}`).slice(1);
        if (matches.length > index) {
          currentContent = matches[index];
        } else {
          return '';
        }
      } else {
        // Simple tag selection
        const splits = currentContent.split(`<${part}`).slice(1);
        if (splits.length > 0) {
          currentContent = splits[0];
        } else {
          return '';
        }
      }
    }
    
    // Extract text content (very simplified)
    const result = currentContent.split('>')[1]?.split('<')[0] || '';
    return result.trim();
  } catch (e) {
    console.error('Error in XPathSelect:', e);
    return '';
  }
}
