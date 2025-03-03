
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Share } from "lucide-react";
import { ShareAction } from "@/types/tenderCard";

interface ShareSheetProps {
  title: string;
  deadline: string;
  category: string;
  location?: string;
  id: number;
  language: 'en' | 'sw';
  shareActions?: ShareAction[];
  translations: {
    shareTitle: string;
    shareDesc: string;
    email: string;
    whatsapp: string;
    sendEmail: string;
    shareWhatsapp: string;
    close: string;
    yourEmail: string;
    emailSent: string;
    emailError: string;
    moreOptions: string;
  };
}

export const ShareSheet = ({
  title,
  deadline,
  category,
  location,
  id,
  language,
  shareActions = [],
  translations: t
}: ShareSheetProps) => {
  const { toast } = useToast();
  const [shareEmail, setShareEmail] = useState("");

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

          {shareActions.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <h3 className="text-sm font-medium">{t.moreOptions}</h3>
              <div className="flex flex-col space-y-2">
                {shareActions.map((action, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="justify-start"
                    onClick={action.onClick}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">{t.close}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
