
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { setupEmergencyTenders } from "@/utils/emergencyTenderSetup";

export function useTenderRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const refreshTenderFeed = async (): Promise<void> => {
    try {
      setIsRefreshing(true);
      toast({
        title: "Refreshing tenders",
        description: "Fetching the latest tenders from all sources...",
      });

      // Check if we have any tenders at all
      const { count: existingCount } = await supabase
        .from("tenders")
        .select("*", { count: "exact", head: true });

      // If no tenders exist, set up emergency tenders first
      if (!existingCount || existingCount === 0) {
        console.log("No tenders found, setting up emergency tenders...");
        const emergencyResult = await setupEmergencyTenders();
        
        if (emergencyResult.success) {
          toast({
            title: "Emergency tenders loaded",
            description: `Added ${emergencyResult.count} sample tenders while data sources are being fixed`,
          });
        }
      }

      // Parallel fetch from both Browser AI and SheetDB
      const [browserAIResult, sheetDBResult] = await Promise.allSettled([
        // Browser AI fetch
        supabase.functions.invoke('browser-ai-tenders/fetch-browser-ai'),
        // SheetDB fetch  
        supabase.functions.invoke('sync-google-sheets-to-supabase')
      ]);

      let totalImported = 0;
      let successMessages: string[] = [];
      let errors: string[] = [];

      // Process Browser AI results
      if (browserAIResult.status === 'fulfilled') {
        const { data: browserData, error: browserError } = browserAIResult.value;
        if (browserError) {
          console.error("Browser AI error:", browserError);
          errors.push("Browser AI: Credits exhausted");
        } else if (browserData?.success && browserData.totalInserted > 0) {
          totalImported += browserData.totalInserted;
          successMessages.push(`${browserData.totalInserted} from Browser AI`);
        } else {
          errors.push("Browser AI: No new data");
        }
      } else {
        console.error("Browser AI promise rejected:", browserAIResult.reason);
        errors.push("Browser AI: Connection failed");
      }

      // Process SheetDB results  
      if (sheetDBResult.status === 'fulfilled') {
        const { data: sheetData, error: sheetError } = sheetDBResult.value;
        if (sheetError) {
          console.error("SheetDB error:", sheetError);
          errors.push("SheetDB: API error");
        } else if (sheetData?.success && sheetData.totalImported > 0) {
          totalImported += sheetData.totalImported;
          successMessages.push(`${sheetData.totalImported} from SheetDB`);
        } else {
          errors.push("SheetDB: No data in sheets");
        }
      } else {
        console.error("SheetDB promise rejected:", sheetDBResult.reason);
        errors.push("SheetDB: Connection failed");
      }

      // Show appropriate toast based on results
      if (totalImported > 0) {
        toast({
          title: "Tenders refreshed successfully",
          description: `Imported ${totalImported} new tenders (${successMessages.join(', ')})`,
        });
      } else {
        toast({
          title: "Data source issues detected",
          description: `Issues: ${errors.join(', ')}. Using existing/sample data.`,
          variant: "default"
        });
      }
      
    } catch (err) {
      console.error("Failed to refresh tenders:", err);
      toast({
        title: "Error",
        description: "Failed to refresh tenders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    refreshTenderFeed
  };
}
