import { useState, useEffect } from "react";
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
import { parseTenderAffirmativeAction } from "@/types/tender";

export const TenderFeed = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQualificationTool, setShowQualificationTool] = useState(false);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');

  // Optimized query with proper error handling and real data prioritization
  const { 
    data, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["dashboard-tenders"],
    queryFn: async () => {
      console.log("TenderFeed: Fetching latest tenders");
      
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
      
      // Map the raw database records to the Tender type with proper affirmative_action handling
      const formattedTenders = latestTenders?.map(tender => ({
        ...tender,
        // Use the parser to safely handle the affirmative_action JSON
        affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action)
      })) || [];
      
      return {
        latest_tenders: formattedTenders,
        total_tenders: count || 0,
        last_scrape: new Date().toISOString(),
        source: "database"
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: false, // Prevent automatic refetching which causes flickering
    retry: 1,
    refetchOnWindowFocus: false // Prevent excessive refetches
  });

  // Fetch data on component mount only once
  useEffect(() => {
    refetch();
  }, []);

  const refreshTenderFeed = async () => {
    setIsRefreshing(true);
    
    try {
      // Trigger scrape with force parameter
      await supabase.functions.invoke('scrape-tenders', {
        body: { force: true }
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
      // Open WhatsApp directly
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

  // Use tenders from data or empty array
  const tendersToDisplay = data?.latest_tenders as Tender[] || [];

  // Translations
  const t = {
    en: {
      latestTenders: "Latest Tenders",
      browse: "Browse and find relevant tenders for your business",
      recentlyAdded: "Recently Added",
      checkEligibility: "Check My Eligibility",
      error: "Error",
      errorDesc: "Unable to fetch tender updates.",
      noTenders: "No tenders currently available.",
      refreshTenders: "Refresh Tenders",
      refreshing: "Refreshing...",
      qualifyTool: "Will I Qualify? Pre-Check Tool"
    },
    sw: {
      latestTenders: "Zabuni za Hivi Karibuni",
      browse: "Vinjari na upate zabuni zinazofaa kwa biashara yako",
      recentlyAdded: "Zilizoongezwa Karibuni",
      checkEligibility: "Angalia Ustahiki Wangu",
      error: "Hitilafu",
      errorDesc: "Imeshindwa kupata sasisho za zabuni.",
      noTenders: "Hakuna zabuni zinazopatikana kwa sasa.",
      refreshTenders: "Sasisha Zabuni",
      refreshing: "Inasasisha...",
      qualifyTool: "Nitastahiki? Chombo cha Ukaguzi wa Awali"
    }
  }[language];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{t.latestTenders}</span>
          <Badge variant={tendersToDisplay.length > 0 ? "default" : "outline"}>
            {tendersToDisplay.length} Available
          </Badge>
        </CardTitle>
        <CardDescription>
          {t.browse}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="text-sm font-medium">{t.recentlyAdded}</h3>
            {tendersToDisplay.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowQualificationTool(true)}
              >
                {t.checkEligibility}
              </Button>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t.error}</AlertTitle>
              <AlertDescription>
                {t.errorDesc}
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
              <p className="text-sm text-muted-foreground mb-2">{t.noTenders}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshTenderFeed}
              >
                {t.refreshTenders}
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
            {isRefreshing ? t.refreshing : t.refreshTenders}
          </Button>
          
          {tendersToDisplay.length > 0 && !showQualificationTool && (
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => setShowQualificationTool(true)}
            >
              {t.qualifyTool}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
