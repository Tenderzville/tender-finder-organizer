
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { TenderList } from '@/components/tenders/TenderList';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { useDashboardTenders } from "@/hooks/use-dashboard-tenders";
import { useTenderSharingActions } from "@/components/dashboard/TenderSharingActions";
import { useDashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { ScraperStatus } from "@/components/dashboard/ScraperStatus";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Tenders = () => {
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const { isOnline, offlineData, syncData } = useOfflineMode();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const { 
    tenders, 
    isLoadingTenders, 
    errorTenders, 
    fetchTenders 
  } = useDashboardTenders();
  
  const { handleShareViaEmail, handleShareViaWhatsApp } = useTenderSharingActions();
  const { handleViewTenderDetails } = useDashboardNavigation();

  // Use offline data if not online
  const displayTenders = isOnline ? tenders : offlineData.tenders;
  
  useEffect(() => {
    // Initial data fetch
    fetchTenders().catch(err => {
      console.error("Error in initial tenders fetch:", err);
      setApiError("Failed to load tenders. Please try refreshing.");
    });
  }, [fetchTenders]);
  
  // Function to initialize sample tenders if none exist
  const initializeSampleTenders = async () => {
    if (displayTenders.length === 0) {
      try {
        setIsRefreshing(true);
        
        // Create sample tenders if none exist
        console.log("Creating sample tenders...");
        const { data: existingTenders, error: checkError } = await supabase
          .from('tenders')
          .select('count', { count: 'exact', head: true });
          
        if (checkError) {
          console.error("Error checking tenders:", checkError);
          throw checkError;
        }
        
        // If no tenders exist, create sample ones
        if (existingTenders === 0 || existingTenders === null) {
          const sampleTenders = [
            {
              title: "Office Supplies Procurement",
              description: "Procurement of office supplies including stationery, printer cartridges, and office equipment.",
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
              contact_info: "procurement@example.com",
              fees: "KES 50,000",
              prerequisites: "Must be a registered supplier.",
              category: "Supplies",
              location: "Nairobi",
              tender_url: "https://example.com/tenders/office-supplies"
            },
            {
              title: "IT Infrastructure Development",
              description: "Development of IT infrastructure including servers, networking, and security systems.",
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
              contact_info: "it@example.com",
              fees: "KES 2,000,000",
              prerequisites: "ISO 27001 certification required.",
              category: "IT",
              location: "Mombasa",
              tender_url: "https://example.com/tenders/it-infrastructure",
              affirmative_action: { type: "youth", percentage: 30 }
            }
          ];
          
          const { error: insertError } = await supabase
            .from('tenders')
            .insert(sampleTenders);
            
          if (insertError) {
            console.error("Error inserting sample tenders:", insertError);
            throw insertError;
          }
          
          toast({
            title: "Sample tenders created",
            description: "Created sample tenders for demonstration",
          });
          
          // Refresh tenders after creating samples
          await fetchTenders();
        }
      } catch (err) {
        console.error("Error initializing sample tenders:", err);
        setApiError("Failed to initialize tenders. Please try again.");
        toast({
          title: "Error",
          description: "Could not create sample tenders",
          variant: "destructive"
        });
      } finally {
        setIsRefreshing(false);
      }
    }
  };
  
  const handleRefreshTenders = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setApiError(null);
    
    try {
      toast({
        title: "Refreshing tenders",
        description: "Retrieving latest tender data...",
      });
      
      // Check if we need to create sample data
      const { count, error: countError } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error("Error counting tenders:", countError);
        throw countError;
      }
      
      if (count === 0) {
        await initializeSampleTenders();
      } else {
        // Trigger a fresh scrape using the API Layer
        const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke(
          'scrape-tenders',
          {
            body: { 
              force: true,
              useApiLayer: true 
            }
          }
        );
        
        if (scrapeError) {
          console.error("Error triggering scrape:", scrapeError);
          throw scrapeError;
        }
        
        console.log("Scrape result:", scrapeResult);
        
        // Wait a moment for data to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Try to fetch fresh data
      await fetchTenders();
      
      toast({
        title: "Tenders updated",
        description: "Successfully refreshed tenders data.",
      });
      
      // If still no tenders, create samples
      if (tenders.length === 0) {
        await initializeSampleTenders();
      }
    } catch (err) {
      console.error("Error refreshing tenders:", err);
      setApiError("Failed to refresh tenders. Please try again later.");
      toast({
        title: "Refresh failed",
        description: "Could not refresh tenders. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize sample tenders if none exist on component mount
  useEffect(() => {
    if (displayTenders.length === 0 && !isLoadingTenders && !apiError) {
      initializeSampleTenders();
    }
  }, [displayTenders.length, isLoadingTenders, apiError]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Tenders</h1>
            <p className="text-gray-600">Browse available tender opportunities</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefreshTenders}
            disabled={isRefreshing || !isOnline}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Tenders'}
          </Button>
        </div>

        {apiError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {!isOnline && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  You're currently offline. Showing saved tenders.
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 text-amber-700 underline"
                  onClick={() => syncData()}
                >
                  Sync when online
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {(isLoadingTenders && displayTenders.length === 0) ? (
          <div className="flex justify-center items-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading tenders...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <TenderList 
                tenders={displayTenders}
                isLoading={isLoadingTenders && displayTenders.length === 0}
                error={errorTenders || (apiError ? new Error(apiError) : null)}
                onRetry={fetchTenders}
              />
              
              {displayTenders.length === 0 && !isLoadingTenders && !apiError && (
                <div className="text-center p-12 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tenders available</h3>
                  <p className="text-gray-500 mb-4">
                    Currently there are no tenders in the database. Click the refresh button to 
                    trigger a scrape of the latest tender opportunities or create sample data.
                  </p>
                  <Button 
                    onClick={handleRefreshTenders}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? 'Refreshing...' : 'Create Sample Tenders'}
                  </Button>
                </div>
              )}
            </div>
            <div className="lg:col-span-1 space-y-6">
              <ScraperStatus />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Tenders;
