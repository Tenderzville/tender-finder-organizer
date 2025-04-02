
import { supabase } from "@/integrations/supabase/client";

// Re-export supabase client from the integrations directory
export { supabase };

// Add any additional utilities related to Supabase here
export const getScraperStatus = async () => {
  try {
    const { data, error } = await supabase
      .from('scraper_status')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) {
      throw error;
    }
    
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('Error fetching scraper status:', error);
    return { data: null, error };
  }
};
