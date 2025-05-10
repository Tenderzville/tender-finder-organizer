
import React, { useCallback } from "react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardFooter } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { AlertTitle } from "@/components/ui/alert";
import { AlertDescription } from "@/components/ui/alert";
import { 
  ExternalLink, 
  ArrowUpRight, 
  Calendar, 
  MapPin, 
  Tag, 
  AlertCircle, 
  RefreshCw, 
  Loader2 
} from "lucide-react";
import { Tender } from "@/types/tender";

interface TenderListProps {
  tenders: Tender[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => Promise<void>;
  onShare?: (tender: Tender) => void;
  onBookmark?: (tenderId: number) => void;
  onViewDetails?: (tenderId: number) => void;
  userId?: string;
}

// This component should be exported as the default export
const TenderList = ({ 
  tenders = [], 
  isLoading, 
  error, 
  onRetry,
  onShare,
  onBookmark,
  onViewDetails,
  userId
}: TenderListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleShareOnSocial = useCallback(async (tenderId: number) => {
    try {
      const text = encodeURIComponent(`Check out this tender: ${window.location.origin}/tenders/${tenderId}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
      
      toast({
        title: "Share via WhatsApp",
        description: "WhatsApp share link opened",
      });
    } catch (err) {
      console.error("Failed to share tender:", err);
      toast({
        title: "Sharing Error",
        description: "An unexpected error occurred while sharing",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleViewTender = useCallback((tenderId: number) => {
    if (onViewDetails) {
      onViewDetails(tenderId);
    } else {
      navigate(`/tenders/${tenderId}`);
    }
  }, [navigate, onViewDetails]);

  const formatDate = useCallback((dateStr: string) => {
    try {
      return format(parseISO(dateStr), "PPP");
    } catch (err) {
      return "Unknown date";
    }
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading tenders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading tenders</AlertTitle>
        <AlertDescription>
          {error.message || "Unable to load tenders. Please try again later."}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetry()}
            className="mt-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (tenders.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-md">
        <p className="text-muted-foreground mb-4">No tenders available at the moment.</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onRetry()}
        >
          Refresh Tenders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tenders.map((tender: Tender) => (
        <div key={tender.id} className="bg-card p-4 rounded-md border">
          <div className="flex justify-between items-start">
            <h4 className="font-medium">{tender.title}</h4>
            <div className="flex gap-2">
              {onShare && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onShare(tender)}
                  title="Share tender"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              )}
              {onBookmark && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onBookmark(tender.id)}
                  title="Bookmark tender"
                >
                  <Tag className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleViewTender(tender.id)}
                title="View details"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {tender.affirmative_action && (
            <div className="mt-1 mb-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                {tender.affirmative_action.type === 'youth' ? 'Youth Opportunity' : 
                 tender.affirmative_action.type === 'women' ? 'Women Opportunity' : 
                 tender.affirmative_action.type === 'pwds' ? 'PWDs Opportunity' : 'Special Category'}
              </Badge>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="flex items-center">
              <Tag className="h-3 w-3 mr-1" />
              {tender.category || "Uncategorized"}
            </div>
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {tender.location || "Not specified"}
            </div>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Deadline: {tender.deadline ? formatDate(tender.deadline) : "Unknown"}
            </div>
            <div>
              {tender.fees && `Value: ${tender.fees}`}
              {!tender.fees && "Value: Contact for pricing"}
            </div>
          </div>
        </div>
      ))}
      
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => onRetry()}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh Tenders
      </Button>
    </div>
  );
};

// Export both the default export and named export
export default TenderList;
export { TenderList };
