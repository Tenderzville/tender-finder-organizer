
import { Progress } from "@/components/ui/progress";
import { Tender } from "@/types/tender";
import { matchTenderToSupplier } from "@/utils/tenderAnalysis";
import { Badge } from "@/components/ui/badge";

interface TenderMatchScoreProps {
  tender: Tender;
  supplierProfile: {
    areas_of_expertise: string[];
    industry: string;
    location: string;
  };
  showDetails?: boolean;
}

export function TenderMatchScore({ 
  tender, 
  supplierProfile, 
  showDetails = false
}: TenderMatchScoreProps) {
  const matchScore = matchTenderToSupplier(tender, supplierProfile);
  
  let matchBadge;
  if (matchScore >= 80) {
    matchBadge = <Badge className="bg-green-600 hover:bg-green-700">Strong Match</Badge>;
  } else if (matchScore >= 50) {
    matchBadge = <Badge className="bg-amber-500 hover:bg-amber-600">Possible Match</Badge>;
  } else {
    matchBadge = <Badge variant="outline">Low Match</Badge>;
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Match Score</span>
        {matchBadge}
      </div>
      
      <Progress 
        value={matchScore} 
        className={`h-2 ${
          matchScore >= 80 ? 'bg-green-100' : 
          matchScore >= 50 ? 'bg-amber-100' : 'bg-gray-100'
        }`}
      />
      
      {showDetails && (
        <div className="text-xs text-muted-foreground mt-1">
          <p>Based on:</p>
          <ul className="ml-4 list-disc">
            <li>Your expertise: {supplierProfile.areas_of_expertise.join(', ')}</li>
            <li>Your location: {supplierProfile.location}</li>
            <li>Your industry: {supplierProfile.industry}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
