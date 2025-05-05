
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { forceTriggerScraper, supabase, checkScraperStatus } from "@/lib/supabase-client";

export function useTenderRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const refreshTenderFeed = async (): Promise<void> => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      toast({
        title: "Refreshing Tenders",
        description: "Fetching real-time tenders from official sources...",
      });
      
      // First check the status
      const statusCheck = await checkScraperStatus();
      
      if (statusCheck.error) {
        console.error("Status check failed:", statusCheck.error);
        toast({
          title: "Status Check Failed",
          description: "Could not verify scraper status. Will attempt direct API access.",
          variant: "destructive",
        });
      } else {
        console.log("Scraper status:", statusCheck.data);
      }
      
      // Then force trigger the scraper
      const result = await forceTriggerScraper();
      
      if (!result.success) {
        throw new Error("Failed to trigger scraper: " + (result.error?.message || "Unknown error"));
      }
      
      toast({
        title: "Tender Fetching In Progress",
        description: "Accessing tender data directly from the official API. The page will refresh automatically when complete.",
      });
      
      // Set up a polling interval to check for new tenders
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkForTenders = async () => {
        attempts++;
        
        // Get the current count
        const { count, error } = await supabase
          .from('tenders')
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.error("Error checking tender count:", error);
          toast({
            title: "Error",
            description: "Failed to check for new tenders.",
            variant: "destructive",
          });
          setIsRefreshing(false);
          return;
        }
          
        if (count && count > 0) {
          toast({
            title: "Tenders Found!",
            description: `Found ${count} tenders. Refreshing page...`,
          });
          
          // Force reload the page to get the new data
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
          return;
        }
        
        if (attempts < maxAttempts) {
          toast({
            title: "Searching for tenders",
            description: `Attempt ${attempts}/${maxAttempts}. This may take a moment...`,
          });
          
          // Check status every 2 attempts
          if (attempts % 2 === 0) {
            const statusCheck = await checkScraperStatus();
            if (statusCheck.data?.api_scrape_successful || statusCheck.data?.direct_scrape_successful) {
              toast({
                title: "Direct data access successful",
                description: "Found tenders via direct API access. Refreshing page...",
              });
              
              setTimeout(() => {
                window.location.reload();
              }, 1500);
              
              return;
            }
          }
          
          // Wait before checking again
          setTimeout(checkForTenders, 15000);
        } else {
          toast({
            title: "No tenders found",
            description: "Could not retrieve tenders at this time. API access may be temporarily restricted.",
            variant: "destructive",
          });
          
          setIsRefreshing(false);
        }
      };
      
      // Start checking for new tenders after a delay
      setTimeout(checkForTenders, 5000);
      
    } catch (err) {
      console.error("Failed to refresh tender feed:", err);
      toast({
        title: "Refresh Error",
        description: "Could not refresh tenders: " + (err.message || "Unknown error"),
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    refreshTenderFeed
  };
}
