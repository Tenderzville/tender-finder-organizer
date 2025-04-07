
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { Calendar, MapPin, Tag, Users, Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Tender, getTenderStatus } from "@/types/tender";

interface ShareAction {
  label: string;
  action: (id: number) => void;
}

interface CountyTendersProps {
  tenders: Tender[];
  onViewDetails: (id: number) => void;
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
      category: "Category",
      affirmativeAction: "Affirmative Action",
      youth: "Youth",
      women: "Women",
      pwds: "Persons with Disabilities",
      procuringEntity: "Procuring Entity",
      noTenders: "No tenders available at the moment. Please check back later."
    },
    sw: {
      title: "Zabuni za Kaunti",
      description: "Gundua zabuni maalum kwa kaunti yako",
      viewDetails: "Angalia Maelezo",
      share: "Shiriki",
      deadline: "Mwisho wa Tarehe",
      location: "Mahali",
      category: "Kategoria",
      affirmativeAction: "Hatua za Kipendeleo",
      youth: "Vijana",
      women: "Wanawake",
      pwds: "Watu wenye Ulemavu",
      procuringEntity: "Taasisi ya Ununuzi",
      noTenders: "Hakuna zabuni zinazopatikana kwa sasa. Tafadhali angalia baadaye."
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
  
  const handleViewDetails = (id: number) => {
    onViewDetails(id);
  };

  // If there are no tenders, show a message
  if (!tenders || tenders.length === 0) {
    return (
      <Card className="bg-muted p-6 text-center">
        <CardDescription className="text-lg font-medium">{t.noTenders}</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tenders.map((tender) => (
        <Card key={tender.id} className="bg-muted p-4 rounded-md text-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-medium">{tender.title}</CardTitle>
              {tender.affirmative_action && tender.affirmative_action.type !== 'none' && (
                <Badge className={
                  tender.affirmative_action.type === 'youth' ? "bg-blue-500" : 
                  tender.affirmative_action.type === 'women' ? "bg-pink-500" : 
                  tender.affirmative_action.type === 'pwds' ? "bg-purple-500" : "bg-gray-500"
                }>
                  {tender.affirmative_action.type === 'youth' ? t.youth : 
                   tender.affirmative_action.type === 'women' ? t.women : 
                   tender.affirmative_action.type === 'pwds' ? t.pwds : ""}
                </Badge>
              )}
            </div>
            <CardDescription>
              {tender.description?.substring(0, 100) || "No description available"}...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
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
              {tender.procuring_entity && (
                <div className="flex items-center col-span-2 md:col-span-1">
                  <Star className="h-3 w-3 mr-1" />
                  {t.procuringEntity}: {tender.procuring_entity}
                </div>
              )}
              {tender.fees && (
                <div className="flex items-center">
                  <span className="font-medium">Value:</span> {tender.fees}
                </div>
              )}
              {tender.affirmative_action && tender.affirmative_action.percentage && (
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {t.affirmativeAction}: {tender.affirmative_action.percentage}%
                </div>
              )}
            </div>
          </CardContent>
          <div className="flex flex-wrap justify-end space-x-2 mt-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleViewDetails(tender.id)}
            >
              {t.viewDetails}
            </Button>
            <div className="flex space-x-2">
              {Array.isArray(shareActions) && shareActions.map((action, index) => (
                <Button 
                  key={index} 
                  size="sm" 
                  variant="ghost"
                  onClick={() => action.action(tender.id)}
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
