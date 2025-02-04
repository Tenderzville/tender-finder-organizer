import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { TenderNotification } from "@/components/notifications/TenderNotification";
import { UserProfileCard } from "@/components/dashboard/UserProfile";
import { PointsCard } from "@/components/dashboard/PointsCard";
import { NotificationPreferencesCard } from "@/components/dashboard/NotificationPreferences";
import { SavedTendersCard } from "@/components/dashboard/SavedTenders";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) {
        navigate("/auth");
        return null;
      }
      return user;
    },
  });

  // Check if tenders exist
  const { data: tendersExist } = useQuery({
    queryKey: ['tenders-exist'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count && count > 0;
    },
    enabled: !!userData,
  });

  if (isLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load dashboard. Please try again later.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  if (!userData) {
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
          {!tendersExist && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Tenders Available</AlertTitle>
              <AlertDescription>
                We're currently gathering tender data. Please check back soon.
              </AlertDescription>
            </Alert>
          )}
          
          <UserProfileCard userId={userData.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <PointsCard userId={userData.id} />
            <NotificationPreferencesCard />
            <SavedTendersCard userId={userData.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;