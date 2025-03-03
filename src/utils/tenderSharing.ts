
import { Tender } from "@/types/tender";
import { useToast } from "@/hooks/use-toast";

export const useTenderSharing = () => {
  const { toast } = useToast();

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

  return {
    handleShareByEmail,
    handleShareByWhatsApp
  };
};
