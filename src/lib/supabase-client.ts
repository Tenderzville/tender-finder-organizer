import { supabase } from "@/integrations/supabase/client";

// Re-export supabase client from the integrations directory
export { supabase };

// Add a specific function for scraper status to centralize the logic
export const checkScraperStatus = async () => {
  try {
    // Try to call the edge function first
    const { data, error } = await supabase.functions.invoke('check-scraper-status');
    
    if (error) {
      console.error('Error checking scraper status:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error checking scraper status:', error);
    return { data: null, error };
  }
};

// Function to force trigger the scraper with all necessary parameters
export const forceTriggerScraper = async () => {
  try {
    console.log("Force triggering scraper with comprehensive parameters");
    
    // Always use these critical parameters to ensure scraping works
    const { data, error } = await supabase.functions.invoke('scrape-tenders', {
      body: { 
        force: true, 
        useApiLayer: true,
        fullScrape: true,
        skipCache: true,
        verboseLogging: true
      }
    });
    
    console.log('Scraper invocation result:', { data, error });
    
    if (error) {
      console.error('Comprehensive error triggering scraper:', error);
      return { success: false, error };
    }
    
    console.log("Scraper trigger comprehensive response:", data);
    return { success: true, data };
  } catch (error) {
    console.error('Comprehensive error in forceTriggerScraper:', error);
    return { success: false, error };
  }
};

// Add a function to directly check if tenders exist and force creation if needed
export const ensureTendersExist = async () => {
  try {
    // First check if tenders exist
    const { count, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    console.log('Tender count:', count);
    
    if (countError) {
      console.error('Error checking tenders count:', countError);
      return { success: false, error: countError };
    }
    
    // If no tenders exist, force trigger the scraper
    if (count === 0 || count === null) {
      console.log("No tenders found, forcing scraper to run");
      const scrapeResult = await forceTriggerScraper();
      
      // After forcing scraper, check count again
      const { count: newCount, error: newCountError } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });
      
      console.log('New tender count after scraping:', newCount);
      
      if (newCountError) {
        console.error('Error checking new tenders count:', newCountError);
      }
      
      return { 
        success: true, 
        count: newCount, 
        scrapeResult 
      };
    }
    
    return { success: true, count };
  } catch (error) {
    console.error('Critical error in ensureTendersExist:', error);
    return { success: false, error };
  }
};
