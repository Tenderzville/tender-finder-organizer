
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchLatestTenders, getTotalTendersCount } from "@/utils/tenderFetching";
import { useTenderRefresh } from "@/hooks/use-tender-refresh";
import { useSampleTenders } from "@/hooks/use-sample-tenders";
import type { Tender } from "@/types/tender";
import { matchTenderToSupplier } from "@/utils/tenderAnalysis";

export function useTenderFeed() {
  const { toast } = useToast();
  const [forceStableView, setForceStableView] = useState(false);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [showQualificationTool, setShowQualificationTool] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const { isRefreshing, refreshTenderFeed } = useTenderRefresh();
  const { createSampleTenders } = useSampleTenders();
  const [userProfile, setUserProfile] = useState<{
    areas_of_expertise: string[];
    industry: string;
    location: string;
  } | null>(null);

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
  
  // If we have a user profile, sort tenders by match score
  const sortedTenders = userProfile 
    ? [...tendersToDisplay].sort((a, b) => {
        const scoreA = matchTenderToSupplier(a, userProfile);
        const scoreB = matchTenderToSupplier(b, userProfile);
        return scoreB - scoreA;
      })
    : tendersToDisplay;

  return {
    data,
    tendersToDisplay: sortedTenders,
    isLoading,
    error,
    isRefreshing,
    forceStableView,
    language,
    showQualificationTool,
    setShowQualificationTool,
    setLanguage,
    refreshTenderFeed,
    refetch,
    userProfile
  };
}
