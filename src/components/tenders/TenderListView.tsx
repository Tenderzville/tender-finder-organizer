
import React from "react";
import { Tender } from "@/types/tender";
import TenderList from "./TenderList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardFooter } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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
          
          <TenderList
            tenders={tendersToDisplay}
            isLoading={false}
            error={error}
            onRetry={onRefresh}
            onShare={onShare}
          />
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
              <span></span>
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
