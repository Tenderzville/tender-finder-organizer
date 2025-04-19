
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { checkScraperStatus, forceTriggerScraper } from "@/lib/supabase-client";

export interface ScraperStatusData {
  lastRun: string | null;
  status: 'idle' | 'running' | 'success' | 'failed';
  tendersFound: number;
  agpoTendersFound: number;
  sources: {name: string, count: number, status: string}[];
  diagnostics: any | null;
  apiLayerConfigured: boolean;
  apiLayerStatus?: string;
}

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

  const fetchStatus = async () => {
    try {
      setIsRefreshing(true);
      
      // Try to call the check-scraper-status edge function
      const { data: functionData, error: functionError } = await checkScraperStatus();
      
      if (!functionError && functionData) {
        console.log("Received data from check-scraper-status function:", functionData);
        
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
          sources: [
            { 
              name: 'Tenders.go.ke', 
              count: functionData.latest_tenders?.filter((t: any) => t.source === 'tenders.go.ke')?.length || 0,
              status: functionData.scraper_available ? 'idle' : 'failed'
            },
            { 
              name: 'Private Sector', 
              count: functionData.latest_tenders?.filter((t: any) => t.source === 'private')?.length || 0,
              status: functionData.scraper_available ? 'idle' : 'failed'
            },
            { 
              name: 'AGPO Tenders', 
              count: functionData.latest_tenders?.filter((t: any) => 
                t.affirmative_action && t.affirmative_action.type !== 'none')?.length || 0,
              status: functionData.scraper_available ? 'idle' : 'failed'
            }
          ],
          diagnostics: functionData.diagnostics || null,
          apiLayerConfigured: functionData.api_layer_available || false,
          apiLayerStatus: functionData.api_layer_status || undefined
        });
        
        return;
      } else {
        console.error("Error getting scraper status from function:", functionError);
      }

      // If function fails, force trigger scraper to get fresh data
      console.log("Function call failed, triggering scraper directly");
      await forceTriggerScraper();

      // Fallback: Fetch status from database directly
      const { data, error } = await supabase
        .from('scraping_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const log = data[0];

        // Count AGPO tenders
        const { count: agpoCount } = await supabase
          .from('tenders')
          .select('count', { count: 'exact', head: true })
          .not('affirmative_action', 'is', null);

        // Get total tenders count
        const { count: totalCount } = await supabase
          .from('tenders')
          .select('count', { count: 'exact', head: true });

        setStatus({
          lastRun: log.created_at,
          status: log.status === 'success' ? 'success' : 
                  log.status === 'in_progress' ? 'running' : 
                  log.status === 'error' ? 'failed' : 'idle',
          tendersFound: totalCount || 0,
          agpoTendersFound: agpoCount || 0,
          sources: [
            { 
              name: 'Tenders.go.ke', 
              count: log.source === 'tenders.go.ke' ? (log.records_found || 0) : 0,
              status: log.source === 'tenders.go.ke' ? log.status : 'idle'
            },
            { 
              name: 'Private Sector', 
              count: log.source === 'private' ? (log.records_found || 0) : 0,
              status: log.source === 'private' ? log.status : 'idle'
            },
            { 
              name: 'AGPO Tenders', 
              count: agpoCount || 0,
              status: 'idle'
            }
          ],
          diagnostics: null,
          apiLayerConfigured: log.source === 'api_layer'
        });
      }
    } catch (error) {
      console.error('Error fetching scraper status:', error);
      
      // Trigger the scraper as a last resort
      try {
        console.log("Triggering scraper due to error in status check");
        await forceTriggerScraper();
      } catch (triggerError) {
        console.error("Failed to trigger scraper:", triggerError);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStatus();
    
    // Set up a refresh interval
    const intervalId = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const renderRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return new Date(dateString).toLocaleString();
    }
  };

  // Add a manual trigger function
  const triggerScraper = async () => {
    try {
      setIsRefreshing(true);
      console.log("Manually triggering scraper");
      
      const result = await forceTriggerScraper();
      
      if (result.success) {
        // Wait a moment for the operation to begin
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Then fetch the status
        await fetchStatus();
      } else {
        console.error("Failed to trigger scraper:", result.error);
      }
    } catch (error) {
      console.error("Error triggering scraper:", error);
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
