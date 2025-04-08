
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { TenderList } from '@/components/tenders/TenderList';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { useDashboardTenders } from "@/hooks/use-dashboard-tenders";
import { useTenderSharingActions } from "@/components/dashboard/TenderSharingActions";
import { useDashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { ScraperStatus } from "@/components/dashboard/ScraperStatus";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Tenders = () => {
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const { isOnline, offlineData, syncData } = useOfflineMode();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
  
  const handleRefreshTenders = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      toast({
        title: "Refreshing tenders",
        description: "Triggering the tender scraper...",
      });
      
      // Try to invoke the edge function to run the scrapers
      try {
        const { data, error } = await supabase.functions.invoke('scrape-tenders', {
          body: { force: true }
        });
        
        if (error) {
          console.error("Error invoking scraper:", error);
          throw error;
        }
        
        console.log("Scraper response:", data);
        await fetchTenders();
        
        toast({
          title: "Tenders updated",
          description: "Successfully refreshed tenders data.",
        });
      } catch (err) {
        console.error("Could not run scraper, falling back to database fetch:", err);
        await fetchTenders();
        
        toast({
          title: "Tenders refreshed",
          description: "Fetched latest tenders from the database.",
        });
      }
    } catch (err) {
      console.error("Error refreshing tenders:", err);
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
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <TenderList 
              tenders={displayTenders}
              isLoading={isLoadingTenders}
              error={errorTenders}
              onRetry={fetchTenders}
            />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <ScraperStatus />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tenders;
