
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, RefreshCw, ArrowUpRight, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const TenderFeed = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { 
    data, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["tender-updates"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-scraper-status');
        
        if (error) {
          console.error("Error fetching tender updates:", error);
          throw error;
        }
        
        return data;
      } catch (err) {
        console.error("Failed to fetch tender updates:", err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchInterval: 1000 * 60 * 15, // 15 minutes
    retry: 1
  });

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

  const refreshTenderFeed = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Feed Refreshed",
        description: "Latest tender information loaded",
      });
    } catch (err) {
      console.error("Failed to refresh tender feed:", err);
      toast({
        title: "Refresh Error",
        description: "Could not refresh tender feed",
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
          <CardTitle>Latest Tenders</CardTitle>
          <CardDescription>Loading tender information...</CardDescription>
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
          <CardTitle>Latest Tenders</CardTitle>
          <CardDescription>Unable to load tenders</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Unable to fetch tender updates. Please try again later.
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
          <span>Latest Tenders</span>
          <Badge variant="outline">
            {data.total_tenders || 0} Available
          </Badge>
        </CardTitle>
        <CardDescription>
          Browse and find relevant tenders for your business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Recently Added</h3>
          {data.latest_tenders && data.latest_tenders.length > 0 ? (
            <div className="space-y-3">
              {data.latest_tenders.map((tender: any) => (
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
                    <div>Category: {tender.category || "Uncategorized"}</div>
                    <div>Location: {tender.location || "Not specified"}</div>
                    <div>Deadline: {tender.deadline ? format(new Date(tender.deadline), "PPP") : "Unknown"}</div>
                    <div>Posted: {tender.created_at ? format(new Date(tender.created_at), "PPp") : "Unknown"}</div>
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
                onClick={() => navigate("/")}
              >
                Browse All Tenders
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
          Refresh Tenders
        </Button>
      </CardFooter>
    </Card>
  );
};
