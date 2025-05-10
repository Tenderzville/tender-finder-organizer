
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { useDashboardTenders } from "@/hooks/use-dashboard-tenders";
import { useTenderRefresh } from "@/hooks/use-tender-refresh";
import { TenderRefreshButton } from "@/components/tenders/TenderRefreshButton";
import { TenderErrorAlert } from "@/components/tenders/TenderErrorAlert";
import { OfflineAlert } from "@/components/tenders/OfflineAlert";
import { TenderContent } from "@/components/tenders/TenderContent";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Tenders = () => {
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const { isOnline, offlineData, syncData } = useOfflineMode();
  const [apiError, setApiError] = useState<string | null>(null);
  
  const { 
    tenders, 
    isLoadingTenders, 
    errorTenders, 
    fetchTenders 
  } = useDashboardTenders();

  const { isRefreshing, refreshTenderFeed } = useTenderRefresh();
  
  // Use offline data if not online
  const displayTenders = isOnline ? tenders : offlineData.tenders;
  
  useEffect(() => {
    // Initial data fetch
    fetchTenders().catch(err => {
      console.error("Error in initial tenders fetch:", err);
      setApiError("Failed to load tenders. Please use the refresh button to try again.");
    });
    
    // Check if we need to automatically trigger the import due to no tenders
    const checkAndImportIfNeeded = async () => {
      if (tenders.length === 0 && !isRefreshing && isOnline) {
        console.log("No tenders found, automatically triggering import...");
        try {
          await refreshTenderFeed();
        } catch (error) {
          console.error("Failed to auto-trigger import:", error);
        }
      }
    };
    
    // Only run auto-import after a short delay to allow for initial data fetch
    const timer = setTimeout(checkAndImportIfNeeded, 2000);
    return () => clearTimeout(timer);
  }, [fetchTenders, tenders.length, isRefreshing, isOnline, refreshTenderFeed]);

  // Modified to return a Promise as required by the component props
  const handleRefreshTenders = async (): Promise<void> => {
    setApiError(null);
    return refreshTenderFeed();
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
          <TenderRefreshButton 
            isRefreshing={isRefreshing}
            onRefresh={handleRefreshTenders}
            label="Import Tenders"
            refreshingLabel="Importing Tenders..."
          />
        </div>

        {displayTenders.length === 0 && !isLoadingTenders && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertTitle className="text-amber-800">No Tenders Found</AlertTitle>
            <AlertDescription className="text-amber-700">
              Click the "Import Tenders" button in the top right corner to fetch the latest tenders from Google Sheets.
            </AlertDescription>
          </Alert>
        )}

        {apiError && <TenderErrorAlert errorMessage={apiError} />}

        {!isOnline && <OfflineAlert onSync={syncData} />}
        
        <TenderContent 
          tenders={displayTenders}
          isLoading={isLoadingTenders}
          error={errorTenders}
          isRefreshing={isRefreshing}
          apiError={apiError}
          onRetry={fetchTenders}
          onCreateSamples={handleRefreshTenders}
        />
      </main>
    </div>
  );
};

export default Tenders;
