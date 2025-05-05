
import { supabase } from "@/integrations/supabase/client";

// Re-export supabase client from the integrations directory
export { supabase };

// Add a specific function for scraper status to centralize the logic
export const checkScraperStatus = async () => {
  try {
    // Try to call the edge function directly
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
    
    // First try the direct API approach through check-scraper-status
    console.log("Attempting direct API tender fetching...");
    const { data: statusData, error: statusError } = await supabase.functions.invoke('check-scraper-status');
    
    if (statusError) {
      console.error('Error checking scraper status:', statusError);
    } else {
      console.log('Scraper status check result:', statusData);
      
      // If the direct API method worked, return success
      if (statusData.api_scrape_successful || statusData.direct_scrape_successful) {
        console.log("Successfully fetched tenders via direct methods!");
        return { success: true, data: statusData };
      }
    }
    
    // Fallback to the original scraper
    console.log("Direct methods didn't yield results. Falling back to original scraper...");
    // Direct access to mygov.go.ke to attempt proxy bypass
    const { data: apiLayerData, error: apiLayerError } = await supabase.functions.invoke('scrape-tenders', {
      body: { 
        force: true, 
        useApiLayer: true,
        fullScrape: true,
        skipCache: true,
        verboseLogging: true,
        priority: 1,
        directUrls: [
          'https://www.mygov.go.ke/all-tenders',
          'https://tenders.go.ke/website/tenders/index'
        ]
      }
    });

    if (apiLayerError) {
      console.error('Error triggering main scraper:', apiLayerError);
      return { success: false, error: apiLayerError };
    }
    
    console.log("Scraper trigger response:", apiLayerData);
    
    return { success: true, data: apiLayerData };
  } catch (error) {
    console.error('Error in forceTriggerScraper:', error);
    return { success: false, error };
  }
};
