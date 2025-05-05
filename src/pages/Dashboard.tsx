
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/lib/supabase-client";
import { useAuthState } from "@/hooks/useAuthState";
import { useToast } from "@/hooks/use-toast";
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { usePoints } from '@/hooks/use-points';
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { SavedTendersCard } from "@/components/dashboard/SavedTenders";
import { UserProfileCard } from "@/components/dashboard/UserProfile";
import { OfflineIndicator } from "@/components/dashboard/OfflineIndicator";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useDashboardTenders } from "@/hooks/use-dashboard-tenders";
import { useDashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { DashboardTenderSection } from "@/components/dashboard/DashboardTenderSection";

const Dashboard = () => {
  const { toast } = useToast();
  const { isAuthenticated, isInitialized } = useAuthState();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const { isOnline } = useOfflineMode();
  const { points } = usePoints({ userId: userData?.id || null });
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const { 
    tenders, 
    isLoadingTenders, 
    errorTenders, 
    fetchTenders 
  } = useDashboardTenders();
  
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

  // Enable bookmarking functionality for tenders
  const handleBookmarkTender = async (tenderId: number) => {
    try {
      if (!userData?.id) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to bookmark tenders",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("supplier_tender")
        .select("*")
        .eq("supplier_id", userData.id)
        .eq("tender_id", tenderId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        // Tender is already bookmarked, remove it
        const { error: deleteError } = await supabase
          .from("supplier_tender")
          .delete()
          .eq("supplier_id", userData.id)
          .eq("tender_id", tenderId);

        if (deleteError) {
          throw deleteError;
        }

        toast({
          title: "Tender Removed",
          description: "Tender has been removed from your bookmarks",
        });
      } else {
        // Tender is not bookmarked, add it
        const { error: insertError } = await supabase
          .from("supplier_tender")
          .insert([
            { supplier_id: userData.id, tender_id: tenderId }
          ]);

        if (insertError) {
          throw insertError;
        }

        toast({
          title: "Tender Bookmarked",
          description: "Tender has been added to your bookmarks",
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmarks. Please try again.",
        variant: "destructive",
      });
    }
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ProfileCard userData={userData} />
          </div>
          <div>
            {userData && <UserProfileCard userId={userData.id} />}
          </div>
        </div>

        {userData && (
          <div className="mb-8">
            <SavedTendersCard userId={userData.id} />
          </div>
        )}

        <DashboardTenderSection 
          tenders={tenders}
          isLoadingTenders={isLoadingTenders}
          errorTenders={errorTenders}
          fetchTenders={fetchTenders}
          showDebugInfo={showDebugInfo}
          setShowDebugInfo={setShowDebugInfo}
          handleViewTenderDetails={handleViewTenderDetails}
          handleBookmarkTender={handleBookmarkTender}
          navigate={navigate}
          language={language}
          userData={userData}
        />
      </main>
    </div>
  );
};

export default Dashboard;
