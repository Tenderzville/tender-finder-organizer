
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
        description: "Fetching the latest tenders from real sources...",
      });

      // Use Browser AI to get real tenders only
      console.log("Triggering Browser AI tender fetching");
      const { data: browserAIData, error: browserAIError } = await supabase.functions.invoke(
        'browser-ai-tenders/fetch-browser-ai'
      );

      if (browserAIError) {
        console.error("Error fetching tenders via Browser AI:", browserAIError);
        throw new Error(`Failed to fetch real tender data: ${browserAIError.message}`);
      }

      if (browserAIData?.success && browserAIData.totalInserted > 0) {
        toast({
          title: "Tenders refreshed",
          description: `Successfully imported ${browserAIData.totalInserted} real tenders from external sources`,
        });
        return;
      }

      // If no real tenders found, inform user
      toast({
        title: "No tenders available",
        description: "No real tenders found from external sources. Please check Browser AI configuration.",
        variant: "destructive"
      });
      
    } catch (err) {
      console.error("Failed to refresh tenders:", err);
      toast({
        title: "Error",
        description: "Failed to refresh tenders from real sources. Please check your Browser AI configuration.",
        variant: "destructive"
      });
      
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
