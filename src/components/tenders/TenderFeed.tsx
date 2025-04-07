
import React, { useMemo } from "react";
import { useTenderFeed } from "@/hooks/use-tender-feed";
import { TenderFeedLoading } from "@/components/tenders/TenderFeedLoading";
import { TenderQualificationView } from "@/components/tenders/TenderQualificationView";
import { TenderListView } from "@/components/tenders/TenderListView";
import { tenderFeedTranslations } from "@/utils/tenderFeedTranslations";

export const TenderFeed = () => {
  const {
    tendersToDisplay,
    isLoading,
    error,
    isRefreshing,
    language,
    showQualificationTool,
    setShowQualificationTool,
    refreshTenderFeed
  } = useTenderFeed();

  const translations = useMemo(() => 
    tenderFeedTranslations[language], 
    [language]
  );

  if (isLoading) {
    return <TenderFeedLoading />;
  }

  if (showQualificationTool && tendersToDisplay.length > 0) {
    return (
      <TenderQualificationView 
        onBack={() => setShowQualificationTool(false)}
        tender={tendersToDisplay.length > 0 ? tendersToDisplay[0] : undefined}
        language={language}
      />
    );
  }

  return (
    <TenderListView 
      tendersToDisplay={tendersToDisplay}
      error={error}
      isRefreshing={isRefreshing}
      onRefresh={refreshTenderFeed}
      onShowQualificationTool={() => setShowQualificationTool(true)}
      translations={translations}
      language={language}
    />
  );
};
