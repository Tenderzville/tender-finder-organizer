
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bug, Database, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { forceTriggerScraper } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";

export function ScraperDebugInfo() {
  const [isLoading, setIsLoading] = useState(false);
  const [tenderCount, setTenderCount] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isForcing, setIsForcing] = useState(false);
  const { toast } = useToast();

  const checkDatabase = async () => {
    setIsLoading(true);
    try {
      // Check tender count - use proper count query format
      const { count, error: countError } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error("Database count error:", countError);
        setLastError(`Database count error: ${countError.message}`);
      } else {
        console.log(`Found ${count} tenders in database check`);
        setTenderCount(count);
      }
      
      // Check last scraping error
      const { data: logs, error: logsError } = await supabase
        .from('scraping_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (logsError) {
        console.error("Error fetching logs:", logsError);
      } else if (logs && logs[0] && logs[0].error_message) {
        setLastError(logs[0].error_message);
      }
    } catch (err) {
      console.error("Error checking database:", err);
      setLastError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const createEmergencyTenders = async () => {
    setIsForcing(true);
    try {
      toast({
        title: "Creating sample tenders",
        description: "Adding sample tenders to the database...",
      });
      
      const sampleTenders = [
        {
          title: "Emergency Sample Tender",
          description: "This is a sample tender created for testing purposes.",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          category: "Sample",
          location: "Test Location"
        },
        {
          title: "Sample Youth AGPO Tender",
          description: "This is a sample AGPO tender for youth.",
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          category: "IT",
          location: "Nairobi",
          affirmative_action: { type: "youth", percentage: 30 }
        }
      ];
      
      const { data, error } = await supabase
        .from('tenders')
        .insert(sampleTenders)
        .select();
        
      if (error) {
        setLastError(`Error creating samples: ${error.message}`);
        toast({
          title: "Error",
          description: `Failed to create samples: ${error.message}`,
          variant: "destructive"
        });
      } else {
        setLastError(null);
        toast({
          title: "Success",
          description: `Created ${data.length} sample tenders`,
        });
        await checkDatabase();
        
        // Reload the page to show the new tenders
        window.location.reload();
      }
    } catch (err) {
      console.error("Error creating samples:", err);
      setLastError(err instanceof Error ? err.message : "Unknown error");
      toast({
        title: "Error",
        description: "Could not create sample tenders",
        variant: "destructive"
      });
    } finally {
      setIsForcing(false);
    }
  };

  const forceScraping = async () => {
    setIsForcing(true);
    try {
      toast({
        title: "Forcing scraper",
        description: "Triggering scraper to fetch latest tenders...",
      });
      
      const result = await forceTriggerScraper();
      if (!result.success) {
        setLastError(`Error forcing scraper: ${JSON.stringify(result.error)}`);
        toast({
          title: "Error",
          description: "Failed to trigger scraper",
          variant: "destructive"
        });
      } else {
        setLastError(null);
        toast({
          title: "Scraper triggered",
          description: "Successfully triggered scraper",
        });
        
        // Wait a moment for scraping to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        await checkDatabase();
        
        // Reload the page to show the new tenders
        window.location.reload();
      }
    } catch (err) {
      console.error("Error forcing scraper:", err);
      setLastError(err instanceof Error ? err.message : "Unknown error");
      toast({
        title: "Error",
        description: "Could not trigger scraper",
        variant: "destructive"
      });
    } finally {
      setIsForcing(false);
    }
  };

  useEffect(() => {
    checkDatabase();
    
    // Set up a refresh interval
    const intervalId = setInterval(checkDatabase, 10000); // Check every 10 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card className="shadow-md mt-4">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center">
          <Bug className="h-5 w-5 mr-2" />
          Scraper Diagnostics
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto"
            onClick={checkDatabase}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Tenders in database:</span>
            <span className="font-medium">
              {tenderCount !== null ? tenderCount : 'Checking...'}
            </span>
          </div>
          
          {lastError && (
            <Alert variant="destructive" className="text-xs">
              <AlertTitle>Last Error</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap break-words">
                {lastError}
              </AlertDescription>
            </Alert>
          )}
          
          {tenderCount === 0 && (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>No tenders found</AlertTitle>
              <AlertDescription>
                There are currently no tenders in the database. Try creating samples or force the scraper.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex space-x-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex-1"
              onClick={createEmergencyTenders}
              disabled={isForcing}
            >
              {isForcing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Samples
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={forceScraping}
              disabled={isForcing}
            >
              {isForcing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Force Scraper
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
