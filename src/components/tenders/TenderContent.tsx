
import { TenderList } from '@/components/tenders/TenderList';
import { TenderLoadingState } from '@/components/tenders/TenderLoadingState';
import { TenderEmptyState } from '@/components/tenders/TenderEmptyState';
import { Tender } from "@/types/tender";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileSpreadsheet, Share2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-client";
import { useState } from "react";
import { generateSocialMediaPost } from "@/utils/tenderAnalysis";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [socialPost, setSocialPost] = useState("");
  
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
  
  const handleGenerateSocialPost = (tender: Tender) => {
    setSelectedTender(tender);
    setSocialPost(generateSocialMediaPost(tender));
  };
  
  const handleShareSocialPost = async () => {
    if (!selectedTender) return;
    
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(socialPost);
      
      toast({
        title: "Copied to clipboard",
        description: "The social media post has been copied to your clipboard."
      });
      
      // Here we would normally also post directly to social media
      // For now we're just tracking that a share action happened
      await supabase.from('social_shares').insert({
        platform: 'clipboard',
        share_url: selectedTender.tender_url || '',
        user_id: (await supabase.auth.getUser()).data.user?.id || 'anonymous',
        verified: true
      });
      
    } catch (err) {
      console.error("Error sharing social post:", err);
      toast({
        title: "Share Error",
        description: "Could not copy the social media post to clipboard.",
        variant: "destructive",
      });
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
            onShare={handleGenerateSocialPost}
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
      
      <Dialog>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share on Social Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea 
              value={socialPost}
              onChange={(e) => setSocialPost(e.target.value)}
              className="min-h-[200px]"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleShareSocialPost}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Copy & Share
              </Button>
            </div>
          </div>
        </DialogContent>
        <DialogTrigger asChild>
          <span className="hidden">Open share dialog</span>
        </DialogTrigger>
      </Dialog>
    </div>
  );
};
