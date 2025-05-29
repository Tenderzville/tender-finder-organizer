
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchLatestTenders, getTotalTendersCount } from "@/utils/tenderFetching";
import { useTenderRefresh } from "@/hooks/use-tender-refresh";
import type { Tender } from "@/types/tender";
import { matchTenderToSupplier } from "@/utils/tenderAnalysis";
import { supabase } from "@/integrations/supabase/client";

export function useTenderFeed() {
  const { toast } = useToast();
  const [forceStableView, setForceStableView] = useState(false);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [showQualificationTool, setShowQualificationTool] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
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
  
  // Initialize a basic user profile as a fallback
  useEffect(() => {
    // In a real app, we'd fetch this from the user's profile
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
    queryKey: ["dashboard-tenders"],
    queryFn: async () => {
      console.log("TenderFeed: Fetching latest tenders, attempt #", retryAttempts + 1);
      
      // Direct database query to get tenders
      const { data: latestTenders, error: tendersError } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (tendersError) {
        console.error("Error fetching tenders:", tendersError);
        throw tendersError;
      }
      
      console.log(`Fetched ${latestTenders?.length || 0} tenders directly from database`);
      
      // If no tenders found, automatically trigger a refresh
      if (!latestTenders || latestTenders.length === 0) {
        console.log("No tenders found, triggering automatic refresh");
        try {
          await refreshTenderFeed();
          
          // Fetch again after refresh
          const { data: refreshedTenders, error: refreshError } = await supabase
            .from('tenders')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (refreshError) {
            console.error("Error fetching refreshed tenders:", refreshError);
            throw refreshError;
          }
          
          return {
            latest_tenders: refreshedTenders || [],
            total_tenders: refreshedTenders?.length || 0,
            last_scrape: new Date().toISOString(),
            source: "database_with_refresh",
            sources_breakdown: calculateSourcesBreakdown(refreshedTenders || [])
          };
        } catch (refreshError) {
          console.error("Error during automatic refresh:", refreshError);
          // Return empty data if refresh fails
          return {
            latest_tenders: [],
            total_tenders: 0,
            last_scrape: new Date().toISOString(),
            source: "database_empty",
            sources_breakdown: []
          };
        }
      }
      
      // Get total count
      const totalTenders = await getTotalTendersCount();
      
      // Calculate sources breakdown
      const sources = calculateSourcesBreakdown(latestTenders || []);
      setSourcesBreakdown(sources);
      
      // Update last scrape timestamp
      setLastScraped(new Date().toISOString());
      
      return {
        latest_tenders: latestTenders || [],
        total_tenders: totalTenders,
        last_scrape: new Date().toISOString(),
        source: "database",
        sources_breakdown: sources
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: false,
    retry: 2,
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
          const result = await refetch();
          
          // If we have data but it's empty, show a helpful message
          if (result.data && (!result.data.latest_tenders || result.data.latest_tenders.length === 0)) {
            toast({
              title: "No tenders found",
              description: "Click the refresh button to fetch the latest tenders",
            });
          }
        }
      } catch (err) {
        console.error("Failed initial tender feed fetch:", err);
        
        if (retryAttempts >= 1) {
          toast({
            title: "Loading tenders",
            description: "Please use the refresh button if no tenders appear",
          });
        }
      }
    };
    
    initialFetch();
    
    return () => {
      isMounted = false;
    };
  }, [refetch, retryAttempts, toast]);

  const tendersToDisplay = data?.latest_tenders as Tender[] || [];
  
  // If we have a user profile, sort tenders by match score
  const sortedTenders = userProfile 
    ? [...tendersToDisplay].sort((a, b) => {
        const scoreA = matchTenderToSupplier(a, userProfile);
        const scoreB = matchTenderToSupplier(b, userProfile);
        return scoreB - scoreA;
      })
    : tendersToDisplay;

  // Function to calculate sources breakdown
  function calculateSourcesBreakdown(tenders: any[]) {
    const sources: {[key: string]: number} = {};
    
    tenders.forEach(tender => {
      const source = tender.source || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    return Object.entries(sources).map(([name, count]) => ({
      name: name === 'browser-ai' ? 'Browser AI' : name === 'sample' ? 'Sample Data' : name.charAt(0).toUpperCase() + name.slice(1),
      count,
      status: 'active'
    }));
  }

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
    refreshTenderFeed,
    refetch,
    userProfile
  };
}
