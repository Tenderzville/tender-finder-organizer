
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchLatestTendersOptimized, getTotalTendersCountOptimized, clearTenderCache } from "@/utils/optimizedTenderFetching";
import { useTenderRefresh } from "@/hooks/use-tender-refresh";
import type { Tender } from "@/types/tender";
import { matchTenderToSupplier } from "@/utils/tenderAnalysis";
import { supabase } from "@/integrations/supabase/client";

export function useTenderFeed() {
  const { toast } = useToast();
  const [forceStableView, setForceStableView] = useState(false);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [showQualificationTool, setShowQualificationTool] = useState(false);
  const { isRefreshing, refreshTenderFeed } = useTenderRefresh();
  const [userProfile, setUserProfile] = useState<{
    areas_of_expertise: string[];
    industry: string;
    location: string;
  } | null>(null);
  const [lastScraped, setLastScraped] = useState<string | null>(null);
  const [sourcesBreakdown, setSourcesBreakdown] = useState<{name: string, count: number, status: string}[]>([]);

  useEffect(() => {
    setForceStableView(true);
    const timer = setTimeout(() => {
      setForceStableView(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    setUserProfile({
      areas_of_expertise: ["IT & Telecommunications", "Construction"],
      industry: "Technology",
      location: "Nairobi"
    });
  }, []);

  const { 
    data, 
    isLoading: rawIsLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["dashboard-tenders-optimized"],
    queryFn: async () => {
      console.log("TenderFeed: Fetching real tenders using optimized method");
      
      const latestTenders = await fetchLatestTendersOptimized(50);
      const totalCount = await getTotalTendersCountOptimized();
      
      console.log(`Optimized fetch: ${latestTenders.length} tenders, ${totalCount} total`);
      
      if (latestTenders.length === 0) {
        console.log("No real tenders found, triggering Browser AI fetch...");
        
        // Trigger Browser AI fetch in background
        try {
          const { data: browserResult, error: browserError } = await supabase.functions.invoke(
            'browser-ai-tenders/fetch-browser-ai'
          );
          
          if (browserError) {
            console.error("Browser AI fetch error:", browserError);
          } else if (browserResult?.success) {
            console.log("Browser AI fetch successful:", browserResult);
            // Clear cache and refetch
            clearTenderCache();
            const freshTenders = await fetchLatestTendersOptimized(50);
            const freshCount = await getTotalTendersCountOptimized();
            
            toast({
              title: "Tenders Updated",
              description: `Fetched ${browserResult.totalInserted || 0} new tenders from Browser AI`,
            });
            
            return {
              latest_tenders: freshTenders,
              total_tenders: freshCount,
              last_scrape: new Date().toISOString(),
              source: "browser-ai-fresh",
              sources_breakdown: calculateSourcesBreakdown(freshTenders)
            };
          }
        } catch (error) {
          console.error("Error triggering Browser AI fetch:", error);
        }
      }
      
      const sources = calculateSourcesBreakdown(latestTenders);
      setSourcesBreakdown(sources);
      setLastScraped(new Date().toISOString());
      
      return {
        latest_tenders: latestTenders,
        total_tenders: totalCount,
        last_scrape: new Date().toISOString(),
        source: "optimized-cache",
        sources_breakdown: sources
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Auto-refresh every 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 15 // 15 minutes
  });

  const isLoading = rawIsLoading || forceStableView;
  const tendersToDisplay = data?.latest_tenders as Tender[] || [];
  
  // Enhanced tender sorting with user profile matching
  const sortedTenders = userProfile 
    ? [...tendersToDisplay].sort((a, b) => {
        const scoreA = matchTenderToSupplier(a, userProfile);
        const scoreB = matchTenderToSupplier(b, userProfile);
        return scoreB - scoreA;
      })
    : tendersToDisplay;

  function calculateSourcesBreakdown(tenders: any[]) {
    const sources: {[key: string]: number} = {};
    
    tenders.forEach(tender => {
      const source = tender.source || 'Unknown';
      if (source !== 'sample') {
        sources[source] = (sources[source] || 0) + 1;
      }
    });
    
    return Object.entries(sources).map(([name, count]) => ({
      name: name === 'browser-ai' ? 'Browser AI' : name.charAt(0).toUpperCase() + name.slice(1),
      count,
      status: 'active'
    }));
  }

  // Enhanced refresh function with cache clearing
  const enhancedRefresh = async () => {
    clearTenderCache();
    await refreshTenderFeed();
    await refetch();
  };

  return {
    data,
    tendersToDisplay: sortedTenders,
    isLoading,
    error,
    isRefreshing,
    forceStableView,
    language,
    showQualificationTool,
    lastScraped,
    sourcesBreakdown,
    setShowQualificationTool,
    setLanguage,
    refreshTenderFeed: enhancedRefresh,
    refetch,
    userProfile
  };
}
