
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseTenderAffirmativeAction, Tender } from "@/types/tender";
import { forceTriggerScraper, ensureTendersExist } from "@/lib/supabase-client";

export function useTenderFeed() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forceStableView, setForceStableView] = useState(false);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [showQualificationTool, setShowQualificationTool] = useState(false);

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
      console.log("TenderFeed: Fetching latest tenders");
      
      // First ensure we have tenders
      const checkResult = await ensureTendersExist();
      if (!checkResult.success) {
        console.log("Initial tender check failed, will try direct database query");
      }
      
      const { data: latestTenders, error: tendersError } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (tendersError) {
        console.error("Error fetching tenders from database:", tendersError);
        throw tendersError;
      }
      
      // If no tenders found, try to force trigger the scraper
      if (!latestTenders || latestTenders.length === 0) {
        console.log("No tenders found, force triggering scraper");
        await forceTriggerScraper();
        
        // Try fetching again after scraper is triggered
        const { data: retriedTenders, error: retriedError } = await supabase
          .from('tenders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (retriedError) {
          console.error("Error in retry fetch:", retriedError);
          throw retriedError;
        }
        
        if (retriedTenders && retriedTenders.length > 0) {
          console.log(`Successfully fetched ${retriedTenders.length} tenders after retry`);
          
          const { count, error: countError } = await supabase
            .from('tenders')
            .select('*', { count: 'exact', head: true });
          
          if (countError) {
            console.error("Error counting tenders:", countError);
          }
          
          const formattedTenders = retriedTenders.map(tender => ({
            ...tender,
            affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action)
          }));
          
          return {
            latest_tenders: formattedTenders,
            total_tenders: count || retriedTenders.length,
            last_scrape: new Date().toISOString(),
            source: "database_after_retry"
          };
        }
      }
      
      const { count, error: countError } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error("Error counting tenders:", countError);
      }
      
      const formattedTenders = latestTenders?.map(tender => ({
        ...tender,
        affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action)
      })) || [];
      
      return {
        latest_tenders: formattedTenders,
        total_tenders: count || 0,
        last_scrape: new Date().toISOString(),
        source: "database"
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: false,
    retry: 3, // Increase retry count
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 10
  });

  const isLoading = rawIsLoading || forceStableView;

  useEffect(() => {
    let isMounted = true;
    
    const initialFetch = async () => {
      try {
        if (isMounted) {
          await refetch();
        }
      } catch (err) {
        console.error("Failed initial tender feed fetch:", err);
      }
    };
    
    initialFetch();
    
    return () => {
      isMounted = false;
    };
  }, [refetch]);

  const refreshTenderFeed = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setForceStableView(true);
    
    try {
      toast({
        title: "Refreshing Tenders",
        description: "Starting the tender scraping process...",
      });
      
      console.log("Force triggering scraper for refresh");
      const result = await forceTriggerScraper();
      
      if (!result.success) {
        throw new Error("Failed to trigger scraper");
      }
      
      // Wait to allow scraping to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await refetch();
      
      toast({
        title: "Feed Refreshed",
        description: `Tender data refreshed successfully`,
      });
    } catch (err) {
      console.error("Failed to refresh tender feed:", err);
      
      try {
        await refetch();
        toast({
          title: "Refresh Attempted",
          description: "Fetched latest tenders from database.",
        });
      } catch (dbErr) {
        console.error("Database refresh also failed:", dbErr);
        toast({
          title: "Refresh Error",
          description: "Could not refresh tenders. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setForceStableView(false);
      }, 500);
    }
  }, [refetch, toast, isRefreshing]);

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
