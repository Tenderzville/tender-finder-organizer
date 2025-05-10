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

interface TenderListViewProps {
  tendersToDisplay: Tender[];
  error: Error | null;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onShowQualificationTool: () => void;
  translations: {
    latestTenders: string;
    browse: string;
    recentlyAdded: string;
    checkEligibility: string;
    error: string;
    errorDesc: string;
    noTenders: string;
    refreshTenders: string;
    refreshing: string;
    qualifyTool: string;
  };
  language: 'en' | 'sw';
  onShare?: (tender: Tender) => void;
}

export const TenderListView = ({ 
  tendersToDisplay,
  error,
  isRefreshing,
  onRefresh,
  onShowQualificationTool,
  translations: t,
  language,
  onShare
}: TenderListViewProps) => {
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
    navigate(`/tenders/${tenderId}`);
  }, [navigate]);

  const formatDate = useCallback((dateStr: string) => {
    try {
      return format(parseISO(dateStr), "PPP");
    } catch (err) {
      return "Unknown date";
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{t.latestTenders}</span>
          <Badge variant={tendersToDisplay.length > 0 ? "default" : "outline"}>
            {tendersToDisplay.length} Available
          </Badge>
        </CardTitle>
        <CardDescription>
          {t.browse}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="text-sm font-medium">{t.recentlyAdded}</h3>
            {tendersToDisplay.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onShowQualificationTool}
              >
                {t.checkEligibility}
              </Button>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t.error}</AlertTitle>
              <AlertDescription>
                {t.errorDesc}
              </AlertDescription>
            </Alert>
          )}
          
          {tendersToDisplay.length > 0 ? (
            <div className="space-y-3">
              {tendersToDisplay.map((tender: Tender) => (
                <div key={tender.id} className="bg-muted p-3 rounded-md text-sm">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium mb-1">{tender.title}</h4>
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
            </div>
          ) : (
            <div className="text-center py-6 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground mb-2">{t.noTenders}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRefresh}
              >
                {t.refreshTenders}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full space-y-2">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRefreshing ? t.refreshing : t.refreshTenders}
          </Button>
          
          {tendersToDisplay.length > 0 && (
            <Button 
              variant="default" 
              className="w-full"
              onClick={onShowQualificationTool}
            >
              {t.qualifyTool}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
