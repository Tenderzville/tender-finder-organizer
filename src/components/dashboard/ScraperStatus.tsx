import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const TenderFeed = () => {
  const { 
    data, 
    isLoading,
    error
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
          <Badge variant="success">
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
                  <h4 className="font-medium mb-1">{tender.title}</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>Category: {tender.category}</div>
                    <div>Location: {tender.location}</div>
                    <div>Deadline: {tender.deadline ? format(new Date(tender.deadline), "PPP") : "Unknown"}</div>
                    <div>Posted: {tender.created_at ? format(new Date(tender.created_at), "PPp") : "Unknown"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tenders currently available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
