import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Tender } from "@/types/tender";
import { TenderListLoading } from "@/components/tenders/TenderListLoading";
import { TenderListError } from "@/components/tenders/TenderListError";
import { TenderListEmpty } from "@/components/tenders/TenderListEmpty";
import { AffirmativeActionTenders } from "@/components/tenders/AffirmativeActionTenders";
import { RegularTenders } from "@/components/tenders/RegularTenders";
import { LanguageToggle } from "@/components/tenders/LanguageToggle";
import { BookmarkButton } from "@/components/BookmarkButton";
import { tenderListTranslations } from "@/utils/tenderListTranslations";
import { useTenderSharing } from "@/utils/tenderSharing";

interface TenderListProps {
  tenders: Tender[];
  isLoading?: boolean;
  onRetry?: () => void;
  error?: Error | null;
}

export const TenderList = ({ tenders, isLoading = false, onRetry, error }: TenderListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const t = tenderListTranslations[language];
  const { handleShareByEmail, handleShareByWhatsApp } = useTenderSharing();
  
  const handleViewDetails = (tenderId: number) => {
    navigate(`/tenders/${tenderId}`);
    toast({
      title: t.openingDetails,
      description: t.loadingComplete,
    });
  };
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'sw' : 'en');
  };

  // Loading state
  if (isLoading) {
    return <TenderListLoading loadingText={t.loading} />;
  }

  // Error state
  if (error) {
    return (
      <TenderListError 
        title={t.errorTitle}
        description={t.errorDesc}
        retryText={t.retry}
        onRetry={onRetry}
        error={error}
      />
    );
  }

  // Empty state
  if (tenders.length === 0) {
    return (
      <TenderListEmpty 
        title={t.noTendersTitle}
        description={t.noTendersDesc}
        retryText={t.retryLoading}
        onRetry={onRetry}
      />
    );
  }

  // Filter for affirmative action tenders
  const affirmativeActionTenders = tenders.filter(tender => 
    tender.affirmative_action?.type === 'youth' || 
    tender.affirmative_action?.type === 'women' ||
    tender.affirmative_action?.type === 'pwds' ||
    tender.title.toLowerCase().includes('youth') || 
    tender.title.toLowerCase().includes('women') ||
    tender.description?.toLowerCase().includes('youth') || 
    tender.description?.toLowerCase().includes('women') ||
    tender.category.toLowerCase().includes('agpo')
  );

  const shareLabels = {
    email: t.shareEmail,
    whatsapp: t.shareWhatsApp
  };

  return (
    <div className="space-y-8">
      <LanguageToggle 
        language={language}
        label={t.languageToggle}
        onToggle={toggleLanguage}
      />
      
      <AffirmativeActionTenders 
        tenders={affirmativeActionTenders}
        sectionTitle={t.affirmativeAction}
        onViewDetails={handleViewDetails}
        language={language}
        shareEmail={handleShareByEmail}
        shareWhatsApp={handleShareByWhatsApp}
        shareLabels={shareLabels}
      />
      
      <RegularTenders 
        tenders={tenders}
        onViewDetails={handleViewDetails}
        language={language}
        shareEmail={handleShareByEmail}
        shareWhatsApp={handleShareByWhatsApp}
        shareLabels={shareLabels}
      />
    </div>
  );
};
