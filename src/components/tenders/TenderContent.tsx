
import { TenderList } from '@/components/tenders/TenderList';
import { TenderLoadingState } from '@/components/tenders/TenderLoadingState';
import { TenderEmptyState } from '@/components/tenders/TenderEmptyState';
import { ScraperStatus } from "@/components/dashboard/ScraperStatus";
import { Tender } from "@/types/tender";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface TenderContentProps {
  tenders: Tender[];
  isLoading: boolean;
  error: Error | null;
  isRefreshing: boolean;
  apiError: string | null;
  onRetry: () => Promise<void>;
  onCreateSamples: () => Promise<void>;
}

export const TenderContent = ({
  tenders,
  isLoading,
  error,
  isRefreshing,
  apiError,
  onRetry,
  onCreateSamples
}: TenderContentProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        {(isLoading && tenders.length === 0) ? (
          <TenderLoadingState />
        ) : (
          <>
            <TenderList 
              tenders={tenders}
              isLoading={isLoading && tenders.length === 0}
              error={error || (apiError ? new Error(apiError) : null)}
              onRetry={onRetry}
            />
            
            {tenders.length === 0 && !isLoading && !apiError && (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <h3 className="text-xl font-medium mb-4 text-red-600">No Tenders Available Yet</h3>
                <p className="text-gray-700 mb-4">
                  Click the "Refresh Tenders" button below to trigger the real-time scraper that will fetch
                  live tenders from official government and private sector sources.
                </p>
                <div className="mb-6 bg-yellow-50 border border-yellow-100 p-4 rounded-md">
                  <p className="text-yellow-800 text-sm">
                    <strong>First-time users:</strong> The initial scraping process may take 1-2 minutes to complete.
                    After clicking refresh, the page will automatically reload once tenders are available.
                  </p>
                </div>
                <Button 
                  onClick={onCreateSamples}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Fetching Live Tenders...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Fetch Live Tenders Now
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="lg:col-span-1 space-y-6">
        <ScraperStatus />
        
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTitle className="text-blue-800">Important Information</AlertTitle>
          <AlertDescription className="text-blue-700">
            <p className="mb-2">
              This system fetches real tenders from official government and private sector sources.
              If no tenders appear, use the green "Fetch Live Tenders" button.
            </p>
            <p>
              The scraping process takes approximately 1-2 minutes to complete. The page will refresh automatically
              when new tenders are available.
            </p>
          </AlertDescription>
        </Alert>
        
        {isRefreshing && (
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Scraper Running</AlertTitle>
            <AlertDescription className="text-green-700">
              <p>The tender scraper is currently running. Please wait while we fetch the latest tender opportunities.</p>
              <div className="flex justify-center mt-3">
                <RefreshCw className="h-5 w-5 animate-spin text-green-600" />
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};
