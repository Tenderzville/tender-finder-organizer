
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";
import { useToast } from "@/hooks/use-toast";
import { TenderFeed } from "@/components/tenders/TenderFeed";
import { SupplierCollaborationHub } from "@/components/collaboration/SupplierCollaborationHub";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Dashboard = () => {
  const { toast } = useToast();
  const { isAuthenticated, isInitialized } = useAuthState();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log("Loading user data...");
        setIsLoading(true);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error fetching user:", error);
          toast({
            title: "Error",
            description: "Failed to load user data. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        if (user) {
          console.log("User data loaded successfully:", user.id);
          setUserData(user);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated && isInitialized) {
      loadUserData();
    } else if (isInitialized) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isInitialized, toast]);

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-500">Loading your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Alert className="mb-6">
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please sign in to view your dashboard.
            </AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={() => window.location.href = "/auth"}>
              Sign In
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Main dashboard content
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's an overview of your account.</p>
        </div>

        {/* User Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">{userData?.email || 'User'}</p>
                <p className="text-sm text-muted-foreground">User ID: {userData?.id || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Supplier Collaboration Hub */}
        <SupplierCollaborationHub />
        
        {/* Tender Feed */}
        <div className="mb-6">
          <TenderFeed />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
