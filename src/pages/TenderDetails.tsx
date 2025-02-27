
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Globe, Briefcase, ExternalLink, ArrowLeft, AlertTriangle, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter } from "date-fns";

const TenderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: tender, isLoading } = useQuery({
    queryKey: ["tender", id],
    queryFn: async () => {
      if (!id) throw new Error("No tender ID provided");
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) throw new Error("Invalid tender ID");

      console.log("Fetching tender details for ID:", numericId);

      const { data, error } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", numericId)
        .single();

      if (error) {
        console.error("Error fetching tender:", error);
        toast({
          title: "Error",
          description: "Failed to load tender details. Please try again.",
          variant: "destructive",
        });
        throw error;
      }

      if (!data) {
        toast({
          title: "Not Found",
          description: "The requested tender could not be found.",
          variant: "destructive",
        });
        throw new Error("Tender not found");
      }

      console.log("Fetched tender details:", data);
      return data;
    },
  });

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

  if (!tender) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Tender Not Found</h2>
              <p className="mt-2 text-gray-600">The tender you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Return to Tenders
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const deadlineDate = new Date(tender.deadline);
  const isExpired = !isAfter(deadlineDate, new Date());

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
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">
                  {tender.category}
                </Badge>
                {tender.subcategory && (
                  <Badge variant="outline">
                    {tender.subcategory}
                  </Badge>
                )}
                {isExpired ? (
                  <Badge variant="destructive" className="flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                ) : (
                  <Badge variant="success" className="flex items-center bg-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Active
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
                    }}
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Original Tender
                  </Button>
                )}
                
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
