
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { forceTriggerScraper } from "@/lib/supabase-client";

export function useTenderRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const refreshTenderFeed = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      toast({
        title: "Refreshing Tenders",
        description: "Starting the tender scraping process...",
      });
      
      const result = await forceTriggerScraper();
      
      if (!result.success) {
        throw new Error("Failed to trigger scraper");
      }
      
      // Wait to allow scraping to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      toast({
        title: "Feed Refreshed",
        description: `Tender data refreshed successfully`,
      });
    } catch (err) {
      console.error("Failed to refresh tender feed:", err);
      toast({
        title: "Refresh Error",
        description: "Could not refresh tenders. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  return {
    isRefreshing,
    refreshTenderFeed
  };
}
