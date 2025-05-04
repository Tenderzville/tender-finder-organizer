
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
    
    // Trigger the scraper with comprehensive parameters
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
      console.error('Error triggering scraper:', error);
      return { success: false, error };
    }
    
    console.log("Scraper trigger response:", data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in forceTriggerScraper:', error);
    return { success: false, error };
  }
};

// Remove ensureTendersExist function as we don't want to create sample data anymore
