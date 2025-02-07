export interface TenderSource {
  url: string;
  selectors: {
    tenderList: string;
    title: string;
    deadline: string;
    description: string;
    organization: string;
  };
}

export interface ScrapedTender {
  title: string;
  description: string;
  requirements: string;
  deadline: string;
  contact_info: string;
  category: string;
  location: string;
  created_at: string;
}

export interface ScrapingResult {
  success: boolean;
  tenders_scraped: number;
  data?: any;
  message?: string;
}