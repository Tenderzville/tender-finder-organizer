import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Globe, Briefcase, ExternalLink, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
              <Button onClick={() => navigate("/dashboard")} className="mt-4">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
              <Badge variant="secondary" className="mb-4">
                {tender.category}
              </Badge>
              {tender.subcategory && (
                <Badge variant="outline" className="ml-2 mb-4">
                  {tender.subcategory}
                </Badge>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {tender.title}
              </h1>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Briefcase className="mr-2 h-4 w-4" />
                Contact: {tender.contact_info || "Not specified"}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                Deadline: {new Date(tender.deadline).toLocaleDateString()}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{tender.description}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Requirements</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{tender.requirements}</p>
              </div>

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

              {tender.tender_url && (
                <div className="mt-8">
                  <Button
                    onClick={() => window.open(tender.tender_url, "_blank")}
                    className="w-full sm:w-auto"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Original Tender
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenderDetails;

