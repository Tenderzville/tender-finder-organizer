
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, User, RefreshCw } from "lucide-react";
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
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  // Immediately check session before any other operations
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Initial session check...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session check error:", sessionError);
          toast({
            title: "Authentication Error",
            description: "There was a problem verifying your session. Please sign in again.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }
        
        if (!session) {
          console.log("No active session found, redirecting to auth");
          toast({
            title: "Authentication Required",
            description: "Please sign in to access the dashboard",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }
        
        console.log("Valid session found for user:", session.user.id);
        setIsSessionChecked(true);
      } catch (error) {
        console.error("Failed to check session:", error);
        toast({
          title: "Authentication Error",
          description: "There was a problem checking your session. Please try again.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    checkSession();
  }, [navigate, toast]);

  // Only proceed with user data query if session is valid
  const { 
    data: userData, 
    isLoading: userLoading, 
    error: userError, 
    refetch: refetchUser 
  } = useQuery({
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
    enabled: isSessionChecked, // Only run query if session is valid
    retry: 3,
    retryDelay: 1000,
  });

  // Check available tenders
  const { 
    data: tendersCount, 
    error: tendersError, 
    isLoading: tendersLoading,
    refetch: refetchTenders
  } = useQuery({
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
    enabled: !!userData, // Only run query if user data is available
    retry: 2,
  });

  // Handle session changes
  useEffect(() => {
    if (!isSessionChecked) return; // Skip if initial session check not completed
    
    console.log("Setting up auth state change listener");
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        if (event === "SIGNED_OUT") {
          queryClient.clear();
          navigate("/auth");
        } else if (event === "SIGNED_IN" && session) {
          refetchUser();
        }
      }
    );

    return () => {
      console.log("Cleaning up auth listener");
      authListener.subscription.unsubscribe();
    };
  }, [navigate, refetchUser, queryClient, isSessionChecked]);

  // Trigger tender scraping if no tenders are found
  const triggerTenderScrape = async () => {
    try {
      toast({
        title: "Updating Tenders",
        description: "Fetching the latest tender data...",
      });
      
      const { data, error } = await supabase.functions.invoke('scrape-tenders');
      
      if (error) {
        console.error('Error triggering tender scrape:', error);
        toast({
          title: "Error",
          description: "Failed to update tenders. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log('Tender scrape response:', data);
        toast({
          title: "Tenders Updated",
          description: `Found ${data.tenders_scraped || 0} new tenders.`,
        });
        refetchTenders();
      }
    } catch (error) {
      console.error('Error triggering tender scrape:', error);
      toast({
        title: "Error",
        description: "Failed to update tenders. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (!isSessionChecked || userLoading) {
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

  // Show error state
  if (userError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load your profile. {userError.message || "Please try again later."}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetchUser()} className="mx-auto block">
            Retry
          </Button>
        </main>
      </div>
    );
  }

  // Show not authenticated state
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
              <AlertDescription className="flex items-center justify-between">
                <span>We're currently gathering tender data. Please check back soon.</span>
                <Button size="sm" onClick={triggerTenderScrape} variant="outline" className="ml-2 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Update Now
                </Button>
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
