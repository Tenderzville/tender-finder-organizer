
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenderSamples } from "@/hooks/use-tender-samples";

export function useTenderRefresh({ fetchTenders }: { fetchTenders: () => Promise<any> }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const { initializeSampleTenders } = useTenderSamples();

  const handleRefreshTenders = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setApiError(null);
    
    try {
      toast({
        title: "Refreshing tenders",
        description: "Retrieving latest tender data...",
      });
      
      // Check if we need to create sample data
      const { count, error: countError } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error("Error counting tenders:", countError);
        throw countError;
      }
      
      if (count === 0) {
        await initializeSampleTenders();
      } else {
        // Trigger a fresh scrape using the API Layer
        const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke(
          'scrape-tenders',
          {
            body: { 
              force: true,
              useApiLayer: true 
            }
          }
        );
        
        if (scrapeError) {
          console.error("Error triggering scrape:", scrapeError);
          throw scrapeError;
        }
        
        console.log("Scrape result:", scrapeResult);
        
        // Wait a moment for data to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Try to fetch fresh data
      await fetchTenders();
      
      toast({
        title: "Tenders updated",
        description: "Successfully refreshed tenders data.",
      });
    } catch (err) {
      console.error("Error refreshing tenders:", err);
      setApiError("Failed to refresh tenders. Please try again later.");
      toast({
        title: "Refresh failed",
        description: "Could not refresh tenders. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    handleRefreshTenders,
    isRefreshing,
    apiError,
    setApiError
  };
}
