
import { supabase } from "@/integrations/supabase/client";
import { Tender, parseTenderAffirmativeAction, getTenderStatus } from "@/types/tender";

export async function fetchLatestTenders(): Promise<Tender[]> {
  console.log("Fetching latest real tenders from database...");
  
  try {
    // Fetch real tenders only (exclude sample data)
    const { data: tenders, error } = await supabase
      .from('tenders')
      .select('*')
      .neq('source', 'sample') // Exclude sample data
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) {
      console.error("Error fetching tenders:", error);
      throw error;
    }
    
    // If we have tenders, return them
    if (tenders && tenders.length > 0) {
      console.log(`Found ${tenders.length} real tenders`);
      return tenders.map(tender => ({
        ...tender,
        affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action),
        status: getTenderStatus(tender.deadline)
      }));
    }
    
    console.log("No real tenders found in database");
    
    // If no tenders, try to fetch them from Browser AI
    console.log("Triggering Browser AI fetch for real tenders");
    try {
      const { data, error } = await supabase.functions.invoke('browser-ai-tenders/fetch-browser-ai');
      
      if (error) {
        console.error("Error calling Browser AI function:", error);
        throw error;
      }
      
      console.log("Browser AI fetch response:", data);
      
      // Wait a moment for the data to be available in the database
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch again after Browser AI import
      const { data: refreshedTenders, error: refreshError } = await supabase
        .from('tenders')
        .select('*')
        .neq('source', 'sample') // Only real tenders
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (refreshError) {
        console.error("Error fetching refreshed tenders:", refreshError);
        throw refreshError;
      }
      
      if (refreshedTenders && refreshedTenders.length > 0) {
        console.log(`Found ${refreshedTenders.length} real tenders after Browser AI fetch`);
        return refreshedTenders.map(tender => ({
          ...tender,
          affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action),
          status: getTenderStatus(tender.deadline)
        }));
      }
    } catch (browserAIError) {
      console.error("Browser AI fetch failed:", browserAIError);
    }
    
    // Return empty array if no real tenders available
    console.log("No real tenders available from any source");
    return [];
  } catch (error) {
    console.error("Error in fetchLatestTenders:", error);
    return [];
  }
}

export async function getTotalTendersCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true })
      .neq('source', 'sample'); // Only count real tenders
    
    if (error) {
      console.error("Error counting tenders:", error);
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error("Error in getTotalTendersCount:", error);
    return 0;
  }
}

export async function triggerBrowserAIFetch(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Triggering Browser AI fetch for real tenders...");
    
    const { data, error } = await supabase.functions.invoke('browser-ai-tenders/fetch-browser-ai');
    
    if (error) {
      console.error("Error triggering Browser AI fetch:", error);
      return { 
        success: false, 
        message: `Error: ${error.message || "Failed to fetch from Browser AI"}` 
      };
    }
    
    if (data?.success) {
      console.log(`Successfully imported ${data.totalInserted || 0} real tenders from Browser AI`);
      return { 
        success: true, 
        message: `Successfully imported ${data.totalInserted || 0} real tenders from Browser AI` 
      };
    } else {
      console.log("Browser AI fetch didn't report success:", data);
      return { 
        success: false, 
        message: data?.message || "Browser AI fetch failed or returned no real tenders" 
      };
    }
  } catch (error) {
    console.error("Exception in triggerBrowserAIFetch:", error);
    return { 
      success: false, 
      message: `Exception: ${error.message || "An unexpected error occurred"}` 
    };
  }
}
