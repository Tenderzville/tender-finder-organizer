
import { TenderList } from '@/components/tenders/TenderList';
import { TenderLoadingState } from '@/components/tenders/TenderLoadingState';
import { TenderEmptyState } from '@/components/tenders/TenderEmptyState';
import { ScraperStatus } from "@/components/dashboard/ScraperStatus";
import { Tender } from "@/types/tender";

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
              <TenderEmptyState 
                onCreateSamples={onCreateSamples}
                isRefreshing={isRefreshing}
              />
            )}
          </>
        )}
      </div>
      <div className="lg:col-span-1 space-y-6">
        <ScraperStatus />
      </div>
    </div>
  );
};
