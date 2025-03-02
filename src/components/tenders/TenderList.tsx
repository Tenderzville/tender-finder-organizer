
import { useState } from "react";
import { TenderCard } from "@/components/TenderCard";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Mail, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
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
    shareTitle: "Share Tender",
    shareDesc: "Share this tender with others",
    email: "Email",
    whatsapp: "WhatsApp",
    sendEmail: "Send Email",
    shareWhatsapp: "Share via WhatsApp",
    close: "Close",
    yourEmail: "Your Email",
    languageToggle: "Kiswahili",
    emailSent: "Email sent successfully",
    emailError: "Failed to send email",
    affirmativeAction: "Special Categories"
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
    shareTitle: "Shiriki Zabuni",
    shareDesc: "Shiriki zabuni hii na wengine",
    email: "Barua pepe",
    whatsapp: "WhatsApp",
    sendEmail: "Tuma Barua pepe",
    shareWhatsapp: "Shiriki kupitia WhatsApp",
    close: "Funga",
    yourEmail: "Barua pepe yako",
    languageToggle: "English",
    emailSent: "Barua pepe imetumwa",
    emailError: "Imeshindwa kutuma barua pepe",
    affirmativeAction: "Vikundi Maalum"
  }
};

export const TenderList = ({ tenders, isLoading = false, onRetry, error }: TenderListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const t = translations[language];
  const [shareEmail, setShareEmail] = useState("");
  
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
  
  const handleEmailShare = (tender: Tender) => {
    if (!shareEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }
    
    const subject = encodeURIComponent(`Tender Opportunity: ${tender.title}`);
    const body = encodeURIComponent(`Check out this tender opportunity:\n\nTitle: ${tender.title}\nDeadline: ${tender.deadline}\nCategory: ${tender.category}\nLocation: ${tender.location}\n\nView more details at: ${window.location.origin}/tenders/${tender.id}`);
    
    // Open default email client
    window.open(`mailto:${shareEmail}?subject=${subject}&body=${body}`, '_blank');
    
    toast({
      title: t.emailSent,
      description: `Email client opened for sharing tender to ${shareEmail}`,
    });
    setShareEmail("");
  };
  
  const handleWhatsAppShare = (tender: Tender) => {
    const text = encodeURIComponent(`Check out this tender opportunity:\n\nTitle: ${tender.title}\nDeadline: ${tender.deadline}\nCategory: ${tender.category}\nLocation: ${tender.location}\n\nView more details at: ${window.location.origin}/tenders/${tender.id}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
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
  const youthWomenTenders = tenders.filter(tender => 
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
      
      {youthWomenTenders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-green-700">{t.affirmativeAction}</h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
            {youthWomenTenders.map((tender) => (
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
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
        {tenders.map((tender) => (
          <div key={tender.id} className="relative">
            <TenderCard
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
            />
            <div className="absolute top-2 right-2 z-10">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm hover:bg-gray-100">
                    <Share className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{t.shareTitle}</SheetTitle>
                    <SheetDescription>
                      {t.shareDesc}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">{t.email}</h3>
                      <div className="flex space-x-2">
                        <Input 
                          placeholder={t.yourEmail} 
                          value={shareEmail} 
                          onChange={(e) => setShareEmail(e.target.value)}
                        />
                        <Button onClick={() => handleEmailShare(tender)}>
                          <Mail className="h-4 w-4 mr-2" />
                          {t.sendEmail}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">{t.whatsapp}</h3>
                      <Button onClick={() => handleWhatsAppShare(tender)} className="bg-green-600 hover:bg-green-700">
                        {t.shareWhatsapp}
                      </Button>
                    </div>
                  </div>
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button variant="outline">{t.close}</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
