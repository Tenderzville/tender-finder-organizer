
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Globe, Briefcase, Bell, ExternalLink, Share } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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

interface TenderCardProps {
  id: number;
  title: string;
  organization: string;
  deadline: string;
  category: string;
  value: string;
  location?: string;
  pointsRequired?: number;
  tender_url?: string | null;
  onViewDetails: () => void;
  hasAffirmativeAction?: boolean;
  affirmativeActionType?: 'youth' | 'women' | 'pwds' | 'none';
  language?: 'en' | 'sw';
}

const formatCurrency = (value: string, location?: string): string => {
  if (!value || value === "Contact for pricing") return value;
  
  const numericValue = value.replace(/[^0-9.]/g, '');
  if (!numericValue) return value;
  
  const currencyFormats: { [key: string]: { symbol: string, position: 'before' | 'after' } } = {
    'Kenya': { symbol: 'KSh', position: 'before' },
    'USA': { symbol: '$', position: 'before' },
    'UK': { symbol: '£', position: 'before' },
    'EU': { symbol: '€', position: 'before' },
  };

  const format = location && currencyFormats[location] 
    ? currencyFormats[location] 
    : { symbol: '$', position: 'before' };

  return format.position === 'before' 
    ? `${format.symbol}${numericValue}`
    : `${numericValue}${format.symbol}`;
};

// Translation data
const translations = {
  en: {
    viewDetails: "View Details",
    shareTitle: "Share Tender",
    shareDesc: "Share this tender with others",
    email: "Email",
    whatsapp: "WhatsApp",
    sendEmail: "Send Email",
    shareWhatsapp: "Share via WhatsApp",
    close: "Close",
    yourEmail: "Your Email",
    emailSent: "Email sent successfully",
    emailError: "Failed to send email",
    deadline: "Deadline",
    value: "Value",
    requiredPoints: "Required Points",
    youth: "Youth Opportunity",
    women: "Women Opportunity", 
    pwds: "PWDs Opportunity",
    special: "Special Category"
  },
  sw: {
    viewDetails: "Angalia Maelezo",
    shareTitle: "Shiriki Zabuni",
    shareDesc: "Shiriki zabuni hii na wengine",
    email: "Barua pepe",
    whatsapp: "WhatsApp",
    sendEmail: "Tuma Barua pepe",
    shareWhatsapp: "Shiriki kupitia WhatsApp",
    close: "Funga",
    yourEmail: "Barua pepe yako",
    emailSent: "Barua pepe imetumwa",
    emailError: "Imeshindwa kutuma barua pepe",
    deadline: "Tarehe ya mwisho",
    value: "Thamani",
    requiredPoints: "Pointi Zinazohitajika",
    youth: "Nafasi ya Vijana",
    women: "Nafasi ya Wanawake", 
    pwds: "Nafasi ya Walemavu",
    special: "Kikundi Maalum"
  }
};

export const TenderCard = ({
  id,
  title,
  organization,
  deadline,
  category,
  value,
  location,
  pointsRequired = 0,
  tender_url,
  onViewDetails,
  hasAffirmativeAction = false,
  affirmativeActionType = 'none',
  language = 'en',
}: TenderCardProps) => {
  const { toast } = useToast();
  const [notifying, setNotifying] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const formattedValue = formatCurrency(value, location);
  const t = translations[language];

  const handleNotify = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifying(true);
    
    // Simulating notification setting
    setTimeout(() => {
      setNotifying(false);
      toast({
        title: "Notification Set",
        description: `You'll be notified about updates to this tender.`,
      });
    }, 1000);
  };

  const openExternalUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tender_url) {
      // If URL doesn't start with http, add it
      const url = tender_url.startsWith('http') ? tender_url : `https://${tender_url}`;
      window.open(url, '_blank');
      toast({
        title: "Opening External Link",
        description: "Opening the original tender page in a new tab.",
      });
    }
  };

  const handleEmailShare = () => {
    if (!shareEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }
    
    const subject = encodeURIComponent(`Tender Opportunity: ${title}`);
    const body = encodeURIComponent(`Check out this tender opportunity:\n\nTitle: ${title}\nDeadline: ${deadline}\nCategory: ${category}\nLocation: ${location || 'International'}\n\nView more details at: ${window.location.origin}/tenders/${id}`);
    
    // Open default email client
    window.open(`mailto:${shareEmail}?subject=${subject}&body=${body}`, '_blank');
    
    toast({
      title: t.emailSent,
      description: `Email client opened for sharing tender to ${shareEmail}`,
    });
    setShareEmail("");
  };
  
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out this tender opportunity:\n\nTitle: ${title}\nDeadline: ${deadline}\nCategory: ${category}\nLocation: ${location || 'International'}\n\nView more details at: ${window.location.origin}/tenders/${id}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="mb-2">
            {category}
          </Badge>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleNotify}
              disabled={notifying}
            >
              <Bell className={`h-4 w-4 ${notifying ? 'animate-pulse' : ''}`} />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      <Button onClick={handleEmailShare}>
                        {t.sendEmail}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">{t.whatsapp}</h3>
                    <Button onClick={handleWhatsAppShare} className="bg-green-600 hover:bg-green-700">
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
        <CardTitle className="text-lg font-semibold line-clamp-2">{title}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <Briefcase className="mr-2 h-4 w-4" />
          {organization}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAffirmativeAction && (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 w-full justify-center">
            {affirmativeActionType === 'youth' ? t.youth : 
              affirmativeActionType === 'women' ? t.women : 
              affirmativeActionType === 'pwds' ? t.pwds : t.special}
          </Badge>
        )}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{t.deadline}: {deadline}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Globe className="mr-2 h-4 w-4" />
            <span>{location || 'International'}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="w-full justify-center">
            {t.value}: {formattedValue}
          </Badge>
          {pointsRequired > 0 && (
            <Badge variant="secondary" className="w-full justify-center">
              {t.requiredPoints}: {pointsRequired}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={onViewDetails} className="flex-1">
          {t.viewDetails}
        </Button>
        {tender_url && (
          <Button variant="outline" size="icon" onClick={openExternalUrl}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
