import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SavedTender } from "@/types/tender";

export const SavedTendersCard = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();

  const { data: savedTenders = [], isLoading } = useQuery({
    queryKey: ['saved-tenders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_tender")
        .select(`
          tender_id,
          tenders (
            id,
            title,
            deadline
          )
        `)
        .eq("supplier_id", userId);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.tenders.id,
        title: item.tenders.title,
        deadline: new Date(item.tenders.deadline).toLocaleDateString(),
      })) as SavedTender[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Saved Tenders</h2>
      <div className="space-y-4">
        {savedTenders.length > 0 ? (
          savedTenders.map((tender) => (
            <div
              key={tender.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">{tender.title}</p>
                <p className="text-sm text-gray-500">
                  Deadline: {tender.deadline}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/tenders/${tender.id}`)}
              >
                View
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">
            <BookmarkPlus className="mx-auto h-8 w-8 mb-2" />
            <p>No saved tenders yet</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/dashboard")}
            >
              Browse Tenders
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};