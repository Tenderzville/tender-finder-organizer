
import { useState } from "react";
import { TenderCard } from "@/components/TenderCard";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Tender } from "@/types/tender";

interface TenderListProps {
  tenders: Tender[];
  isLoading?: boolean;
  onRetry?: () => void;
  error?: Error | null;
}

export const TenderList = ({ tenders, isLoading = false, onRetry, error }: TenderListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleViewDetails = (tenderId: number) => {
    navigate(`/tenders/${tenderId}`);
    toast({
      title: "Opening tender details",
      description: "Loading complete tender information...",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading tenders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading tenders</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>{error.message || "Unable to load tenders. Please try again later."}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
            >
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (tenders.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">No tenders found</h3>
        <p className="mt-2 text-sm text-gray-500">
          We're experiencing issues retrieving tenders. Please try again later.
        </p>
        {onRetry && (
          <Button 
            className="mt-4"
            onClick={onRetry}
          >
            Retry Loading Tenders
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
      {tenders.map((tender) => (
        <TenderCard
          key={tender.id}
          id={tender.id}
          title={tender.title}
          organization={tender.category}
          deadline={tender.deadline}
          category={tender.category}
          value={tender.fees || "Contact for pricing"}
          location={tender.location}
          pointsRequired={tender.points_required || 0}
          tender_url={tender.tender_url}
          onViewDetails={() => handleViewDetails(tender.id)}
        />
      ))}
    </div>
  );
};
