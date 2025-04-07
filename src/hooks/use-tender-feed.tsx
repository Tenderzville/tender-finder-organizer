
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseTenderAffirmativeAction, Tender } from "@/types/tender";

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
      
      const { data: latestTenders, error: tendersError } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (tendersError) {
        console.error("Error fetching tenders from database:", tendersError);
        throw tendersError;
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
    retry: 1,
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
      
      const { data: result, error: invokeError } = await supabase.functions.invoke('scrape-tenders', {
        body: { force: true }
      });
      
      if (invokeError) {
        console.error("Error invoking scrape-tenders function:", invokeError);
        throw invokeError;
      }
      
      console.log("Scrape function response:", result);
      
      if (result?.success === false) {
        console.error("Scrape function failed:", result?.error);
        throw new Error(result?.error || "Unknown error occurred during scraping");
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await refetch();
      
      toast({
        title: "Feed Refreshed",
        description: `Found ${result?.tenders_scraped || 0} new tenders`,
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
