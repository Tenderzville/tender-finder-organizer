
import { useState, useEffect } from "react";
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

  // Function to trigger manual tender scraping
  const refreshTenders = async () => {
    setIsRefreshing(true);
    try {
      console.log('Calling scrape-tenders function...');
      // Call the scrape-tenders function
      const { data, error } = await supabase.functions.invoke('scrape-tenders');
      
      if (error) {
        console.error('Error triggering tender scrape:', error);
        toast({
          title: "Error",
          description: "Failed to refresh tenders. Please try again.",
          variant: "destructive",
        });
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
        description: "Failed to refresh tenders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
      setInitialScrapeDone(true);
    }
  };

  const { 
    data: tenders = [], 
    isLoading,
    refetch,
    isError
  } = useQuery({
    queryKey: ["tenders", filters],
    queryFn: async () => {
      console.log("Fetching tenders with filters:", filters);
      
      let query = supabase
        .from("tenders")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.category && filters.category !== "All") {
        query = query.eq("category", filters.category);
      }

      if (filters.location && filters.location !== "All") {
        query = query.eq("location", filters.location);
      }

      if (filters.deadline) {
        const now = new Date();
        let endDate;
        
        switch (filters.deadline) {
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
        tender_url: tender.tender_url
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true, // Refresh when window gets focus
  });

  // Check if we have tenders on initial load
  useEffect(() => {
    const checkForTenders = async () => {
      if (!isLoading && !initialScrapeDone) {
        // Check how many tenders are in the database
        const { count, error } = await supabase
          .from("tenders")
          .select("*", { count: 'exact', head: true });
        
        console.log(`Database has ${count || 0} total tenders`);
        
        if (!count || count === 0) {
          // If no tenders are found on the initial load, scrape some
          console.log("No tenders found in database, starting initial scrape");
          await refreshTenders();
        } else {
          setInitialScrapeDone(true);
        }
      }
    };
    
    checkForTenders();
  }, [isLoading]);

  useEffect(() => {
    // Force a refresh every hour
    const intervalId = setInterval(() => {
      console.log('Running scheduled tender refresh');
      refreshTenders();
    }, 1000 * 60 * 60); // 1 hour
    
    return () => clearInterval(intervalId);
  }, []);

  // Force an immediate scrape when the component mounts
  useEffect(() => {
    // Only run this once on initial mount
    const runInitialScrape = async () => {
      if (!initialScrapeDone) {
        console.log("Running initial tender scrape on page load");
        await refreshTenders();
      }
    };
    
    runInitialScrape();
  }, []);

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
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <TenderFilters onFilterChange={setFilters} />
              <div className="mt-8">
                <SocialShare />
              </div>
            </div>
            
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                  <span>Loading tenders...</span>
                </div>
              ) : tenders.length > 0 ? (
                <>
                  <p className="mb-4 text-sm text-gray-500">Showing {tenders.length} tender{tenders.length !== 1 ? 's' : ''}</p>
                  <TenderList tenders={tenders} />
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
