
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
    console.log("Force triggering scraper with all required parameters");
    
    // Always use these critical parameters to ensure scraping works
    const { data, error } = await supabase.functions.invoke('scrape-tenders', {
      body: { 
        force: true, 
        useApiLayer: true,
        fullScrape: true,
        skipCache: true
      }
    });
    
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

// Add a function to directly check if tenders exist and force creation if needed
export const ensureTendersExist = async () => {
  try {
    // First check if tenders exist
    const { data, error: tendersError, count } = await supabase
      .from('tenders')
      .select('count', { count: 'exact', head: true });
    
    if (tendersError) {
      console.error('Error checking tenders count:', tendersError);
      return { success: false, error: tendersError };
    }
    
    // If no tenders exist, force trigger the scraper
    if (count === 0) {
      console.log("No tenders found, forcing scraper to run");
      return await forceTriggerScraper();
    }
    
    return { success: true, count };
  } catch (error) {
    console.error('Error in ensureTendersExist:', error);
    return { success: false, error };
  }
};
