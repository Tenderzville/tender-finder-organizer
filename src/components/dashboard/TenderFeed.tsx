
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, RefreshCw, ArrowUpRight, ExternalLink, Calendar, MapPin, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const TenderFeed = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simplified query with better caching and error handling
  const { 
    data, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["dashboard-tenders"],
    queryFn: async () => {
      console.log("TenderFeed: Fetching latest tenders");
      
      try {
        // Direct database approach - most efficient
        const { data: latestTenders, error: tendersError } = await supabase
          .from('tenders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (tendersError) {
          console.error("Error fetching tenders from database:", tendersError);
          throw tendersError;
        }
        
        // Get total count
        const { count, error: countError } = await supabase
          .from('tenders')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error("Error counting tenders:", countError);
        }
        
        if (latestTenders && latestTenders.length > 0) {
          console.log(`TenderFeed: Found ${latestTenders.length} tenders in database`);
          return {
            latest_tenders: latestTenders,
            total_tenders: count || 0,
            last_scrape: new Date().toISOString()
          };
        }
        
        // If no tenders in database, return empty state
        console.log("TenderFeed: No tenders found in database");
        return {
          latest_tenders: [],
          total_tenders: 0,
          last_scrape: new Date().toISOString()
        };
      } catch (err) {
        console.error("Failed to fetch tender updates:", err);
        // Return empty data structure instead of throwing
        return {
          latest_tenders: [],
          total_tenders: 0,
          last_scrape: new Date().toISOString()
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 15, // 15 minutes
    retry: 1 // Reduce retries
  });

  const refreshTenderFeed = async () => {
    setIsRefreshing(true);
    
    try {
      // Trigger scrape first - but don't wait for it to complete
      console.log("Triggering tender scrape");
      supabase.functions.invoke('scrape-tenders', {
        body: { force: true }
      }).then(({data, error}) => {
        if (error) {
          console.error("Error triggering tender scrape:", error);
        } else {
          console.log("Scrape result:", data);
        }
      });
      
      // Immediately refetch from database
      await refetch();
      
      toast({
        title: "Feed Refreshed",
        description: "Latest tender information loaded",
      });
    } catch (err) {
      console.error("Failed to refresh tender feed:", err);
      toast({
        title: "Refresh Error",
        description: "Could not refresh tenders",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShareOnSocial = async (tenderId: number) => {
    try {
      toast({
        title: "Sharing tender",
        description: "Sending to social media channels...",
      });

      const { data: result, error } = await supabase.functions.invoke('send-social-media', {
        body: { tenderId }
      });

      if (error) {
        console.error("Error sharing tender:", error);
        toast({
          title: "Sharing Failed",
          description: `Could not share tender: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log("Social media sharing result:", result);
        toast({
          title: "Tender Shared",
          description: `Successfully shared to ${result.twitter ? 'Twitter' : ''}${result.twitter && result.telegram ? ' and ' : ''}${result.telegram ? 'Telegram' : ''}`,
        });
      }
    } catch (err) {
      console.error("Failed to share tender:", err);
      toast({
        title: "Sharing Error",
        description: "An unexpected error occurred while sharing",
        variant: "destructive",
      });
    }
  };

  const handleViewTender = (tenderId: number) => {
    navigate(`/tenders/${tenderId}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "PPP");
    } catch (err) {
      return "Unknown date";
    }
  };

  // Simplified render logic with cleaner fallbacks
  const tendersToDisplay = data?.latest_tenders || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Tenders</CardTitle>
          <CardDescription>Loading tender information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Latest Tenders</span>
          <Badge variant={tendersToDisplay.length > 0 ? "default" : "outline"}>
            {tendersToDisplay.length} Available
          </Badge>
        </CardTitle>
        <CardDescription>
          Browse and find relevant tenders for your business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Recently Added</h3>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Unable to fetch tender updates. Please try again later.
              </AlertDescription>
            </Alert>
          )}
          
          {tendersToDisplay.length > 0 ? (
            <div className="space-y-3">
              {tendersToDisplay.map((tender: any) => (
                <div key={tender.id} className="bg-muted p-3 rounded-md text-sm">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium mb-1">{tender.title}</h4>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleShareOnSocial(tender.id)}
                        title="Share on social media"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
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
                      Posted: {tender.created_at ? formatDate(tender.created_at) : "Recently"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground mb-2">No tenders currently available.</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshTenderFeed}
              >
                Refresh Tenders
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={refreshTenderFeed}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRefreshing ? "Refreshing..." : "Refresh Tenders"}
        </Button>
      </CardFooter>
    </Card>
  );
};
