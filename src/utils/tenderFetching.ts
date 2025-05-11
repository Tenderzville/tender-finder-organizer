import { supabase } from "@/integrations/supabase/client";
import { Tender, parseTenderAffirmativeAction, getTenderStatus } from "@/types/tender";

export async function fetchLatestTenders(): Promise<Tender[]> {
  console.log("Fetching latest tenders from database...");
  
  try {
    // First check if there are tenders already in the database
    const { data: existingTenders, error: existingError } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (existingError) {
      console.error("Error fetching existing tenders:", existingError);
      throw existingError;
    }
    
    // If we have tenders, return them
    if (existingTenders && existingTenders.length > 0) {
      console.log(`Found ${existingTenders.length} existing tenders`);
      return existingTenders.map(tender => ({
        ...tender,
        affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action),
        status: getTenderStatus(tender.deadline)
      }));
    }
    
    console.log("No existing tenders found, importing from Google Sheets...");
    
    // Try to import from Google Sheets (now creates sample data)
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-sheets-to-supabase');
      
      if (error) {
        console.error("Error importing from Google Sheets:", error);
        throw error;
      }
      
      console.log("Google Sheets import response:", data);
      
      // Fetch the newly imported tenders
      const { data: importedTenders, error: importError } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (importError) {
        console.error("Error fetching imported tenders:", importError);
        throw importError;
      }
      
      if (importedTenders && importedTenders.length > 0) {
        console.log(`Found ${importedTenders.length} imported tenders`);
        return importedTenders.map(tender => ({
          ...tender,
          affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action),
          status: getTenderStatus(tender.deadline)
        }));
      }
    } catch (importError) {
      console.error("Error in Google Sheets import process:", importError);
    }
    
    // If all else fails, return an empty array
    return [];
  } catch (error) {
    console.error("Error in fetchLatestTenders:", error);
    throw error;
  }
}

export async function getTotalTendersCount(): Promise<number> {
  try {
    const queryResult = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });
    
    if (queryResult.error) {
      console.error("Error counting tenders:", queryResult.error);
      throw queryResult.error;
    }
    
    return queryResult.count || 0;
  } catch (error) {
    console.error("Error in getTotalTendersCount:", error);
    return 0;
  }
}

export async function triggerGoogleSheetsSync(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Triggering Google Sheets sync...");
    
    const { data, error } = await supabase.functions.invoke('sync-google-sheets-to-supabase');
    
    if (error) {
      console.error("Error triggering Google Sheets sync:", error);
      return { 
        success: false, 
        message: `Error: ${error.message || "Failed to synchronize with Google Sheets"}` 
      };
    }
    
    if (data?.success) {
      console.log(`Successfully imported ${data.totalImported || 0} tenders from Google Sheets`);
      return { 
        success: true, 
        message: `Successfully imported ${data.totalImported || 0} tenders from Google Sheets` 
      };
    } else {
      console.log("Google Sheets sync didn't report success:", data);
      return { 
        success: false, 
        message: data?.message || "No tenders were imported from Google Sheets" 
      };
    }
  } catch (error) {
    console.error("Exception in triggerGoogleSheetsSync:", error);
    return { 
      success: false, 
      message: `Exception: ${error.message || "An unexpected error occurred"}` 
    };
  }
}
