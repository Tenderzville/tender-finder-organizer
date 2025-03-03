
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface NotificationButtonProps {
  tenderId: number;
  tenderTitle: string;
}

export const NotificationButton = ({ tenderId, tenderTitle }: NotificationButtonProps) => {
  const { toast } = useToast();
  const [notifying, setNotifying] = useState(false);

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

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8"
      onClick={handleNotify}
      disabled={notifying}
    >
      <Bell className={`h-4 w-4 ${notifying ? 'animate-pulse' : ''}`} />
    </Button>
  );
};
