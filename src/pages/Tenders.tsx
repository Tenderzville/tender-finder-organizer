
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { useDashboardTenders } from "@/hooks/use-dashboard-tenders";
import { useTenderRefresh } from "@/hooks/use-tender-refresh";
import { useTenderSamples } from "@/hooks/use-tender-samples";
import { TenderRefreshButton } from "@/components/tenders/TenderRefreshButton";
import { TenderErrorAlert } from "@/components/tenders/TenderErrorAlert";
import { OfflineAlert } from "@/components/tenders/OfflineAlert";
import { TenderContent } from "@/components/tenders/TenderContent";

const Tenders = () => {
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const { isOnline, offlineData, syncData } = useOfflineMode();
  
  const { 
    tenders, 
    isLoadingTenders, 
    errorTenders, 
    fetchTenders 
  } = useDashboardTenders();

  const {
    handleRefreshTenders,
    isRefreshing,
    apiError,
    setApiError
  } = useTenderRefresh({ fetchTenders });

  const { initializeSampleTenders } = useTenderSamples();
  
  // Use offline data if not online
  const displayTenders = isOnline ? tenders : offlineData.tenders;
  
  useEffect(() => {
    // Initial data fetch
    fetchTenders().catch(err => {
      console.error("Error in initial tenders fetch:", err);
      setApiError("Failed to load tenders. Please try refreshing.");
    });
  }, [fetchTenders, setApiError]);
  
  // Initialize sample tenders if none exist on component mount
  useEffect(() => {
    if (displayTenders.length === 0 && !isLoadingTenders && !apiError) {
      initializeSampleTenders();
    }
  }, [displayTenders.length, isLoadingTenders, apiError, initializeSampleTenders]);

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
          />
        </div>

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
