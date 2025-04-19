
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";
import { useToast } from "@/hooks/use-toast";
import { TenderFeed } from "@/components/tenders/TenderFeed";
import { SupplierCollaborationHub } from "@/components/collaboration/SupplierCollaborationHub";
import { TenderList } from '@/components/tenders/TenderList';
import { CountyTenders } from '@/components/tenders/CountyTenders';
import { TenderMatcher } from '@/components/ai/TenderMatcher';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { usePoints } from '@/hooks/use-points';
import { Tender } from "@/types/tender";

// Import the newly created components
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { QuickActionButtons } from "@/components/dashboard/QuickActionButtons";
import { OfflineIndicator } from "@/components/dashboard/OfflineIndicator";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ScraperStatus } from "@/components/dashboard/ScraperStatus";
import { ScraperDebugInfo } from "@/components/dashboard/ScraperDebugInfo";
import { useDashboardTenders } from "@/hooks/use-dashboard-tenders";
import { useTenderSharingActions } from "@/components/dashboard/TenderSharingActions";
import { useDashboardNavigation } from "@/components/dashboard/DashboardNavigation";

const Dashboard = () => {
  const { toast } = useToast();
  const { isAuthenticated, isInitialized } = useAuthState();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const { isOnline, offlineData, syncData } = useOfflineMode();
  const { points } = usePoints({ userId: userData?.id || null });
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const { 
    tenders, 
    isLoadingTenders, 
    errorTenders, 
    fetchTenders 
  } = useDashboardTenders();
  
  const { handleShareViaEmail, handleShareViaWhatsApp } = useTenderSharingActions();
  const { handleViewTenderDetails, navigate } = useDashboardNavigation();

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'sw' : 'en');
  };

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
    
    // Show debug info if there are zero tenders after 3 seconds
    const timer = setTimeout(() => {
      if (tenders.length === 0) {
        setShowDebugInfo(true);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, isInitialized, toast, tenders.length]);

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

  // Show debug button after waiting for a while with no tenders
  const debugButton = tenders.length === 0 || showDebugInfo ? (
    <button 
      onClick={() => setShowDebugInfo(!showDebugInfo)}
      className="text-xs text-gray-500 hover:text-gray-700 mt-2 underline"
    >
      {showDebugInfo ? "Hide Diagnostics" : "Show Advanced Diagnostics"}
    </button>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <DashboardHeader 
          isLoading={isLoading} 
          language={language} 
          points={points} 
        />

        <OfflineIndicator isOnline={isOnline} language={language} />

        <QuickActionButtons language={language} />

        <ProfileCard userData={userData} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          <div className="lg:col-span-3">
            <TenderList 
              tenders={tenders}
              isLoading={isLoadingTenders}
              error={errorTenders}
              onRetry={fetchTenders}
            />
            {debugButton}
          </div>
          <div className="lg:col-span-1">
            <ScraperStatus />
            {showDebugInfo && <ScraperDebugInfo />}
          </div>
        </div>

        {!isLoadingTenders && !errorTenders && tenders.length > 0 && (
          <div className="mt-8">
            <CountyTenders
              tenders={tenders}
              onViewDetails={handleViewTenderDetails}
              language={language}
              shareActions={[
                {
                  label: "Share via Email",
                  action: (id) => handleShareViaEmail(id)
                },
                {
                  label: "Share via WhatsApp",
                  action: (id) => handleShareViaWhatsApp(id)
                }
              ]}
            />
          </div>
        )}

        {!isLoadingTenders && !errorTenders && tenders.length > 0 && (
          <div className="mt-8">
            <TenderMatcher 
              userProfile={{ 
                areas_of_expertise: ["IT & Telecommunications", "Construction"],
                industry: "Technology",
                location: "Nairobi"
              }}
              language={language}
              userId={userData?.id || null}
              onViewDetails={(id) => navigate(`/tenders/${id}`)}
            />
          </div>
        )}

        <div className="mt-8">
          <SupplierCollaborationHub />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
