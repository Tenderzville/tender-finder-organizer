
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertCircle } from "lucide-react";
import { TenderEmptyState } from "@/components/tenders/TenderEmptyState";
import { Tender } from "@/types/tender";
import TenderList from "@/components/tenders/TenderList";
import { TenderStats } from "@/components/dashboard/TenderStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardTenderSectionProps {
  tenders: Tender[];
  isLoadingTenders: boolean;
  errorTenders: Error | null;
  fetchTenders: () => Promise<void>;
  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
  handleViewTenderDetails: (tender: Tender) => void;
  handleBookmarkTender: (tenderId: number) => Promise<void>;
  navigate: (path: string) => void;
  language: 'en' | 'sw';
  userData: any;
  sourcesBreakdown?: {name: string, count: number, status: string}[];
  lastScraped?: string | null;
}

export function DashboardTenderSection({
  tenders,
  isLoadingTenders,
  errorTenders,
  fetchTenders,
  showDebugInfo,
  setShowDebugInfo,
  handleViewTenderDetails,
  handleBookmarkTender,
  navigate,
  language,
  userData,
  sourcesBreakdown = [],
  lastScraped = null
}: DashboardTenderSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Tenders</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            {userData && <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">{language === 'en' ? 'Available Tenders' : 'Zabuni Zilizopo'}</h2>
                  <Button variant="outline" size="sm" onClick={() => navigate("/tenders")}>
                    {language === 'en' ? 'View All' : 'Angalia Zote'}
                  </Button>
                </div>
                
                {tenders.length === 0 && !isLoadingTenders ? (
                  <TenderEmptyState 
                    onCreateSamples={fetchTenders}
                    isRefreshing={isLoadingTenders}
                  />
                ) : (
                  <TenderList 
                    tenders={tenders.slice(0, 5)} 
                    isLoading={isLoadingTenders}
                    error={errorTenders}
                    onRetry={fetchTenders}
                    onViewDetails={(id) => {
                      const tender = tenders.find(t => t.id === id);
                      if (tender) handleViewTenderDetails(tender);
                    }}
                    onBookmark={handleBookmarkTender}
                  />
                )}
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommended">
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">{language === 'en' ? 'Recommended Tenders' : 'Zabuni Zilizopendekezwa'}</h2>
                </div>
                
                {tenders.length === 0 && !isLoadingTenders ? (
                  <TenderEmptyState 
                    onCreateSamples={fetchTenders}
                    isRefreshing={isLoadingTenders}
                  />
                ) : (
                  <TenderList 
                    tenders={tenders.filter(t => 
                      t.category === 'IT & Telecommunications' || 
                      t.category === 'Technology' ||
                      t.location === 'Nairobi'
                    ).slice(0, 5)} 
                    isLoading={isLoadingTenders}
                    error={errorTenders}
                    onRetry={fetchTenders}
                    onViewDetails={(id) => {
                      const tender = tenders.find(t => t.id === id);
                      if (tender) handleViewTenderDetails(tender);
                    }}
                    onBookmark={handleBookmarkTender}
                  />
                )}
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="bookmarked">
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">{language === 'en' ? 'Bookmarked Tenders' : 'Zabuni Zilizohifadhiwa'}</h2>
                </div>
                
                <Alert className="mb-4">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Sign in to bookmark tenders</AlertTitle>
                  <AlertDescription>
                    You need to be signed in to bookmark and save tenders for later
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        
        {errorTenders && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {errorTenders.message || "Failed to load tenders"}
            </AlertDescription>
          </Alert>
        )}
        
        {showDebugInfo && tenders.length === 0 && (
          <Alert className="mt-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>No Tenders Found</AlertTitle>
            <AlertDescription>
              <p>Check the Browser AI edge function logs for more information about why tenders aren't being fetched.</p>
              <Button 
                variant="link" 
                className="p-0 h-auto mt-2"
                onClick={() => fetchTenders()}
              >
                Try Refreshing Data
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <div>
        <TenderStats
          totalTenders={tenders.length}
          loading={isLoadingTenders}
          lastUpdated={lastScraped}
          refreshing={isLoadingTenders}
          onRefresh={fetchTenders}
          sources={sourcesBreakdown}
        />
      </div>
    </div>
  );
}
