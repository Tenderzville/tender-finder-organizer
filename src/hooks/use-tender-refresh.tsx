
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
        
        // Fallback to creating sample data
        console.log("Browser AI failed, creating sample data");
        const { data: sampleData, error: sampleError } = await supabase.functions.invoke(
          'browser-ai-tenders/create-samples'
        );
        
        if (sampleError) {
          console.error("Error creating sample data:", sampleError);
          throw new Error(`Failed to create sample data: ${sampleError.message}`);
        }
        
        toast({
          title: "Sample tenders created",
          description: `Created ${sampleData?.totalInserted || 0} sample tenders for demonstration`,
        });
        return;
      }

      if (browserAIData?.success && browserAIData.totalInserted > 0) {
        toast({
          title: "Tenders refreshed",
          description: `Successfully imported ${browserAIData.totalInserted} tenders from external sources`,
        });
        return;
      }

      // If Browser AI doesn't return tenders, create sample data
      console.log("No tenders from Browser AI, creating sample data");
      const { data: sampleData, error: sampleError } = await supabase.functions.invoke(
        'browser-ai-tenders/create-samples'
      );
      
      if (sampleError) {
        console.error("Error creating sample data:", sampleError);
        throw sampleError;
      }
      
      toast({
        title: "Sample tenders created",
        description: `Created ${sampleData?.totalInserted || 0} sample tenders for demonstration`,
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
