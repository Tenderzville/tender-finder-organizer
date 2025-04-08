
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Globe, Briefcase, ExternalLink, ArrowLeft, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { TenderStatusBadge } from "@/components/ui/tender-status-badge";
import { getTenderStatus } from "@/types/tender";
import { useOfflineMode } from "@/hooks/use-offline-mode";

const TenderDetails = () => {
  const { tenderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline, offlineData, saveTenderOffline } = useOfflineMode();

  // First check if we have this tender in offline data
  const offlineTender = offlineData.tenders.find(
    tender => tender.id === parseInt(tenderId || '0', 10)
  );

  const { data: tender, isLoading, error } = useQuery({
    queryKey: ["tender", tenderId],
    queryFn: async () => {
      if (!tenderId) throw new Error("No tender ID provided");
      const numericId = parseInt(tenderId, 10);
      if (isNaN(numericId)) throw new Error("Invalid tender ID");

      console.log("Fetching tender details for ID:", numericId);

      // If we're offline, try to use cached data first
      if (!isOnline && offlineTender) {
        console.log("Using offline data for tender:", offlineTender);
        return offlineTender;
      }

      try {
        const { data, error } = await supabase
          .from("tenders")
          .select("*")
          .eq("id", numericId)
          .single();

        if (error) {
          console.error("Error fetching tender:", error);
          throw error;
        }

        if (!data) {
          throw new Error("Tender not found");
        }

        console.log("Fetched tender details:", data);
        
        // If online, save the tender for offline access
        if (isOnline) {
          saveTenderOffline(data);
        }
        
        return data;
      } catch (err) {
        console.error("Failed to fetch tender:", err);
        
        // If we failed to fetch but have offline data, use that
        if (offlineTender) {
          console.log("Falling back to offline data for tender:", offlineTender);
          return offlineTender;
        }
        
        throw err;
      }
    },
    enabled: !!tenderId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleShare = () => {
    if (!tender) return;
    
    const text = `Check out this tender: ${tender.title}`;
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: tender.title,
        text: text,
        url: url
      }).catch(err => {
        console.error("Share failed:", err);
      });
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast({
        title: "Link copied!",
        description: "Tender link copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">Loading tender details...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !tender) {
    console.error("Error or no tender data:", error);
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Tender Not Found</h2>
              <p className="mt-2 text-gray-600">
                {error instanceof Error
                  ? `Error: ${error.message}`
                  : "The tender you're looking for doesn't exist or has been removed."}
              </p>
              <Button onClick={() => navigate("/tenders")} className="mt-4">
                Return to Tenders
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const deadlineDate = new Date(tender.deadline);
  const tenderStatus = getTenderStatus(tender.deadline);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <Badge variant="secondary">
                  {tender.category}
                </Badge>
                {tender.subcategory && (
                  <Badge variant="outline">
                    {tender.subcategory}
                  </Badge>
                )}
                <TenderStatusBadge status={tenderStatus} />
                
                {tender.affirmative_action?.type && tender.affirmative_action.type !== 'none' && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                    {tender.affirmative_action.type === 'youth' ? 'Youth Opportunity' : 
                     tender.affirmative_action.type === 'women' ? 'Women Opportunity' : 
                     tender.affirmative_action.type === 'pwds' ? 'PWDs Opportunity' : 'Special Category'}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {tender.title}
              </h1>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Briefcase className="mr-2 h-4 w-4" />
                Contact: {tender.contact_info || "Not specified"}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Deadline: {format(deadlineDate, "PPP")}
                </div>
                <div className="flex items-center">
                  <Globe className="mr-2 h-4 w-4" />
                  Location: {tender.location}
                </div>
              </div>
            </div>

            <div className="space-y-6 border-t pt-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{tender.description || "No description provided."}</p>
              </div>

              {tender.requirements && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Requirements</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{tender.requirements}</p>
                </div>
              )}

              {tender.prerequisites && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Prerequisites</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{tender.prerequisites}</p>
                </div>
              )}

              {tender.fees && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Fees</h2>
                  <p className="text-gray-600">{tender.fees}</p>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-4">
                {tender.tender_url && (
                  <Button
                    onClick={() => {
                      const url = tender.tender_url!.startsWith('http')
                        ? tender.tender_url
                        : `https://${tender.tender_url}`;
                      window.open(url, "_blank");
                      
                      toast({
                        title: "Opening source website",
                        description: "Redirecting to the original tender posting.",
                      });
                    }}
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Original Tender
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex items-center"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Tender
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Notification Set",
                      description: "You'll be notified about updates to this tender.",
                    });
                  }}
                >
                  Set Reminder
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenderDetails;
