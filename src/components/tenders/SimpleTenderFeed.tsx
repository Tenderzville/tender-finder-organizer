
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const SimpleTenderFeed = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Optimized query with proper error handling
  const { 
    data, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["dashboard-tenders-simple"],
    queryFn: async () => {
      console.log("SimpleTenderFeed: Fetching latest tenders");
      
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
      
      return {
        latest_tenders: latestTenders || [],
        total_tenders: count || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: false,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const refreshTenderFeed = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      toast({
        title: "Refreshing Tenders",
        description: "Fetching the latest tenders...",
      });
      
      await refetch();
      
      toast({
        title: "Feed Refreshed",
        description: "Latest tenders loaded",
      });
    } catch (err) {
      console.error("Failed to refresh tender feed:", err);
      toast({
        title: "Refresh Error",
        description: "Could not refresh tenders. Please try again later.",
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
          <CardDescription>Error loading tenders</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Unable to load tender information. Please try again.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tenders = data?.latest_tenders || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Tenders</CardTitle>
        <CardDescription>
          Browse and find relevant tenders for your business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tenders.length > 0 ? (
          <div className="space-y-3">
            {tenders.map((tender: any) => (
              <div key={tender.id} className="bg-muted p-3 rounded-md text-sm">
                <h4 className="font-medium mb-1">{tender.title || "Untitled Tender"}</h4>
                <div className="text-xs text-muted-foreground">
                  {tender.category && <span className="mr-2">Category: {tender.category}</span>}
                  {tender.location && <span className="mr-2">Location: {tender.location}</span>}
                  {tender.deadline && <span>Deadline: {new Date(tender.deadline).toLocaleDateString()}</span>}
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
