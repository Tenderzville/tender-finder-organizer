
import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Users, Network } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionButtonsProps {
  language: 'en' | 'sw';
}

export function QuickActionButtons({ language }: QuickActionButtonsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center py-6"
        onClick={() => navigate('/learning-hub')}
      >
        <BookOpen className="h-6 w-6 mb-2" />
        <span>{language === 'en' ? "Learning Hub" : "Kituo cha Kujifunza"}</span>
      </Button>

      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center py-6"
        onClick={() => {/* Calendar view */}}
      >
        <Calendar className="h-6 w-6 mb-2" />
        <span>{language === 'en' ? "Tender Calendar" : "Kalenda ya Zabuni"}</span>
      </Button>

      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center py-6"
        onClick={() => {/* Service provider directory */}}
      >
        <Users className="h-6 w-6 mb-2" />
        <span>{language === 'en' ? "Find Services" : "Tafuta Huduma"}</span>
      </Button>

      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center py-6"
        onClick={() => {/* Consortium building */}}
      >
        <Network className="h-6 w-6 mb-2" />
        <span>{language === 'en' ? "Build Consortium" : "Jenga Muungano"}</span>
      </Button>
    </div>
  );
}
