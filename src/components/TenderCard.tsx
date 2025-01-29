import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Globe, Briefcase, Bell } from "lucide-react";

interface TenderCardProps {
  title: string;
  organization: string;
  deadline: string;
  category: string;
  value: string;
  location?: string; // Make location optional to maintain compatibility
  onViewDetails: () => void;
}

// Helper function to format currency based on location
const formatCurrency = (value: string, location?: string): string => {
  // Remove any existing currency symbols from the value
  const numericValue = value.replace(/[^0-9.]/g, '');
  
  // Define currency formats for different locations
  const currencyFormats: { [key: string]: { symbol: string, position: 'before' | 'after' } } = {
    'Kenya': { symbol: 'KSh', position: 'before' },
    'USA': { symbol: '$', position: 'before' },
    'UK': { symbol: '£', position: 'before' },
    'EU': { symbol: '€', position: 'before' },
    // Add more currencies as needed
  };

  // Default to USD if location is not specified or not found
  const format = location && currencyFormats[location] 
    ? currencyFormats[location] 
    : { symbol: '$', position: 'before' };

  return format.position === 'before' 
    ? `${format.symbol}${numericValue}`
    : `${numericValue}${format.symbol}`;
};

export const TenderCard = ({
  title,
  organization,
  deadline,
  category,
  value,
  location,
  onViewDetails,
}: TenderCardProps) => {
  const formattedValue = formatCurrency(value, location);

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="mb-2">
            {category}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
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
        <Badge variant="outline" className="w-full justify-center">
          Value: {formattedValue}
        </Badge>
      </CardContent>
      <CardFooter>
        <Button onClick={onViewDetails} className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};