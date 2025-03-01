
import { useState, useEffect } from "react";
import { TenderCard } from "@/components/TenderCard";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Tender {
  id: number;
  title: string;
  organization: string;
  deadline: string;
  category: string;
  value: string;
  location?: string;
  points_required?: number;
  tender_url?: string | null;
}

interface TenderListProps {
  tenders: Tender[];
  isLoading?: boolean;
  onRetry?: () => void;
}

export const TenderList = ({ tenders, isLoading = false, onRetry }: TenderListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fallbackTenders, setFallbackTenders] = useState<Tender[]>([]);
  const [isFallbackLoading, setIsFallbackLoading] = useState(false);

  // If no tenders are provided, try to fetch them directly as a fallback
  useEffect(() => {
    const fetchFallbackTenders = async () => {
      if (!isLoading && tenders.length === 0 && fallbackTenders.length === 0) {
        setIsFallbackLoading(true);
        try {
          console.log("TenderList: Fetching fallback tenders from database");
          const { data, error } = await supabase
            .from("tenders")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10);

          if (error) {
            console.error("Error fetching fallback tenders:", error);
            return;
          }

          if (data && data.length > 0) {
            console.log(`TenderList: Found ${data.length} fallback tenders`);
            const formattedTenders = data.map(tender => ({
              id: tender.id,
              title: tender.title,
              organization: tender.contact_info || "Not specified",
              deadline: tender.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              category: tender.category,
              value: tender.fees || "Contact for pricing",
              location: tender.location || "International",
              points_required: tender.points_required
            }));
            setFallbackTenders(formattedTenders);
          } else if (fallbackTenders.length === 0) {
            // Last resort - create sample data
            console.log("TenderList: Creating sample fallback tenders");
            const sampleTenders = [
              {
                id: 9999,
                title: "Construction of Rural Health Centers",
                organization: "Ministry of Health",
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                category: "Construction",
                value: "Contact for pricing",
                location: "Nairobi",
                points_required: 0
              },
              {
                id: 9998,
                title: "Supply of IT Equipment",
                organization: "Ministry of Education",
                deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                category: "IT",
                value: "$50,000",
                location: "National",
                points_required: 0
              }
            ];
            setFallbackTenders(sampleTenders);
          }
        } catch (err) {
          console.error("Error in fallback tender fetch:", err);
        } finally {
          setIsFallbackLoading(false);
        }
      }
    };

    fetchFallbackTenders();
  }, [tenders, isLoading]);

  const handleViewDetails = (tenderId: number) => {
    navigate(`/tenders/${tenderId}`);
    toast({
      title: "Opening tender details",
      description: "Loading complete tender information...",
    });
  };

  // Decide which tenders to display
  const displayTenders = tenders.length > 0 ? tenders : fallbackTenders;
  const displayLoading = isLoading || isFallbackLoading;

  if (displayLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading tenders...</span>
      </div>
    );
  }

  if (displayTenders.length === 0) {
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
      {displayTenders.map((tender) => (
        <TenderCard
          key={tender.id}
          {...tender}
          pointsRequired={tender.points_required}
          onViewDetails={() => handleViewDetails(tender.id)}
        />
      ))}
    </div>
  );
};
