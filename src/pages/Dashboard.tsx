import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Award, Wifi, WifiOff, Calendar, BookOpen, Users, Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";
import { useToast } from "@/hooks/use-toast";
import { TenderFeed } from "@/components/tenders/TenderFeed";
import { SupplierCollaborationHub } from "@/components/collaboration/SupplierCollaborationHub";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TenderList } from '@/components/tenders/TenderList';
import { CountyTenders } from '@/components/tenders/CountyTenders';
import { TenderMatcher } from '@/components/ai/TenderMatcher';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { usePoints } from '@/hooks/use-points';
import { useNavigate } from "react-router-dom";


const Dashboard = () => {
  const { toast } = useToast();
  const { isAuthenticated, isInitialized } = useAuthState();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const { isOnline, offlineData, syncData } = useOfflineMode();
  const { points } = usePoints({ userId: userData?.id || null });
  const navigate = useNavigate();

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

  // Placeholder for language,  needs to be properly implemented
  const language = 'en'; 
  const toggleLanguage = () => {}; 
  const fetchTenders = () => {}; 


  // Main dashboard content
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's an overview of your account.</p>
        </div>

        {/* Online/Offline indicator */}
        {!isOnline && (
          <div className="offline-indicator">
            <WifiOff className="h-4 w-4" />
            <span>{language === 'en' ? "You're offline" : "Uko nje ya mtandao"}</span>
          </div>
        )}

        {/* Points indicator */}
        <div className="flex justify-end mb-4">
          <div className="points-indicator">
            <Award className="h-4 w-4 text-green-600" />
            <span>{points} {language === 'en' ? "Points" : "Pointi"}</span>
          </div>
        </div>

        {/* Quick links to new features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center py-6"
            onClick={() => navigate('/learning-hub')}
          >
            <BookOpen className="h-6 w-6 mb-2" />
            <span>{language === 'en' ? "Learning Hub" : "Kituo cha Kujifunza"}</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center py-6"
            onClick={() => {/* Calendar view */}}
          >
            <Calendar className="h-6 w-6 mb-2" />
            <span>{language === 'en' ? "Tender Calendar" : "Kalenda ya Zabuni"}</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center py-6"
            onClick={() => {/* Service provider directory */}}
          >
            <Users className="h-6 w-6 mb-2" />
            <span>{language === 'en' ? "Find Services" : "Tafuta Huduma"}</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center py-6"
            onClick={() => {/* Consortium building */}}
          >
            <Network className="h-6 w-6 mb-2" />
            <span>{language === 'en' ? "Build Consortium" : "Jenga Muungano"}</span>
          </Button>
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

        {/* Placeholder for tenders data */}
        const tenders = []; 
        const isLoadingTenders = false; 
        const errorTenders = null; 


        {/* Tender Feed (replace with actual implementation) */}
        <TenderList 
          tenders={tenders}
          isLoading={isLoadingTenders}
          error={errorTenders}
          onRetry={fetchTenders}
          language={language}
          toggleLanguage={toggleLanguage}
        />

        {/* County-specific tenders section */}
        {!isLoadingTenders && !errorTenders && tenders.length > 0 && (
          <div className="mt-8">
            <CountyTenders 
              tenders={tenders}
              onViewDetails={(id) => navigate(`/tenders/${id}`)}
              language={language}
              shareActions={{
                shareEmail: (id) => {/* Email sharing logic */},
                shareWhatsApp: (id) => {/* WhatsApp sharing logic */},
                shareLabels: {
                  email: language === 'en' ? "Email" : "Barua pepe",
                  whatsapp: language === 'en' ? "WhatsApp" : "WhatsApp"
                }
              }}
            />
          </div>
        )}

        {/* AI-powered tender matching */}
        {!isLoadingTenders && !errorTenders && tenders.length > 0 && (
          <div className="mt-8">
            <TenderMatcher 
              tenders={tenders}
              userProfile={userData?.profile || {}}
              language={language}
              userId={userData?.id || null}
              onViewDetails={(id) => navigate(`/tenders/${id}`)}
            />
          </div>
        )}

        {/* Supplier Collaboration Hub */}
        <SupplierCollaborationHub />

      </main>
    </div>
  );
};

export default Dashboard;