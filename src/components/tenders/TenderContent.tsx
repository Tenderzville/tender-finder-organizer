
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
                <h3 className="text-xl font-medium mb-4">No Tenders Found</h3>
                <p className="text-gray-500 mb-4">
                  Use the refresh button to trigger the scraper and fetch real tenders from sources.
                </p>
                <Button 
                  onClick={onCreateSamples}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Fetching Tenders...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Fetch Real Tenders
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
        
        {/* Important information about scraper */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTitle className="text-blue-800">Important Information</AlertTitle>
          <AlertDescription className="text-blue-700">
            <p className="mb-2">
              This system fetches real tenders from official sources. If no tenders appear, use the refresh button to trigger the scraper.
            </p>
            <p>
              Sometimes scraping may take a few moments to complete. The page will refresh automatically when new tenders are available.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
