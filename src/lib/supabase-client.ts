
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

// Function to trigger Browser AI tender fetching
export const fetchTendersViaBrowserAI = async () => {
  try {
    console.log("Triggering Browser AI tender fetching");
    
    const { data, error } = await supabase.functions.invoke('browser-ai-tenders/fetch-browser-ai');
    
    if (error) {
      console.error('Error fetching tenders via Browser AI:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in fetchTendersViaBrowserAI:', error);
    return { success: false, error };
  }
};

// Function to import tenders from sample sheets
export const importTendersFromSheets = async () => {
  try {
    console.log("Importing tenders from sample sheets");
    
    const { data, error } = await supabase.functions.invoke('browser-ai-tenders/import-sample-sheets');
    
    if (error) {
      console.error('Error importing tenders from sheets:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in importTendersFromSheets:', error);
    return { success: false, error };
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
    
    // Try importing from sheets first
    try {
      console.log("Attempting to import from sample sheets...");
      const { data: sheetsData, error: sheetsError } = await supabase.functions.invoke('browser-ai-tenders/import-sample-sheets');
      
      if (sheetsError) {
        console.error('Error importing from sheets:', sheetsError);
      } else if (sheetsData?.success && sheetsData.totalImported > 0) {
        console.log('Sheets import successful:', sheetsData);
        return { success: true, data: sheetsData };
      }
    } catch (sheetsErr) {
      console.error('Error calling sheets import:', sheetsErr);
    }
    
    // Try Browser AI integration next
    try {
      console.log("Attempting Browser AI tender fetching...");
      const { data: browserAIData, error: browserAIError } = await supabase.functions.invoke('browser-ai-tenders/fetch-browser-ai');
      
      if (browserAIError) {
        console.error('Error with Browser AI integration:', browserAIError);
      } else if (browserAIData?.success) {
        console.log('Browser AI integration successful:', browserAIData);
        return { success: true, data: browserAIData };
      }
    } catch (browserAIErr) {
      console.error('Error calling Browser AI integration:', browserAIErr);
    }
    
    // Next try the direct API approach through check-scraper-status
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
