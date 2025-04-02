
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Tender } from "@/types/tender";

interface ShareAction {
  label: string;
  action: (id: string) => void;
}

interface CountyTendersProps {
  tenders: Tender[];
  onViewDetails: (id: string) => void;
  language: 'en' | 'sw';
  shareActions: ShareAction[];
}

export function CountyTenders({ tenders, onViewDetails, language, shareActions }: CountyTendersProps) {
  const translations = {
    en: {
      title: "County Tenders",
      description: "Explore tenders specific to your county",
      viewDetails: "View Details",
      share: "Share",
      deadline: "Deadline",
      location: "Location",
      category: "Category"
    },
    sw: {
      title: "Zabuni za Kaunti",
      description: "Gundua zabuni maalum kwa kaunti yako",
      viewDetails: "Angalia Maelezo",
      share: "Shiriki",
      deadline: "Mwisho wa Tarehe",
      location: "Mahali",
      category: "Kategoria"
    }
  };

  const t = translations[language];

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "PPP");
    } catch (err) {
      return "Unknown date";
    }
  };
  
  const handleViewDetails = (id: string) => {
    onViewDetails(id);
  };

  return (
    <div className="space-y-4">
      {tenders.map((tender) => (
        <Card key={tender.id} className="bg-muted p-4 rounded-md text-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{tender.title}</CardTitle>
            <CardDescription>
              {tender.description?.substring(0, 100) || "No description available"}...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                {tender.category || "Uncategorized"}
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {tender.location || "Not specified"}
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {t.deadline}: {tender.deadline ? formatDate(tender.deadline) : "Unknown"}
              </div>
              <div>
                {tender.fees && `Value: ${tender.fees}`}
                {!tender.fees && "Value: Contact for pricing"}
              </div>
            </div>
          </CardContent>
          <div className="flex justify-end space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleViewDetails(String(tender.id))}
            >
              {t.viewDetails}
            </Button>
            <div className="flex space-x-2">
              {Array.isArray(shareActions) && shareActions.map((action, index) => (
                <Button 
                  key={index} 
                  size="sm" 
                  variant="ghost"
                  onClick={() => action.action(String(tender.id))}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
