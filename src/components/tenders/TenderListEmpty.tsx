
import { Button } from "@/components/ui/button";

interface TenderListEmptyProps {
  title: string;
  description: string;
  retryText: string;
  onRetry?: () => void;
}

export const TenderListEmpty = ({ 
  title, 
  description, 
  retryText, 
  onRetry 
}: TenderListEmptyProps) => {
  return (
    <div className="text-center py-8 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">
        {description}
      </p>
      {onRetry && (
        <Button 
          className="mt-4"
          onClick={onRetry}
        >
          {retryText}
        </Button>
      )}
    </div>
  );
};
