import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, RefreshCw, ArrowUpRight, RotateCw, AlertTriangle } from "lucide-react";
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
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          Scraper Status
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={triggerScraper} 
            disabled={isRefreshing}
            className="h-8 px-2"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          </Button>
        </CardTitle>
        <CardDescription>
          Last run: {data.lastRun 
            ? format(new Date(data.lastRun), "PPp")
            : 'Never'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.sources.map((source, i) => (
            <div key={i} className="bg-muted p-3 rounded-md text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">Source: {source.name}</span>
                <Badge variant={source.status === 'success' ? "success" : "destructive"}>
                  {source.status}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-2 text-xs">
                {source.count !== null && (
                  <div>Records Found: {source.count}</div>
                )}
                {source.lastSuccess && (
                  <div>Last Success: {format(new Date(source.lastSuccess), "PPp")}</div>
                )}
                {source.errorMessage && (
                  <div className="text-red-500">Error: {source.errorMessage}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Total Tenders Found:</span>
            <Badge variant="secondary">{data.tendersFound}</Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>New Tenders (Last 24h):</span>
            <Badge variant="success">{data.newTendersCount}</Badge>
          </div>
          {data.errorCount > 0 && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {data.errorCount} error{data.errorCount > 1 ? 's' : ''} occurred during scraping
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full text-sm text-center text-muted-foreground">
          Next scheduled run in: {data.nextRunIn}
        </div>
      </CardFooter>
    </Card>
  );
};
