
import { TenderList } from '@/components/tenders/TenderList';
import { CountyTenders } from '@/components/tenders/CountyTenders';
import { TenderMatcher } from '@/components/ai/TenderMatcher';
import { Tender } from "@/types/tender";
import { DebugButton } from "./DebugButton";
import { ScraperStatus } from "@/components/dashboard/ScraperStatus";
import { ScraperDebugInfo } from "@/components/dashboard/ScraperDebugInfo";

interface DashboardTenderSectionProps {
  tenders: Tender[];
  isLoadingTenders: boolean;
  errorTenders: Error | null;
  fetchTenders: () => Promise<void>;
  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
  handleViewTenderDetails: (id: number) => void;
  handleBookmarkTender: (id: number) => void;
  navigate: (path: string) => void;
  language: 'en' | 'sw';
  userData: any;
}

export const DashboardTenderSection = ({
  tenders,
  isLoadingTenders,
  errorTenders,
  fetchTenders,
  showDebugInfo,
  setShowDebugInfo,
  handleViewTenderDetails,
  handleBookmarkTender,
  navigate,
  language,
  userData
}: DashboardTenderSectionProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
      <div className="lg:col-span-3">
        <TenderList 
          tenders={tenders}
          isLoading={isLoadingTenders}
          error={errorTenders}
          onRetry={fetchTenders}
          onBookmark={handleBookmarkTender}
          onViewDetails={handleViewTenderDetails}
          userId={userData?.id}
        />
        <DebugButton 
          showDebugInfo={showDebugInfo} 
          setShowDebugInfo={setShowDebugInfo}
          tenderCount={tenders.length}
        />
      </div>
      <div className="lg:col-span-1">
        <ScraperStatus />
        {showDebugInfo && <ScraperDebugInfo />}
      </div>

      {!isLoadingTenders && !errorTenders && tenders.length > 0 && (
        <>
          <div className="mt-8 lg:col-span-4">
            <CountyTenders
              tenders={tenders}
              onViewDetails={handleViewTenderDetails}
              language={language}
              shareActions={[
                {
                  label: "Bookmark",
                  action: handleBookmarkTender
                }
              ]}
            />
          </div>

          <div className="mt-8 lg:col-span-4">
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
        </>
      )}
    </div>
  );
};
