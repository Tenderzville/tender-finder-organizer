
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, RefreshCw, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export const ScraperStatus = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    data, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["scraper-status"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-scraper-status');
        
        if (error) {
          console.error("Error fetching scraper status:", error);
          throw error;
        }
        
        return data;
      } catch (err) {
        console.error("Failed to fetch scraper status:", err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });

  const triggerScraper = async () => {
    setIsRefreshing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('scrape-tenders');
      
      if (error) {
        console.error("Error triggering scraper:", error);
        toast({
          title: "Scraper Error",
          description: `Failed to run scraper: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log("Scraper run result:", result);
        toast({
          title: "Scraper Completed",
          description: `Found ${result?.tenders_scraped || 0} new tenders`,
        });
        refetch();
      }
    } catch (err) {
      console.error("Failed to trigger scraper:", err);
      toast({
        title: "Scraper Error",
        description: "An unexpected error occurred while running the scraper",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scraper Status</CardTitle>
          <CardDescription>Checking scraper status...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scraper Status</CardTitle>
          <CardDescription>Unable to check scraper status</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Unable to check scraper status. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Scraper Status</span>
          <Badge variant={data.scraper_available ? "success" : "destructive"}>
            {data.scraper_available ? "Available" : "Unavailable"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Monitor and manage tender scraping operations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Latest Scraping Logs</h3>
          {data.scraping_logs && data.scraping_logs.length > 0 ? (
            <div className="space-y-3">
              {data.scraping_logs.map((log: any) => (
                <div key={log.id} className="bg-muted p-3 rounded-md text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Source: {log.source}</span>
                    <Badge variant={log.status === 'success' ? "success" : "destructive"}>
                      {log.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-2 mt-2 text-xs">
                    {log.records_found !== null && (
                      <div>Records Found: {log.records_found}</div>
                    )}
                    {log.records_inserted !== null && (
                      <div>Records Inserted: {log.records_inserted}</div>
                    )}
                    {log.error_message && (
                      <div className="text-red-500">Error: {log.error_message}</div>
                    )}
                    <div>Time: {log.created_at ? format(new Date(log.created_at), "PPp") : "Unknown"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No scraping logs available.</p>
          )}
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-sm font-medium mb-2">Database Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-3 rounded-md">
              <div className="text-sm font-medium">Total Tenders</div>
              <div className="text-2xl font-bold">{data.total_tenders || 0}</div>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <div className="text-sm font-medium">Latest Run</div>
              <div className="text-sm">
                {data.scraping_logs && data.scraping_logs.length > 0
                  ? format(new Date(data.scraping_logs[0].created_at), "PPp")
                  : "Never"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Status
        </Button>
        <Button 
          onClick={triggerScraper} 
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Running...
            </>
          ) : (
            <>
              <ArrowUpRight className="h-4 w-4" /> Run Scraper Now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
