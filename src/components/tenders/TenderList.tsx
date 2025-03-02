
import { useState } from "react";
import { TenderCard } from "@/components/TenderCard";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Tender } from "@/types/tender";

interface TenderListProps {
  tenders: Tender[];
  isLoading?: boolean;
  onRetry?: () => void;
  error?: Error | null;
}

// Translation data
const translations = {
  en: {
    loading: "Loading tenders...",
    errorTitle: "Error loading tenders",
    errorDesc: "Unable to load tenders. Please try again later.",
    retry: "Retry",
    noTendersTitle: "No tenders found",
    noTendersDesc: "We're experiencing issues retrieving tenders. Please try again later.",
    retryLoading: "Retry Loading Tenders",
    viewDetails: "View Details",
    languageToggle: "Kiswahili",
    affirmativeAction: "Special Categories",
    shareTender: "Share",
    shareTenderDesc: "Share this tender opportunity",
    shareEmail: "Share via Email",
    shareWhatsApp: "Share via WhatsApp"
  },
  sw: {
    loading: "Inapakia zabuni...",
    errorTitle: "Hitilafu kupakia zabuni",
    errorDesc: "Imeshindwa kupakia zabuni. Tafadhali jaribu tena baadaye.",
    retry: "Jaribu tena",
    noTendersTitle: "Hakuna zabuni zilizopatikana",
    noTendersDesc: "Tunakumbwa na matatizo ya kupata zabuni. Tafadhali jaribu tena baadaye.",
    retryLoading: "Jaribu Kupakia Zabuni Tena",
    viewDetails: "Angalia Maelezo",
    languageToggle: "English",
    affirmativeAction: "Vikundi Maalum",
    shareTender: "Shiriki",
    shareTenderDesc: "Shiriki nafasi hii ya zabuni",
    shareEmail: "Shiriki kupitia Barua pepe",
    shareWhatsApp: "Shiriki kupitia WhatsApp"
  }
};

export const TenderList = ({ tenders, isLoading = false, onRetry, error }: TenderListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const t = translations[language];
  
  const handleViewDetails = (tenderId: number) => {
    navigate(`/tenders/${tenderId}`);
    toast({
      title: "Opening tender details",
      description: "Loading complete tender information...",
    });
  };
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'sw' : 'en');
  };

  const handleShareByEmail = (tender: Tender) => {
    // Encode tender information for email
    const subject = encodeURIComponent(`Tender Opportunity: ${tender.title}`);
    const body = encodeURIComponent(
      `Check out this tender opportunity:\n\n` +
      `Title: ${tender.title}\n` +
      `Category: ${tender.category}\n` +
      `Deadline: ${tender.deadline}\n` +
      `Location: ${tender.location}\n\n` +
      `View more details at: ${window.location.origin}/tenders/${tender.id}`
    );
    
    // Open email client
    window.open(`mailto:?subject=${subject}&body=${body}`);
    
    toast({
      title: "Email client opened",
      description: "Share this tender with others via email",
    });
  };

  const handleShareByWhatsApp = (tender: Tender) => {
    // Encode tender information for WhatsApp
    const text = encodeURIComponent(
      `*Tender Opportunity*\n\n` +
      `Title: ${tender.title}\n` +
      `Category: ${tender.category}\n` +
      `Deadline: ${tender.deadline}\n` +
      `Location: ${tender.location}\n\n` +
      `View more details at: ${window.location.origin}/tenders/${tender.id}`
    );
    
    // Open WhatsApp
    window.open(`https://wa.me/?text=${text}`);
    
    toast({
      title: "WhatsApp opened",
      description: "Share this tender with others via WhatsApp",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>{t.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t.errorTitle}</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>{error.message || t.errorDesc}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
            >
              {t.retry}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (tenders.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">{t.noTendersTitle}</h3>
        <p className="mt-2 text-sm text-gray-500">
          {t.noTendersDesc}
        </p>
        {onRetry && (
          <Button 
            className="mt-4"
            onClick={onRetry}
          >
            {t.retryLoading}
          </Button>
        )}
      </div>
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

  return (
    <div className="space-y-8">
      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="language-toggle" 
            checked={language === 'sw'}
            onCheckedChange={toggleLanguage}
          />
          <Label htmlFor="language-toggle">{t.languageToggle}</Label>
        </div>
      </div>
      
      {affirmativeActionTenders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-green-700">{t.affirmativeAction}</h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
            {affirmativeActionTenders.map((tender) => (
              <TenderCard
                key={`affirmative-${tender.id}`}
                id={tender.id}
                title={tender.title}
                organization={tender.category}
                deadline={tender.deadline}
                category={tender.category}
                value={tender.fees || "Contact for pricing"}
                location={tender.location}
                pointsRequired={tender.points_required || 0}
                tender_url={tender.tender_url}
                onViewDetails={() => handleViewDetails(tender.id)}
                hasAffirmativeAction={true}
                affirmativeActionType={tender.affirmative_action?.type || 'none'}
                language={language}
                shareActions={[
                  {
                    icon: <ArrowUpRight className="h-4 w-4" />,
                    label: t.shareEmail,
                    onClick: () => handleShareByEmail(tender)
                  },
                  {
                    icon: <ArrowUpRight className="h-4 w-4" />,
                    label: t.shareWhatsApp,
                    onClick: () => handleShareByWhatsApp(tender)
                  }
                ]}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
        {tenders.map((tender) => (
          <TenderCard
            key={tender.id}
            id={tender.id}
            title={tender.title}
            organization={tender.category}
            deadline={tender.deadline}
            category={tender.category}
            value={tender.fees || "Contact for pricing"}
            location={tender.location}
            pointsRequired={tender.points_required || 0}
            tender_url={tender.tender_url}
            onViewDetails={() => handleViewDetails(tender.id)}
            hasAffirmativeAction={tender.affirmative_action?.type !== undefined && tender.affirmative_action?.type !== 'none'}
            affirmativeActionType={tender.affirmative_action?.type || 'none'}
            language={language}
            shareActions={[
              {
                icon: <ArrowUpRight className="h-4 w-4" />,
                label: t.shareEmail,
                onClick: () => handleShareByEmail(tender)
              },
              {
                icon: <ArrowUpRight className="h-4 w-4" />,
                label: t.shareWhatsApp,
                onClick: () => handleShareByWhatsApp(tender)
              }
            ]}
          />
        ))}
      </div>
    </div>
  );
};
