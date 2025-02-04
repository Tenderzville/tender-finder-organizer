import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { PointsDisplay } from "./PointsDisplay";
import { VideoWatchCard } from "./VideoWatchCard";
import type { UserPoints } from "@/types/user";

export const PointsCard = ({ userId }: { userId: string }) => {
  const { toast } = useToast();

  const { data: userPoints, isLoading, refetch } = useQuery({
    queryKey: ['points', userId],
    queryFn: async () => {
      console.log("Fetching user points for:", userId);
      const { data, error } = await supabase
        .from("user_points")
        .select("points, ads_watched")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      console.log("User points data:", data);
      return data as UserPoints;
    },
  });

  const handleVideoWatched = async () => {
    try {
      const { error } = await supabase.rpc("update_user_points", {
        user_id: userId,
        points_to_add: 100
      });

      if (error) throw error;

      await refetch();

      toast({
        title: "Points Awarded!",
        description: "You've earned 100 points for watching the video!",
      });
    } catch (error: any) {
      console.error("Error updating points:", error);
      toast({
        title: "Error",
        description: "Failed to update points",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const currentPoints = userPoints?.points || 0;
  const adsWatched = userPoints?.ads_watched || 0;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <PointsDisplay currentPoints={currentPoints} />
        <VideoWatchCard 
          adsWatched={adsWatched}
          onVideoWatched={handleVideoWatched}
        />
      </div>
    </Card>
  );
};