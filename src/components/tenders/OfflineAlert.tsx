
import { Button } from "@/components/ui/button";

interface OfflineAlertProps {
  onSync: () => void;
}

export const OfflineAlert = ({ onSync }: OfflineAlertProps) => {
  return (
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
            onClick={onSync}
          >
            Sync when online
          </Button>
        </div>
      </div>
    </div>
  );
};
