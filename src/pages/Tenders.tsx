
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
  
  const handleRefreshTenders = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setApiError(null);
    
    try {
      toast({
        title: "Refreshing tenders",
        description: "Retrieving latest tender data...",
      });
      
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
      
      // Try to fetch fresh data
      await fetchTenders();
      
      toast({
        title: "Tenders updated",
        description: "Successfully refreshed tenders data.",
      });
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
                    trigger a scrape of the latest tender opportunities.
                  </p>
                  <Button 
                    onClick={handleRefreshTenders}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh Tenders'}
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
