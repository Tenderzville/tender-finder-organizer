
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { TenderNotification } from "@/components/notifications/TenderNotification";
import { UserProfileCard } from "@/components/dashboard/UserProfile";
import { PointsCard } from "@/components/dashboard/PointsCard";
import { NotificationPreferencesCard } from "@/components/dashboard/NotificationPreferences";
import { SavedTendersCard } from "@/components/dashboard/SavedTenders";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userData, isLoading, error, refetch } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      console.log("Fetching user data...");
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        throw error;
      }
      if (!user) {
        console.log("No user found, redirecting to auth");
        navigate("/auth");
        return null;
      }
      console.log("User data fetched successfully:", user);
      return user;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Check available tenders
  const { data: tendersCount, error: tendersError, isLoading: tendersLoading } = useQuery({
    queryKey: ['tenders-count'],
    queryFn: async () => {
      console.log("Checking available tenders...");
      try {
        const { count, error } = await supabase
          .from('tenders')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error("Error checking tenders:", error);
          throw error;
        }
        console.log("Available tenders count:", count);
        return count || 0;
      } catch (err) {
        console.error("Failed to check tenders:", err);
        return 0;
      }
    },
    enabled: !!userData,
    retry: 2,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No session found, redirecting to auth");
          toast({
            title: "Authentication Required",
            description: "Please sign in to access the dashboard",
            variant: "destructive",
          });
          navigate("/auth");
        }
      } catch (error) {
        console.error("Session check error:", error);
        toast({
          title: "Authentication Error",
          description: "There was a problem checking your session. Please try again.",
          variant: "destructive",
        });
      }
    };

    checkAuth();
  }, [navigate, toast]);

  // Handle session changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        if (event === "SIGNED_OUT") {
          queryClient.clear();
          navigate("/auth");
        } else if (event === "SIGNED_IN" && session) {
          refetch();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, refetch, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-500">Loading your dashboard...</p>
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
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load dashboard. {error.message || "Please try again later."}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="mx-auto block">
            Retry
          </Button>
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
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-xl font-semibold">Please sign in to view your dashboard</h2>
            <Button onClick={() => navigate("/auth")} className="mt-4">
              Sign In
            </Button>
          </div>
        </main>
      </div>
    );
  }

  console.log("Rendering dashboard with user:", userData.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <TenderNotification />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {tendersError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Database Error</AlertTitle>
              <AlertDescription>
                Unable to check available tenders. Please refresh the page or contact support.
              </AlertDescription>
            </Alert>
          )}
          
          {!tendersLoading && tendersCount === 0 && (
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
