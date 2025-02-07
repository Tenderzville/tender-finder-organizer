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
  const title = $element.find(selectors.title).text().trim();
  const deadlineText = $element.find(selectors.deadline).text().trim();
  const description = $element.find(selectors.description).text().trim();
  const organization = $element.find(selectors.organization).text().trim();

  console.log('Scraped tender data:', { title, deadlineText, description: description.substring(0, 100) + '...' });

  if (!title || !deadlineText) {
    console.log('Skipping tender due to missing required fields:', { title, deadlineText });
    return null;
  }

  const deadline = parseDate(deadlineText);
  if (!deadline) return null;

  if (new Date(deadline) <= new Date()) {
    console.log('Skipping expired tender:', title);
    return null;
  }

  return {
    title: title.substring(0, 255),
    description: description || 'No description provided',
    requirements: 'Contact organization for detailed requirements',
    deadline,
    contact_info: organization || 'Contact procurement office',
    category: 'Government',
    location: 'Kenya',
    created_at: new Date().toISOString()
  };
}

export async function scrapeTenders() {
  console.log('Starting scheduled tender scraping process...');
  const tenders: ScrapedTender[] = [];
  let successfulSources = 0;

  for (const source of sources) {
    try {
      console.log(`Scraping source: ${source.url}`);
      const html = await fetchSourceWithRetry(source.url);
      const $ = cheerio.load(html);
      
      const tenderElements = $(source.selectors.tenderList);
      console.log(`Found ${tenderElements.length} potential tenders`);

      for (const element of tenderElements.toArray()) {
        try {
          const tender = await scrapeTenderFromElement($(element), source.selectors);
          if (tender) {
            console.log('Successfully scraped tender:', tender.title);
            tenders.push(tender);
          }
        } catch (error) {
          console.error('Error processing tender element:', error);
        }
      }

      successfulSources++;
      console.log(`Successfully scraped ${tenderElements.length} tenders from ${source.url}`);
    } catch (error) {
      console.error(`Failed to scrape ${source.url}:`, error);
    }
  }

  return tenders;
}