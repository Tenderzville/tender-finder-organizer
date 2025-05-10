
import { TenderList } from '@/components/tenders/TenderList';
import { TenderLoadingState } from '@/components/tenders/TenderLoadingState';
import { TenderEmptyState } from '@/components/tenders/TenderEmptyState';
import { Tender } from "@/types/tender";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileSpreadsheet } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-client";
import { useState } from "react";

interface TenderContentProps {
  tenders: Tender[];
  isLoading: boolean;
  error: Error | null;
  isRefreshing: boolean;
  apiError: string | null;
  onRetry: () => Promise<void>;
  onCreateSamples: () => Promise<void>;
}

export const TenderContent = ({
  tenders,
  isLoading,
  error,
  isRefreshing,
  apiError,
  onRetry,
  onCreateSamples
}: TenderContentProps) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  
  const handleDirectImport = async () => {
    try {
      setIsImporting(true);
      toast({
        title: "Importing from Google Sheets",
        description: "Importing tender data directly from the configured sheets...",
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
      } else if (data?.success) {
        toast({
          title: "Import Successful",
          description: `Imported ${data.totalImported} tenders from Google Sheets. Refreshing data...`,
        });
        await onRetry();
      } else {
        toast({
          title: "Import Issue",
          description: "No tenders were imported. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error importing from sheets:", err);
      toast({
        title: "Import Error",
        description: "An unexpected error occurred while importing from Google Sheets.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 gap-6">
      {(isLoading && tenders.length === 0) ? (
        <TenderLoadingState />
      ) : (
        <>
          <TenderList 
            tenders={tenders}
            isLoading={isLoading && tenders.length === 0}
            error={error || (apiError ? new Error(apiError) : null)}
            onRetry={onRetry}
          />
          
          {tenders.length === 0 && !isLoading && !apiError && (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <h3 className="text-xl font-medium mb-4 text-red-600">No Tenders Available Yet</h3>
              <p className="text-gray-700 mb-4">
                Click the "Import from Google Sheets" button below to import tender data from the configured Google Sheets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleDirectImport}
                  disabled={isImporting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isImporting ? (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      Importing Data...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      Import from Google Sheets
                    </>
                  )}
                </Button>
                <Button 
                  onClick={onRetry}
                  disabled={isLoading || isRefreshing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Refreshing Data...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Refresh Data
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      
      {isRefreshing && (
        <Alert className="bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">Data Import in Progress</AlertTitle>
          <AlertDescription className="text-green-700">
            <p>We're currently importing the latest tender opportunities from Google Sheets.</p>
            <div className="flex justify-center mt-3">
              <RefreshCw className="h-5 w-5 animate-spin text-green-600" />
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
