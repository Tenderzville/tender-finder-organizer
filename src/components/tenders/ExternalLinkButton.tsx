
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ExternalLinkButtonProps {
  url: string | null | undefined;
}

export const ExternalLinkButton = ({ url }: ExternalLinkButtonProps) => {
  const { toast } = useToast();
  
  const openExternalUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) {
      // If URL doesn't start with http, add it
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(fullUrl, '_blank');
      toast({
        title: "Opening External Link",
        description: "Opening the original tender page in a new tab.",
      });
    }
  };

  if (!url) return null;

  return (
    <Button variant="outline" size="icon" onClick={openExternalUrl}>
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
};
