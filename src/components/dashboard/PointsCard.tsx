import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Video, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { UserPoints } from "@/types/user";

const POINTS_THRESHOLDS = {
  BASIC: 0,
  STANDARD: 1000,
  PREMIUM: 5000
};

export const PointsCard = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [isWatchingVideo, setIsWatchingVideo] = useState(false);

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
      setIsWatchingVideo(true);
      // Simulate video watching
      await new Promise(resolve => setTimeout(resolve, 3000));

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
    } finally {
      setIsWatchingVideo(false);
    }
  };

  const getNextThreshold = (currentPoints: number) => {
    if (currentPoints < POINTS_THRESHOLDS.STANDARD) {
      return POINTS_THRESHOLDS.STANDARD;
    } else if (currentPoints < POINTS_THRESHOLDS.PREMIUM) {
      return POINTS_THRESHOLDS.PREMIUM;
    }
    return POINTS_THRESHOLDS.PREMIUM;
  };

  const getProgressToNextLevel = (currentPoints: number) => {
    const nextThreshold = getNextThreshold(currentPoints);
    const prevThreshold = currentPoints < POINTS_THRESHOLDS.STANDARD 
      ? POINTS_THRESHOLDS.BASIC 
      : POINTS_THRESHOLDS.STANDARD;
    
    return ((currentPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
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
  const nextThreshold = getNextThreshold(currentPoints);
  const progress = getProgressToNextLevel(currentPoints);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your Points</h3>
          <span className="text-2xl font-bold">{currentPoints}</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to next level</span>
            <span>{nextThreshold - currentPoints} points needed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2">
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

        <div className="mt-4 text-sm text-muted-foreground">
          <p>Points Levels:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Basic (0-999 points): Access to basic tenders</li>
            <li>Standard (1,000-4,999 points): Access to standard tenders</li>
            <li>Premium (5,000+ points): Access to all tenders</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};