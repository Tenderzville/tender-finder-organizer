
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ensureTendersExist } from "@/lib/supabase-client";
import { fetchLatestTenders, getTotalTendersCount } from "@/utils/tenderFetching";
import { useTenderRefresh } from "@/hooks/use-tender-refresh";
import { useSampleTenders } from "@/hooks/use-sample-tenders";
import type { Tender } from "@/types/tender";

export function useTenderFeed() {
  const { toast } = useToast();
  const [forceStableView, setForceStableView] = useState(false);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [showQualificationTool, setShowQualificationTool] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const { isRefreshing, refreshTenderFeed } = useTenderRefresh();
  const { createSampleTenders } = useSampleTenders();

  useEffect(() => {
    setForceStableView(true);
    const timer = setTimeout(() => {
      setForceStableView(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const { 
    data, 
    isLoading: rawIsLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["dashboard-tenders"],
    queryFn: async () => {
      console.log("TenderFeed: Fetching latest tenders, attempt #", retryAttempts + 1);
      
      const checkResult = await ensureTendersExist();
      
      if (!checkResult.success) {
        console.log("Initial tender check failed, will try direct database query");
      } else if (checkResult.sampleTendersCreated && checkResult.tenders) {
        return {
          latest_tenders: checkResult.tenders,
          total_tenders: checkResult.tenders.length,
          last_scrape: new Date().toISOString(),
          source: "direct_sample_creation"
        };
      }
      
      const latestTenders = await fetchLatestTenders();
      const totalTenders = await getTotalTendersCount();
      
      return {
        latest_tenders: latestTenders,
        total_tenders: totalTenders,
        last_scrape: new Date().toISOString(),
        source: "database"
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: false,
    retry: 3,
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 10
  });

  const isLoading = rawIsLoading || forceStableView;

  useEffect(() => {
    let isMounted = true;
    
    const initialFetch = async () => {
      try {
        if (isMounted) {
          setRetryAttempts(prev => prev + 1);
          await refetch();
        }
      } catch (err) {
        console.error("Failed initial tender feed fetch:", err);
        
        if (retryAttempts >= 2) {
          const createdTenders = await createSampleTenders();
          if (createdTenders) {
            await refetch();
          }
        }
      }
    };
    
    initialFetch();
    
    return () => {
      isMounted = false;
    };
  }, [refetch, retryAttempts, createSampleTenders]);

  const tendersToDisplay = data?.latest_tenders as Tender[] || [];

  return {
    data,
    tendersToDisplay,
    isLoading,
    error,
    isRefreshing,
    forceStableView,
    language,
    showQualificationTool,
    setShowQualificationTool,
    setLanguage,
    refreshTenderFeed,
    refetch
  };
}

