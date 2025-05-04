
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
    console.log("Force triggering scraper with maximum priority");
    
    // First check if there are already tenders in the database
    const { count, error: countError } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error checking tenders count:', countError);
    } else {
      console.log('Current tenders in database:', count);
    }
    
    // Trigger both the main scraper and private tenders scraper
    const mainScraper = supabase.functions.invoke('scrape-tenders', {
      body: { 
        force: true, 
        useApiLayer: true,
        fullScrape: true,
        skipCache: true,
        verboseLogging: true,
        priority: 1
      }
    });
    
    const privateScraper = supabase.functions.invoke('scrape-private-tenders');
    
    const [mainResult, privateResult] = await Promise.all([mainScraper, privateScraper]);
    
    if (mainResult.error || privateResult.error) {
      console.error('Error triggering scrapers:', {
        main: mainResult.error,
        private: privateResult.error
      });
      return { success: false, error: mainResult.error || privateResult.error };
    }
    
    console.log("Scraper trigger responses:", {
      main: mainResult.data,
      private: privateResult.data
    });
    
    return { success: true, data: { main: mainResult.data, private: privateResult.data } };
  } catch (error) {
    console.error('Error in forceTriggerScraper:', error);
    return { success: false, error };
  }
};
