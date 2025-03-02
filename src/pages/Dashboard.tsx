
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
import { TenderFeed } from "@/components/dashboard/TenderFeed";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized } = useAuthState();
  const [sessionChecked, setSessionChecked] = useState(false);

  console.log("Dashboard rendering - Auth state:", { isAuthenticated, isInitialized });

  // Fixed session check to prevent race conditions
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      console.log("Performing explicit session check");
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          if (isMounted) {
            toast({
              title: "Authentication Error",
              description: "There was a problem verifying your session. Please sign in again.",
              variant: "destructive",
            });
            navigate("/auth");
          }
          return;
        }
        
        if (!data.session) {
          console.log("No active session found in explicit check, redirecting to auth");
          if (isMounted) {
            navigate("/auth");
          }
          return;
        }
        
        console.log("Session verified for user:", data.session.user.id);
        if (isMounted) {
          setSessionChecked(true);
        }
      } catch (err) {
        console.error("Explicit session check failed:", err);
        if (isMounted) {
          navigate("/auth");
        }
      }
    };
    
    // Only check session if the auth state is initialized and showing as authenticated
    if (isInitialized) {
      if (!isAuthenticated) {
        console.log("User not authenticated, redirecting to auth");
        navigate("/auth");
      } else {
        // We're authenticated according to useAuthState, so do a single explicit check
        if (!sessionChecked) {
          checkSession();
        }
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isInitialized, navigate, toast, sessionChecked]);

  // User data query - only run when session is confirmed
  const { 
    data: userData, 
    isLoading: userLoading, 
    error: userError,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['dashboard-user'],
    queryFn: async () => {
      console.log("Fetching user data for dashboard...");
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Error fetching user:", error);
        throw error;
      }
      
      if (!user) {
        console.log("No user found in getUser call");
        throw new Error("User not found");
      }
      
      console.log("User data fetched successfully for dashboard:", user.id);
      return user;
    },
    enabled: sessionChecked, // Only run this query after session is confirmed
    retry: 1,
    staleTime: 60 * 1000, // 1 minute
  });

  // Tenders count query
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
        throw err;
      }
    },
    enabled: !!userData, // Only run this query after user data is loaded
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Trigger tender scraping manually - simplified to prevent blocking the UI
  const triggerTenderScrape = () => {
    toast({
      title: "Updating Tenders",
      description: "Fetching the latest tender data...",
    });
    
    supabase.functions.invoke('scrape-tenders')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error invoking scrape-tenders function:', error);
          toast({
            title: "Error",
            description: "Failed to update tenders. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        console.log('Tender scrape response:', data);
        
        if (data?.success === false) {
          toast({
            title: "Error",
            description: data.error || "Failed to update tenders. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Tenders Updated",
          description: `Found ${data?.tenders_scraped || 0} new tenders.`,
        });
        
        // Refetch the tenders count
        refetchTenders();
      })
      .catch(error => {
        console.error('Error in triggerTenderScrape:', error);
        toast({
          title: "Error",
          description: "Failed to update tenders. Network error or function timeout.",
          variant: "destructive",
        });
      });
  };

  // LOADING STATE - Clear indication of what's happening
  if (!isInitialized || (!sessionChecked && isAuthenticated) || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-500">Loading your dashboard...</p>
            <p className="text-sm text-gray-400">
              {!isInitialized ? "Initializing..." : !sessionChecked ? "Verifying session..." : "Loading profile..."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ERROR STATE
  if (userError || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              {userError ? `Failed to load your profile: ${userError.message}` : "You need to be signed in to view this page."}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={() => navigate("/auth")} className="mx-2">
              Sign In
            </Button>
            {userError && (
              <Button variant="outline" onClick={() => refetchUser()} className="mx-2">
                Retry
              </Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // USER DATA MISSING STATE
  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-xl font-semibold">User Profile Not Found</h2>
            <p className="mt-2 text-gray-500">We couldn't find your user profile information.</p>
            <div className="mt-4 flex justify-center gap-4">
              <Button onClick={() => navigate("/auth")}>
                Sign In Again
              </Button>
              <Button variant="outline" onClick={() => refetchUser()}>
                Retry
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // SUCCESS STATE - RENDER DASHBOARD
  console.log("Rendering dashboard content with user:", userData.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <TenderNotification />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's an overview of your account.</p>
        </div>

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
            <AlertDescription className="flex justify-between items-center">
              <span>We're currently gathering tender data for you.</span>
              <Button 
                size="sm" 
                onClick={triggerTenderScrape} 
                variant="outline" 
                className="ml-2 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Update Now
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <UserProfileCard userId={userData.id} />
        
        {/* Add TenderFeed as the first card for admin users */}
        <div className="mt-6 mb-6">
          <TenderFeed />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <PointsCard userId={userData.id} />
          <NotificationPreferencesCard />
          <SavedTendersCard userId={userData.id} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
