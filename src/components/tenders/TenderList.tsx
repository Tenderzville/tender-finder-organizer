import { TenderCard } from "@/components/TenderCard";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Tender {
  id: number;
  title: string;
  organization: string;
  deadline: string;
  category: string;
  value: string;
  location?: string;
}

interface TenderListProps {
  tenders: Tender[];
}

export const TenderList = ({ tenders }: TenderListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleViewDetails = (tenderId: number) => {
    navigate(`/tenders/${tenderId}`);
    toast({
      title: "Opening tender details",
      description: "Loading complete tender information...",
    });
  };

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
      {tenders.map((tender) => (
        <TenderCard
          key={tender.id}
          {...tender}
          onViewDetails={() => handleViewDetails(tender.id)}
        />
      ))}
    </div>
  );
};