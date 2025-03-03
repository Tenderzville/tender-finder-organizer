
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface TenderListErrorProps {
  title: string;
  description: string;
  retryText: string;
  onRetry?: () => void;
  error?: Error | null;
}

export const TenderListError = ({ 
  title, 
  description, 
  retryText, 
  onRetry, 
  error 
}: TenderListErrorProps) => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>{error?.message || description}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
          >
            {retryText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
