
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface TenderEmptyStateProps {
  onCreateSamples: () => Promise<void>;
  isRefreshing: boolean;
}

export const TenderEmptyState = ({ onCreateSamples, isRefreshing }: TenderEmptyStateProps) => {
  return (
    <div className="text-center p-12 bg-white rounded-lg border border-gray-100 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-2">No tenders available</h3>
      <p className="text-gray-500 mb-4">
        Currently there are no tenders in the database. Click the refresh button to 
        trigger a scrape of the latest tender opportunities from external sources.
      </p>
      <Button 
        onClick={onCreateSamples}
        disabled={isRefreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        {isRefreshing ? 'Fetching tenders...' : 'Fetch Tenders'}
      </Button>
    </div>
  );
};
