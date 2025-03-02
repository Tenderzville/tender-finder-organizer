
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
import { QualificationTool } from "@/components/tenders/QualificationTool";
import type { Tender } from "@/types/tender";

// Sample fallback data
const FALLBACK_TENDERS: Tender[] = [
  {
    id: 9001,
    title: "Road Construction and Maintenance Services",
    description: "Seeking qualified contractors for road construction and maintenance in Nairobi County. Must have Class A registration and minimum 5 years experience in similar projects.",
    requirements: "Class A registration required. Annual turnover of at least KES 50M. Must have completed at least 3 similar projects in the last 5 years.",
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    contact_info: "procurement@nairobi.go.ke",
    fees: "KES 45,000,000",
    prerequisites: "Site visit mandatory",
    created_at: new Date().toISOString(),
    category: "Construction",
    subcategory: "Roads",
    tender_url: "https://tenders.go.ke/tender/123456",
    location: "Nairobi",
    affirmative_action: {
      type: 'youth',
      percentage: 30,
      details: 'This tender has a 30% allocation for youth-owned businesses'
    }
  },
  {
    id: 9002,
    title: "Medical Supplies and Equipment",
    description: "Supply and delivery of medical equipment to county hospitals. Looking for medical suppliers with experience in healthcare procurement.",
    requirements: "Must be registered with Kenya Medical Supplies Authority. Minimum 3 years in business. Must provide product warranties.",
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    contact_info: "procurement@health.go.ke",
    fees: "KES 12,500,000",
    prerequisites: "Samples may be required",
    created_at: new Date().toISOString(),
    category: "Healthcare",
    subcategory: "Medical Equipment",
    tender_url: "https://tenders.go.ke/tender/123457",
    location: "Mombasa",
    affirmative_action: {
      type: 'women',
      percentage: 30,
      details: 'This tender has a 30% allocation for women-owned businesses'
    }
  },
  {
    id: 9003,
    title: "IT Infrastructure Upgrade",
    description: "Comprehensive IT infrastructure upgrade for government offices including networking, servers, and workstations.",
    requirements: "ICT Authority registration required. Must have CCNA certified staff. Previous government contracts preferred.",
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    contact_info: "ict@treasury.go.ke",
    fees: "KES 28,750,000",
    prerequisites: "Security clearance required",
    created_at: new Date().toISOString(),
    category: "ICT",
    subcategory: "Infrastructure",
    tender_url: "https://tenders.go.ke/tender/123458",
    location: "Nairobi"
  }
];

export const TenderFeed = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQualificationTool, setShowQualificationTool] = useState(false);

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
        
        // If we have tenders in the database, return them
        if (latestTenders && latestTenders.length > 0) {
          console.log(`TenderFeed: Found ${latestTenders.length} tenders in database`);
          return {
            latest_tenders: latestTenders,
            total_tenders: count || 0,
            last_scrape: new Date().toISOString(),
            source: "database"
          };
        }
        
        // If no tenders in database, use fallback data
        console.log("TenderFeed: No tenders found in database, using fallback data");
        return {
          latest_tenders: FALLBACK_TENDERS,
          total_tenders: FALLBACK_TENDERS.length,
          last_scrape: new Date().toISOString(),
          source: "fallback"
        };
      } catch (err) {
        console.error("Failed to fetch tender updates:", err);
        // Return fallback data in case of error
        return {
          latest_tenders: FALLBACK_TENDERS,
          total_tenders: FALLBACK_TENDERS.length,
          last_scrape: new Date().toISOString(),
          source: "fallback",
          error: err instanceof Error ? err.message : String(err)
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 15, // 15 minutes
    retry: 1, // Reduce retries
    refetchOnWindowFocus: false // Prevent excessive refetches
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
        description: "Opening sharing options...",
      });

      // Open native share dialog if available
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this tender opportunity',
          text: 'I found this tender that might interest you',
          url: `${window.location.origin}/tenders/${tenderId}`,
        });
        
        toast({
          title: "Share Options Opened",
          description: "Share this tender with others",
        });
        return;
      }
      
      // If native sharing not available, use WhatsApp directly
      const text = encodeURIComponent(`Check out this tender: ${window.location.origin}/tenders/${tenderId}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
      
      toast({
        title: "Share via WhatsApp",
        description: "WhatsApp share link opened",
      });
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

  // Use tenders from data or fallback to empty array
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

  // If showing qualification tool and we have tenders
  if (showQualificationTool && tendersToDisplay.length > 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Will I Qualify?</CardTitle>
            <CardDescription>
              Check your eligibility for available tenders
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowQualificationTool(false)}
          >
            Back to Tenders
          </Button>
        </CardHeader>
        <CardContent>
          <QualificationTool tenders={tendersToDisplay} />
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
          <div className="flex justify-between mb-4">
            <h3 className="text-sm font-medium">Recently Added</h3>
            {tendersToDisplay.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowQualificationTool(true)}
              >
                Check My Eligibility
              </Button>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Unable to fetch tender updates. Using sample data for demonstration.
              </AlertDescription>
            </Alert>
          )}
          
          {data?.source === "fallback" && !error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Using Sample Data</AlertTitle>
              <AlertDescription>
                We're currently displaying sample tenders for demonstration purposes.
              </AlertDescription>
            </Alert>
          )}
          
          {tendersToDisplay.length > 0 ? (
            <div className="space-y-3">
              {tendersToDisplay.map((tender: Tender) => (
                <div key={tender.id} className="bg-muted p-3 rounded-md text-sm">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium mb-1">{tender.title}</h4>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleShareOnSocial(tender.id)}
                        title="Share tender"
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
                  
                  {tender.affirmative_action && (
                    <div className="mt-1 mb-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                        {tender.affirmative_action.type === 'youth' ? 'Youth Opportunity' : 
                          tender.affirmative_action.type === 'women' ? 'Women Opportunity' : 
                          tender.affirmative_action.type === 'pwds' ? 'PWDs Opportunity' : 'Special Category'}
                      </Badge>
                    </div>
                  )}
                  
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
                      {tender.fees && `Value: ${tender.fees}`}
                      {!tender.fees && "Value: Contact for pricing"}
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
        <div className="w-full space-y-2">
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
          
          {tendersToDisplay.length > 0 && !showQualificationTool && (
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => setShowQualificationTool(true)}
            >
              Will I Qualify? Pre-Check Tool
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
