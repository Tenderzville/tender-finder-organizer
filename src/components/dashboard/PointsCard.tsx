import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Video, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { UserPoints } from "@/types/user";

export const PointsCard = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [isWatchingVideo, setIsWatchingVideo] = useState(false);

  const { data: userPoints, isLoading } = useQuery({
    queryKey: ['points', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_points")
        .select("points, ads_watched")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserPoints;
    },
  });

  const handleVideoWatched = async () => {
    try {
      setIsWatchingVideo(true);
      await new Promise(resolve => setTimeout(resolve, 3000));

      const { error } = await supabase.rpc("update_user_points", {
        user_id: userId,
        points_to_add: 100
      });

      if (error) throw error;

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
    } finally {
      setIsWatchingVideo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Your Activity</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span>Videos Watched</span>
          <span>{userPoints?.ads_watched || 0}</span>
        </div>
        <Button 
          onClick={handleVideoWatched} 
          className="w-full"
          disabled={isWatchingVideo}
        >
          {isWatchingVideo ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Watching Video...
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Watch Video (+100 points)
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};