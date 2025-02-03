import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TenderNotification } from "@/components/notifications/TenderNotification";
import { Bell, BookmarkPlus, Video, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface UserProfile {
  company_name: string;
  total_points: number;
}

interface UserPoints {
  points: number;
  ads_watched: number;
}

interface SavedTender {
  id: number;
  title: string;
  deadline: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isWatchingVideo, setIsWatchingVideo] = useState(false);

  // Fetch user data
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return null;
      }
      return user;
    },
  });

  // Fetch profile data
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', userData?.id],
    enabled: !!userData?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("company_name, total_points")
        .eq("user_id", userData?.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
  });

  // Fetch points data
  const { data: userPoints, isLoading: isPointsLoading } = useQuery({
    queryKey: ['points', userData?.id],
    enabled: !!userData?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_points")
        .select("points, ads_watched")
        .eq("user_id", userData?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserPoints;
    },
  });

  // Fetch saved tenders
  const { data: savedTenders = [], isLoading: isTendersLoading } = useQuery({
    queryKey: ['saved-tenders', userData?.id],
    enabled: !!userData?.id,
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
        .eq("supplier_id", userData?.id);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.tenders.id,
        title: item.tenders.title,
        deadline: new Date(item.tenders.deadline).toLocaleDateString(),
      }));
    },
  });

  const handleVideoWatched = async () => {
    if (!userData?.id) return;

    try {
      setIsWatchingVideo(true);
      
      // Simulate video watching with a delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      const { error } = await supabase.rpc("update_user_points", {
        user_id: userData.id,
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

  if (isUserLoading || isProfileLoading || isPointsLoading || isTendersLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!userData || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Please sign in to view your dashboard</h2>
            <Button onClick={() => navigate("/auth")} className="mt-4">
              Sign In
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <TenderNotification />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile.company_name}!
            </h1>
            <p className="mt-2 text-gray-600">
              You have {userPoints?.points || 0} points
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Points Card */}
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

            {/* Notification Preferences */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Notifications</h2>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/preferences")}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Manage Alert Preferences
                </Button>
              </div>
            </Card>

            {/* Saved Tenders */}
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;