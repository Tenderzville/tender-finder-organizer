
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useTenderRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const refreshTenderFeed = async (): Promise<void> => {
    try {
      setIsRefreshing(true);
      toast({
        title: "Refreshing tenders",
        description: "Fetching the latest tenders...",
      });

      // First, try to use Browser AI to get tenders
      console.log("Triggering Browser AI tender fetching");
      const { data: browserAIData, error: browserAIError } = await supabase.functions.invoke(
        'browser-ai-tenders/fetch-browser-ai'
      );

      if (browserAIError) {
        console.error("Error fetching tenders via Browser AI:", browserAIError);
        throw new Error(`Browser AI error: ${browserAIError.message}`);
      }

      if (browserAIData?.success && browserAIData.totalInserted > 0) {
        toast({
          title: "Tenders refreshed",
          description: `Successfully imported ${browserAIData.totalInserted} tenders from external sources`,
        });
        return;
      }

      // If Browser AI doesn't work, try the scraper directly
      console.log("No tenders from Browser AI, trying direct scraper");
      const { data, error } = await supabase.functions.invoke('scrape-tenders', {
        body: { force: true, useApiLayer: true }
      });
      
      if (error) {
        console.error("Error triggering scraper:", error);
        throw error;
      }
      
      toast({
        title: "Scraper triggered",
        description: "Tenders will be updated shortly",
      });
    } catch (err) {
      console.error("Failed to refresh tenders:", err);
      toast({
        title: "Error",
        description: "Failed to refresh tenders. Please try again.",
        variant: "destructive"
      });
      
      // Add detailed error logging
      console.error("Detailed refresh error:", JSON.stringify(err, null, 2));
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    refreshTenderFeed
  };
}
