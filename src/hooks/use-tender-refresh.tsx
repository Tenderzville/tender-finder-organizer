
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
        description: "Fetching the latest tenders from all sources...",
      });

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
          errors.push("Browser AI fetch failed");
        } else if (browserData?.success && browserData.totalInserted > 0) {
          totalImported += browserData.totalInserted;
          successMessages.push(`${browserData.totalInserted} from Browser AI`);
        }
      } else {
        console.error("Browser AI promise rejected:", browserAIResult.reason);
        errors.push("Browser AI connection failed");
      }

      // Process SheetDB results  
      if (sheetDBResult.status === 'fulfilled') {
        const { data: sheetData, error: sheetError } = sheetDBResult.value;
        if (sheetError) {
          console.error("SheetDB error:", sheetError);
          errors.push("SheetDB fetch failed");
        } else if (sheetData?.success && sheetData.totalImported > 0) {
          totalImported += sheetData.totalImported;
          successMessages.push(`${sheetData.totalImported} from SheetDB`);
        }
      } else {
        console.error("SheetDB promise rejected:", sheetDBResult.reason);
        errors.push("SheetDB connection failed");
      }

      // Show appropriate toast based on results
      if (totalImported > 0) {
        toast({
          title: "Tenders refreshed successfully",
          description: `Imported ${totalImported} tenders total (${successMessages.join(', ')})`,
        });
      } else if (errors.length > 0) {
        toast({
          title: "Partial refresh completed",
          description: errors.length > 0 ? `Issues: ${errors.join(', ')}` : "No new tenders found from any source",
          variant: errors.length === 2 ? "destructive" : "default"
        });
      } else {
        toast({
          title: "Refresh completed",
          description: "No new tenders found from any source",
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
