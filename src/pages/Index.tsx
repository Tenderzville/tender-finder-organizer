
import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { TenderFilters } from "@/components/TenderFilters";
import { TenderList } from "@/components/tenders/TenderList";
import { TenderHeader } from "@/components/tenders/TenderHeader";
import { TenderNotification } from "@/components/notifications/TenderNotification";
import { SocialShare } from "@/components/social/SocialShare";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SupplierCollaborationHub } from "@/components/collaboration/SupplierCollaborationHub";

const Index = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    location: "",
    valueRange: "",
    deadline: "",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialScrapeDone, setInitialScrapeDone] = useState(false);
  const [fallbackTenders, setFallbackTenders] = useState([]);
  // Add state to prevent frequent re-renders
  const [stableFilters, setStableFilters] = useState(filters);
  
  // Debounce filter changes to reduce flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setStableFilters(filters);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters]);

  // Memoize the refreshTenders function to prevent recreation on each render
  const refreshTenders = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    try {
      console.log('Calling scrape-tenders function with force=true...');
      // Call the scrape-tenders function with force parameter
      const { data, error } = await supabase.functions.invoke('scrape-tenders', {
        body: { force: true }
      });
      
      if (error) {
        console.error('Error triggering tender scrape:', error);
        toast({
          title: "Error",
          description: "Failed to refresh tenders. Fetching from database...",
          variant: "destructive",
        });
        
        // Fetch directly from the database as fallback
        await fetchDirectlyFromDatabase();
      } else {
        console.log('Tender scrape response:', data);
        toast({
          title: "Tenders Refreshed",
          description: `Found ${data.tenders_scraped} new tenders. Total tenders: ${data.total_tenders}`,
        });
        // Refetch the tenders
        refetch();
      }
    } catch (error) {
      console.error('Error triggering tender scrape:', error);
      toast({
        title: "Error",
        description: "Failed to refresh tenders. Fetching from database...",
        variant: "destructive",
      });
      
      // Fetch directly from the database as fallback
      await fetchDirectlyFromDatabase();
    } finally {
      setIsRefreshing(false);
      setInitialScrapeDone(true);
    }
  }, [isRefreshing]);

  // Memoize the fetchDirectlyFromDatabase function
  const fetchDirectlyFromDatabase = useCallback(async () => {
    try {
      console.log('Fetching tenders directly from database...');
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tenders from database:', error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log(`Found ${data.length} tenders in database`);
        const formattedTenders = data.map(tender => ({
          id: tender.id,
          title: tender.title,
          organization: tender.contact_info || "Not specified",
          deadline: format(new Date(tender.deadline), "PPP"),
          category: tender.category,
          value: tender.fees || "Contact for pricing",
          location: tender.location || "International",
          description: tender.description,
          tender_url: tender.tender_url
        }));
        setFallbackTenders(formattedTenders);
        
        toast({
          title: "Tenders Loaded",
          description: `Found ${formattedTenders.length} tenders in the database`,
        });
      } else {
        console.log('No tenders found in database');
        
        // Create sample tenders as last resort
        const sampleTenders = [
          {
            id: 9999,
            title: "Construction of Rural Health Centers",
            organization: "Ministry of Health",
            deadline: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "PPP"),
            category: "Construction",
            value: "Contact for pricing",
            location: "Nairobi",
            description: "Construction of rural health centers across the country."
          },
          {
            id: 9998,
            title: "Supply of IT Equipment",
            organization: "Ministry of Education",
            deadline: format(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), "PPP"),
            category: "IT",
            value: "$50,000",
            location: "National",
            description: "Supply and installation of computer equipment for government offices."
          }
        ];
        
        setFallbackTenders(sampleTenders);
        
        toast({
          title: "Sample Data Loaded",
          description: "Using sample tenders while we resolve data issues",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error fetching tenders from database:', error);
    }
  }, []);

  const { 
    data: tenders = [], 
    isLoading,
    refetch,
    isError
  } = useQuery({
    queryKey: ["tenders", stableFilters],
    queryFn: async () => {
      console.log("Fetching tenders with filters:", stableFilters);
      
      let query = supabase
        .from("tenders")
        .select("*")
        .order("created_at", { ascending: false });

      if (stableFilters.search) {
        query = query.or(`title.ilike.%${stableFilters.search}%,description.ilike.%${stableFilters.search}%`);
      }

      if (stableFilters.category && stableFilters.category !== "All") {
        query = query.eq("category", stableFilters.category);
      }

      if (stableFilters.location && stableFilters.location !== "All") {
        query = query.eq("location", stableFilters.location);
      }

      if (stableFilters.deadline) {
        const now = new Date();
        let endDate;
        
        switch (stableFilters.deadline) {
          case "today":
            endDate = new Date(now.setHours(23, 59, 59, 999));
            query = query.lte("deadline", endDate.toISOString());
            break;
          case "this-week":
            endDate = new Date(now.setDate(now.getDate() + 7));
            query = query.lte("deadline", endDate.toISOString());
            break;
          case "this-month":
            endDate = new Date(now.setMonth(now.getMonth() + 1));
            query = query.lte("deadline", endDate.toISOString());
            break;
          case "next-month":
            const startDate = new Date(now.setMonth(now.getMonth() + 1));
            endDate = new Date(now.setMonth(now.getMonth() + 2));
            query = query
              .gte("deadline", startDate.toISOString())
              .lte("deadline", endDate.toISOString());
            break;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tenders:", error);
        throw error;
      }

      console.log(`Retrieved ${data?.length || 0} tenders from database`);
      
      if (!data || data.length === 0) {
        console.log('No tenders found with current filters');
        return [];
      }
      
      return data.map(tender => ({
        id: tender.id,
        title: tender.title,
        organization: tender.contact_info || "Not specified",
        deadline: format(new Date(tender.deadline), "PPP"),
        category: tender.category,
        value: tender.fees || "Contact for pricing",
        location: tender.location || "International",
        description: tender.description,
        tender_url: tender.tender_url,
        affirmative_action: tender.affirmative_action
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // Disable automatic refetch to reduce flickering
    refetchOnReconnect: false, // Disable automatic refetch on reconnect
    refetchOnMount: false, // Disable automatic refetch on component mount
    retry: 1, // Limit retries to reduce flickering
    gcTime: 1000 * 60 * 10, // Keep data in cache for 10 minutes
  });

  // Decide which tenders to display
  const displayTenders = tenders.length > 0 ? tenders : fallbackTenders;

  // Check if we have tenders on initial load - only once
  useEffect(() => {
    let isMounted = true;
    
    const checkForTenders = async () => {
      if (!initialScrapeDone && isMounted) {
        // Check how many tenders are in the database
        const { count } = await supabase
          .from("tenders")
          .select("*", { count: 'exact', head: true });
        
        console.log(`Database has ${count || 0} total tenders`);
        
        if (!count || count === 0) {
          // If no tenders are found on the initial load, scrape some
          console.log("No tenders found in database, starting initial scrape");
          await refreshTenders();
        } else if (isMounted) {
          setInitialScrapeDone(true);
          
          // Fetch the tenders even if we have count
          await fetchDirectlyFromDatabase();
        }
      }
    };
    
    checkForTenders();
    
    return () => {
      isMounted = false;
    };
  }, [initialScrapeDone]);

  // Force a refresh every hour, but only if component is mounted
  useEffect(() => {
    let isMounted = true;
    const intervalId = setInterval(() => {
      if (isMounted) {
        console.log('Running scheduled tender refresh');
        refreshTenders();
      }
    }, 1000 * 60 * 60); // 1 hour
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [refreshTenders]);

  // Run initial scrape exactly once when the component mounts
  useEffect(() => {
    let isMounted = true;
    
    // Only run this once on initial mount
    const runInitialScrape = async () => {
      if (!initialScrapeDone && isMounted) {
        console.log("Running initial tender scrape on page load");
        await refreshTenders();
      }
    };
    
    runInitialScrape();
    
    return () => {
      isMounted = false;
    };
  }, [initialScrapeDone, refreshTenders]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <TenderNotification />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <TenderHeader />
            <Button 
              onClick={refreshTenders} 
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh Tenders
                </>
              )}
            </Button>
          </div>
          
          <SupplierCollaborationHub />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <TenderFilters onFilterChange={setFilters} />
              <div className="mt-8">
                <SocialShare />
              </div>
            </div>
            
            <div className="lg:col-span-3">
              {isLoading && displayTenders.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                  <span>Loading tenders...</span>
                </div>
              ) : displayTenders.length > 0 ? (
                <>
                  <p className="mb-4 text-sm text-gray-500">Showing {displayTenders.length} tender{displayTenders.length !== 1 ? 's' : ''}</p>
                  <TenderList 
                    tenders={displayTenders} 
                    onRetry={refreshTenders}
                  />
                </>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">No tenders found</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {isError ? 
                      "There was an error fetching tenders." : 
                      "Try adjusting your filters or check back later for new opportunities."}
                  </p>
                  <Button 
                    onClick={refreshTenders} 
                    disabled={isRefreshing}
                    className="mt-4"
                  >
                    {isRefreshing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {isError ? "Try Again" : "Refresh Tenders"}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
