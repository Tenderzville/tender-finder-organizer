
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { forceTriggerScraper } from "@/lib/supabase-client";

export function useTenderRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const refreshTenderFeed = async (): Promise<void> => {
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
      
      toast({
        title: "Scraper Triggered",
        description: "Tender scraping in progress, refreshing page...",
      });
      
      // Force reload the page to get the new data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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
