
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const ScraperStatus = () => {
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
          console.error("Error checking scraper status:", error);
          throw error;
        }
        
        return data;
      } catch (err) {
        console.error("Failed to check scraper status:", err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const runScraper = async () => {
    setIsRefreshing(true);
    try {
      // Call the scrape-tenders function
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-tenders');
      
      if (scrapeError) {
        console.error('Error triggering scraper:', scrapeError);
        return;
      }
      
      console.log('Scraper response:', scrapeData);
      await refetch();
    } catch (error) {
      console.error('Error running scraper:', error);
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
          <CardDescription>There was an error checking the scraper status</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to check scraper status. Technical details: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={refreshStatus} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Try Again
          </Button>
        </CardFooter>
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
          Total tenders in database: {data.total_tenders || 0}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Recent Scraping Logs</h3>
          {data.scraping_logs && data.scraping_logs.length > 0 ? (
            <div className="space-y-3">
              {data.scraping_logs.map((log: any, index: number) => (
                <div key={index} className="bg-muted p-3 rounded-md text-sm">
                  <div className="flex justify-between mb-1">
                    <Badge variant={log.status === "success" ? "success" : "destructive"}>
                      {log.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {log.created_at ? format(new Date(log.created_at), "PPp") : "Unknown date"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>Source: {log.source || "Unknown"}</div>
                    <div>Found: {log.records_found || 0}</div>
                    <div>Inserted: {log.records_inserted || 0}</div>
                  </div>
                  {log.error_message && (
                    <div className="mt-2 text-xs text-destructive">
                      Error: {log.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No scraping logs found.</p>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium mb-2">Latest Tenders</h3>
          {data.latest_tenders && data.latest_tenders.length > 0 ? (
            <div className="space-y-3">
              {data.latest_tenders.map((tender: any) => (
                <div key={tender.id} className="bg-muted p-3 rounded-md text-sm">
                  <h4 className="font-medium mb-1">{tender.title}</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>Category: {tender.category}</div>
                    <div>Location: {tender.location}</div>
                    <div>Deadline: {tender.deadline ? format(new Date(tender.deadline), "PPP") : "Unknown"}</div>
                    <div>Created: {tender.created_at ? format(new Date(tender.created_at), "PPp") : "Unknown"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tenders found in the database.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={refreshStatus} variant="outline" disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh Status
        </Button>
        <Button onClick={runScraper} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Run Scraper Now
        </Button>
      </CardFooter>
    </Card>
  );
};
