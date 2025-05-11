
import React from "react";
import { Tender } from "@/types/tender";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Tag, ExternalLink, Bookmark, Share2, AlertCircle } from "lucide-react";
import { getTenderStatus } from "@/types/tender";

interface TenderListProps {
  tenders: Tender[];
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  onBookmark?: (id: number) => void;
  onViewDetails?: (id: number) => void;
  userId?: string;
  onShare?: (tender: Tender) => void;
}

const TenderList = ({ 
  tenders, 
  isLoading, 
  error, 
  onRetry,
  onBookmark,
  onViewDetails,
  userId,
  onShare
}: TenderListProps) => {
  
  // Helper to format date nicely
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Helper to get status colors
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closing_soon': return 'bg-amber-100 text-amber-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="w-full bg-gray-50 animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-red-800">
            <AlertCircle className="h-5 w-5 mr-2" />
            Error Loading Tenders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">{error.message}</p>
        </CardContent>
        <CardFooter>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  if (tenders.length === 0) {
    return (
      <Card className="w-full border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-800">No Tenders Available</CardTitle>
          <CardDescription className="text-amber-700">
            There are currently no tenders to display.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700">
            Try refreshing or importing tender data from available sources.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tenders.map(tender => {
        const status = getTenderStatus(tender.deadline);
        const statusClassName = getStatusColor(status);

        return (
          <Card key={tender.id} className="w-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-gray-800">{tender.title}</CardTitle>
                <Badge className={statusClassName}>
                  {status === 'open' ? 'Open' : status === 'closing_soon' ? 'Closing Soon' : 'Closed'}
                </Badge>
              </div>
              {tender.procuring_entity && (
                <CardDescription className="text-sm font-medium text-gray-600">
                  {tender.procuring_entity}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="pb-2">
              <div className="text-sm text-gray-600 line-clamp-2 mb-3">
                {tender.description || "No description provided"}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  <span>Deadline: {formatDate(tender.deadline)}</span>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>{tender.location}</span>
                </div>
                
                <div className="flex items-center">
                  <Tag className="h-3.5 w-3.5 mr-1" />
                  <span>{tender.category}</span>
                </div>
                
                {tender.points_required !== undefined && tender.points_required > 0 && (
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span>{tender.points_required} points required</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex gap-2">
              {onViewDetails && (
                <Button 
                  onClick={() => onViewDetails(tender.id)} 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                >
                  View Details
                </Button>
              )}
              
              {onBookmark && (
                <Button 
                  onClick={() => onBookmark(tender.id)} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center"
                >
                  <Bookmark className="h-4 w-4 mr-1" />
                  Save
                </Button>
              )}
              
              {tender.tender_url && (
                <Button
                  onClick={() => window.open(tender.tender_url, '_blank', 'noopener,noreferrer')}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Source
                </Button>
              )}
              
              {onShare && (
                <Button 
                  onClick={() => onShare(tender)} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

// Export both default and named export to support both import styles
export default TenderList;
export { TenderList };
