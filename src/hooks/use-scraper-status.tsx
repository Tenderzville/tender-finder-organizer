
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScraperStatusData } from "@/types/scraper";
import { 
  checkScraperStatus, 
  forceTriggerScraper, 
  renderRelativeTime, 
  getSourcesStatus 
} from "@/utils/scraper-utils";

export function useScraperStatus() {
  const [status, setStatus] = useState<ScraperStatusData>({
    lastRun: null,
    status: 'idle',
    tendersFound: 0,
    agpoTendersFound: 0,
    sources: [
      { name: 'Tenders.go.ke', count: 0, status: 'idle' },
      { name: 'Private Sector', count: 0, status: 'idle' },
      { name: 'AGPO Tenders', count: 0, status: 'idle' }
    ],
    diagnostics: null,
    apiLayerConfigured: false
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      setIsRefreshing(true);
      
      // Get status from function
      const functionData = await checkScraperStatus();
      
      if (functionData) {
        // Count AGPO tenders
        const { count: agpoCount } = await supabase
          .from('tenders')
          .select('count', { count: 'exact', head: true })
          .not('affirmative_action', 'is', null);
        
        // Update status with data from the function
        setStatus({
          lastRun: functionData.last_check || null,
          status: functionData.scraper_available ? 'idle' : 'failed',
          tendersFound: functionData.total_tenders || 0,
          agpoTendersFound: agpoCount || 0,
          sources: getSourcesStatus(functionData),
          diagnostics: functionData.diagnostics || null,
          apiLayerConfigured: functionData.api_layer_available || false,
          apiLayerStatus: functionData.api_layer_status
        });
      }
    } catch (err) {
      console.error("Error fetching scraper status:", err);
      toast({
        title: "Error",
        description: "Failed to fetch scraper status",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const triggerScraper = async () => {
    try {
      setIsRefreshing(true);
      await forceTriggerScraper();
      await new Promise(resolve => setTimeout(resolve, 3000));
      await fetchStatus();
    } catch (error) {
      console.error("Error triggering scraper:", error);
      toast({
        title: "Error",
        description: "Failed to trigger scraper",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    status,
    isRefreshing,
    fetchStatus,
    renderRelativeTime,
    triggerScraper
  };
}
