
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { TenderList } from '@/components/tenders/TenderList';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { useDashboardTenders } from "@/hooks/use-dashboard-tenders";
import { useTenderSharingActions } from "@/components/dashboard/TenderSharingActions";
import { useDashboardNavigation } from "@/components/dashboard/DashboardNavigation";

const Tenders = () => {
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const { isOnline, offlineData } = useOfflineMode();
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Tenders</h1>
          <p className="text-gray-600">Browse available tender opportunities</p>
        </div>

        {!isOnline && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  You're currently offline. Showing saved tenders.
                </p>
              </div>
            </div>
          </div>
        )}

        <TenderList 
          tenders={displayTenders}
          isLoading={isLoadingTenders}
          error={errorTenders}
          onRetry={fetchTenders}
        />
      </main>
    </div>
  );
};

export default Tenders;
