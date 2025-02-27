
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Globe, Briefcase, Bell, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
}: TenderCardProps) => {
  const { toast } = useToast();
  const [notifying, setNotifying] = useState(false);
  const formattedValue = formatCurrency(value, location);

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

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="mb-2">
            {category}
          </Badge>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleNotify}
            disabled={notifying}
          >
            <Bell className={`h-4 w-4 ${notifying ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
        <CardTitle className="text-lg font-semibold line-clamp-2">{title}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <Briefcase className="mr-2 h-4 w-4" />
          {organization}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Deadline: {deadline}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Globe className="mr-2 h-4 w-4" />
            <span>{location || 'International'}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="w-full justify-center">
            Value: {formattedValue}
          </Badge>
          {pointsRequired > 0 && (
            <Badge variant="secondary" className="w-full justify-center">
              Required Points: {pointsRequired}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={onViewDetails} className="flex-1">
          View Details
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
