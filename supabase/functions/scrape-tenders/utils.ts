
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
      const [day, month, year] = dateText.split(/[\/\-\.]/);
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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
