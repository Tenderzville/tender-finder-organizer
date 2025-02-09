
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { TenderSource, ScrapedTender } from "./types.ts";
import { parseDate, fetchSourceWithRetry } from "./utils.ts";

export const sources: TenderSource[] = [
  {
    url: 'https://www.tendersonline.co.ke/Tenders',
    selectors: {
      tenderList: '.tender-item',
      title: '.tender-title',
      deadline: '.deadline-date',
      description: '.description',
      organization: '.organization'
    }
  },
  {
    url: 'https://www.globaltenders.com/tenders-kenya.php',
    selectors: {
      tenderList: '.tender-listing',
      title: '.tender-title',
      deadline: '.closing-date',
      description: '.tender-desc',
      organization: '.department'
    }
  }
];

async function scrapeTenderFromElement($element: cheerio.Cheerio, selectors: TenderSource['selectors']): Promise<ScrapedTender | null> {
  try {
    const title = $element.find(selectors.title).text().trim();
    const deadlineText = $element.find(selectors.deadline).text().trim();
    const description = $element.find(selectors.description).text().trim();
    const organization = $element.find(selectors.organization).text().trim();

    console.log('Raw scraped data:', { title, deadlineText, description: description.substring(0, 100) + '...', organization });

    if (!title) {
      console.log('Skipping tender: Missing title');
      return null;
    }

    const deadline = parseDate(deadlineText);
    if (!deadline) {
      console.log('Skipping tender: Invalid deadline format:', deadlineText);
      return null;
    }

    if (new Date(deadline) <= new Date()) {
      console.log('Skipping expired tender:', title);
      return null;
    }

    return {
      title: title.substring(0, 255),
      description: description || null,
      requirements: null,
      deadline,
      contact_info: organization || null,
      category: 'Government',
      location: 'Kenya',
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing tender element:', error);
    return null;
  }
}

export async function scrapeTenders() {
  console.log('Starting scheduled tender scraping process...');
  const tenders: ScrapedTender[] = [];
  let successfulSources = 0;

  for (const source of sources) {
    try {
      console.log(`Scraping source: ${source.url}`);
      
      // Log scraping attempt
      const { data: logEntry } = await supabase
        .from('scraping_logs')
        .insert({
          source: source.url,
          status: 'in_progress'
        })
        .select()
        .single();

      const html = await fetchSourceWithRetry(source.url);
      const $ = cheerio.load(html);
      
      const tenderElements = $(source.selectors.tenderList);
      console.log(`Found ${tenderElements.length} potential tenders from ${source.url}`);

      let validTenders = 0;
      for (const element of tenderElements.toArray()) {
        try {
          const tender = await scrapeTenderFromElement($(element), source.selectors);
          if (tender) {
            tenders.push(tender);
            validTenders++;
          }
        } catch (error) {
          console.error('Error processing tender element:', error);
        }
      }

      // Update log entry with success
      await supabase
        .from('scraping_logs')
        .update({
          status: 'completed',
          records_found: tenderElements.length,
          records_inserted: validTenders
        })
        .eq('id', logEntry.id);

      successfulSources++;
      console.log(`Successfully scraped ${validTenders} valid tenders from ${source.url}`);
    } catch (error) {
      console.error(`Failed to scrape ${source.url}:`, error);
      
      // Log error in scraping_logs
      await supabase
        .from('scraping_logs')
        .insert({
          source: source.url,
          status: 'failed',
          error_message: error.message
        });
    }
  }

  if (tenders.length > 0) {
    try {
      console.log(`Attempting to insert ${tenders.length} tenders into database`);
      const { error, data } = await supabase
        .from('tenders')
        .upsert(tenders, {
          onConflict: 'title',
          ignoreDuplicates: true
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      console.log(`Successfully inserted/updated ${tenders.length} tenders`);
      return { success: true, tenders_scraped: tenders.length, data };
    } catch (error) {
      console.error('Error inserting tenders:', error);
      throw error;
    }
  }

  return { success: true, tenders_scraped: 0, message: 'No new tenders found' };
}
