
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-client";
import type { Tender } from "@/types/tender";
import { TenderListLoading } from "@/components/tenders/TenderListLoading";
import { TenderListError } from "@/components/tenders/TenderListError";
import { TenderListEmpty } from "@/components/tenders/TenderListEmpty";
import { AffirmativeActionTenders } from "@/components/tenders/AffirmativeActionTenders";
import { RegularTenders } from "@/components/tenders/RegularTenders";
import { LanguageToggle } from "@/components/tenders/LanguageToggle";
import { tenderListTranslations } from "@/utils/tenderListTranslations";
import { useTenderSharing } from "@/utils/tenderSharing";

interface TenderListProps {
  tenders: Tender[];
  isLoading?: boolean;
  onRetry?: () => void;
  onBookmark?: (tenderId: number) => void;
  onViewDetails?: (tenderId: number) => void;
  error?: Error | null;
  userId?: string;
}

export const TenderList = ({ 
  tenders, 
  isLoading = false, 
  onRetry, 
  onBookmark,
  onViewDetails,
  error,
  userId 
}: TenderListProps) => {
  const { toast } = useToast();
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [bookmarkedTenders, setBookmarkedTenders] = useState<number[]>([]);
  const t = tenderListTranslations[language];
  const { handleShareByEmail, handleShareByWhatsApp } = useTenderSharing();
  
  const handleViewDetails = (tenderId: number) => {
    if (onViewDetails) {
      onViewDetails(tenderId);
    } else {
      toast({
        title: "Opening tender details",
        description: "Loading complete tender information...",
      });
    }
  };
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'sw' : 'en');
  };
  
  // Fetch bookmarked tenders on component mount
  useEffect(() => {
    const fetchBookmarkedTenders = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from("supplier_tender")
          .select("tender_id")
          .eq("supplier_id", userId);
          
        if (error) {
          console.error("Error fetching bookmarked tenders:", error);
          return;
        }
        
        setBookmarkedTenders(data.map(item => item.tender_id));
      } catch (err) {
        console.error("Unexpected error fetching bookmarks:", err);
      }
    };
    
    fetchBookmarkedTenders();
  }, [userId]);

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
    whatsapp: t.shareWhatsApp,
    bookmark: "Bookmark"
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
        onBookmark={onBookmark}
        bookmarkedTenders={bookmarkedTenders}
        shareLabels={shareLabels}
      />
      
      <RegularTenders 
        tenders={tenders}
        onViewDetails={handleViewDetails}
        language={language}
        shareEmail={handleShareByEmail}
        shareWhatsApp={handleShareByWhatsApp}
        onBookmark={onBookmark}
        bookmarkedTenders={bookmarkedTenders}
        shareLabels={shareLabels}
      />
    </div>
  );
};
