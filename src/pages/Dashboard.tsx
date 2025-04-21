
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";
import { useToast } from "@/hooks/use-toast";
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { usePoints } from '@/hooks/use-points';
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { QuickActionButtons } from "@/components/dashboard/QuickActionButtons";
import { OfflineIndicator } from "@/components/dashboard/OfflineIndicator";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useDashboardTenders } from "@/hooks/use-dashboard-tenders";
import { useTenderSharingActions } from "@/components/dashboard/TenderSharingActions";
import { useDashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { DashboardTenderSection } from "@/components/dashboard/DashboardTenderSection";
import { DashboardCollaboration } from "@/components/dashboard/DashboardCollaboration";

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
    
    const timer = setTimeout(() => {
      if (tenders.length === 0) {
        setShowDebugInfo(true);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, isInitialized, toast, tenders.length]);

  if (isLoading || !isInitialized) {
    return <DashboardLoading />;
  }

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

        <DashboardTenderSection 
          tenders={tenders}
          isLoadingTenders={isLoadingTenders}
          errorTenders={errorTenders}
          fetchTenders={fetchTenders}
          showDebugInfo={showDebugInfo}
          setShowDebugInfo={setShowDebugInfo}
          handleViewTenderDetails={handleViewTenderDetails}
          handleShareViaEmail={handleShareViaEmail}
          handleShareViaWhatsApp={handleShareViaWhatsApp}
          navigate={navigate}
          language={language}
          userData={userData}
        />

        <DashboardCollaboration />
      </main>
    </div>
  );
};

export default Dashboard;
