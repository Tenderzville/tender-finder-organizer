
import { TenderList } from '@/components/tenders/TenderList';
import { CountyTenders } from '@/components/tenders/CountyTenders';
import { TenderMatcher } from '@/components/ai/TenderMatcher';
import { Tender } from "@/types/tender";
import { ScraperStatus } from "@/components/dashboard/ScraperStatus";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DashboardTenderSectionProps {
  tenders: Tender[];
  isLoadingTenders: boolean;
  errorTenders: Error | null;
  fetchTenders: () => Promise<void>;
  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
  handleViewTenderDetails: (id: number) => void;
  handleBookmarkTender: (id: number) => void;
  navigate: (path: string) => void;
  language: 'en' | 'sw';
  userData: any;
}

export const DashboardTenderSection = ({
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
  userData
}: DashboardTenderSectionProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImportFromSheets = async () => {
    try {
      setIsImporting(true);
      toast({
        title: "Importing Tenders",
        description: "Importing tender data from sample sheets...",
      });

      const { data, error } = await supabase.functions.invoke(
        'sync-google-sheets-to-supabase'
      );

      if (error) {
        toast({
          title: "Import Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Import Successful",
          description: `Imported ${data.totalImported} tenders from sheets. Refreshing...`,
        });
        await fetchTenders();
      } else {
        toast({
          title: "Import Issue",
          description: data?.message || "No tenders were imported. Please check the sheets URLs.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error importing from sheets:", err);
      toast({
        title: "Import Error",
        description: "An unexpected error occurred while importing from sheets.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      <div className="lg:col-span-3">
        {tenders.length === 0 && !isLoadingTenders && (
          <div className="flex flex-col items-center justify-center p-6 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-amber-800 mb-2">No Tenders Found</h3>
            <p className="text-sm text-amber-700 mb-4 text-center">
              We couldn't find any tenders in the database. You can import tenders from sample sheets or refresh to try again.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleImportFromSheets}
                disabled={isImporting}
                className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Import from Google Sheets
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={fetchTenders}
                disabled={isLoadingTenders}
                className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                {isLoadingTenders ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Tenders
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <TenderList 
          tenders={tenders}
          isLoading={isLoadingTenders}
          error={errorTenders}
          onRetry={fetchTenders}
          onBookmark={handleBookmarkTender}
          onViewDetails={handleViewTenderDetails}
          userId={userData?.id}
        />
      </div>

      {!isLoadingTenders && !errorTenders && tenders.length > 0 && (
        <>
          <div className="mt-8 lg:col-span-3">
            <CountyTenders
              tenders={tenders}
              onViewDetails={handleViewTenderDetails}
              language={language}
              shareActions={[
                {
                  label: "Bookmark",
                  action: handleBookmarkTender
                }
              ]}
            />
          </div>

          <div className="mt-8 lg:col-span-3">
            <TenderMatcher 
              userProfile={{ 
                areas_of_expertise: ["IT & Telecommunications", "Construction"],
                industry: "Technology",
                location: "Nairobi"
              }}
              language={language}
              userId={userData?.id || null}
              onViewDetails={(id) => navigate(`/tenders/${id}`)}
            />
          </div>
        </>
      )}
    </div>
  );
};
