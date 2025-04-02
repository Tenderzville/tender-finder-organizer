
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Lightbulb, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tender } from "@/types/tender";

interface UserProfile {
  industry?: string;
  areas_of_expertise?: string[];
  company_size?: string;
  experience_level?: string;
  location?: string;
}

export interface TenderMatcherProps {
  userProfile: UserProfile;
  language: 'en' | 'sw';
  userId: string | null;
  onViewDetails: (id: string) => void;
}

export function TenderMatcher({ userProfile, language, userId, onViewDetails }: TenderMatcherProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchedTenders, setMatchedTenders] = useState<Tender[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tenderData, setTenderData] = useState<Tender[]>([]);
  
  const t = {
    en: {
      title: "AI Tender Matcher",
      description: "Find tenders that match your expertise and capabilities",
      analyze: "Analyze My Profile",
      analyzing: "Analyzing...",
      matchFound: "Match Found",
      loading: "Loading your recommendations...",
      viewDetails: "View Details",
      noMatches: "No matching tenders found",
      tryAgain: "Try Again",
      error: "Error",
      errorDesc: "Failed to analyze your profile. Please try again.",
      notLoggedIn: "Please sign in to use this feature",
      signIn: "Sign In",
      completeProfile: "Please complete your profile to get better matches",
      updateProfile: "Update Profile",
      matchScore: "Match Score",
      expertiseMatch: "Your expertise in {0} matches this tender requirement"
    },
    sw: {
      title: "Kigezo cha AI Kwa Zabuni",
      description: "Pata zabuni zinazofanana na utaalamu na uwezo wako",
      analyze: "Changanua Wasifu Wangu",
      analyzing: "Inachanganua...",
      matchFound: "Mechi Imepatikana",
      loading: "Inapakia mapendekezo yako...",
      viewDetails: "Ona Maelezo",
      noMatches: "Hakuna zabuni zinazofanana zilizopatikana",
      tryAgain: "Jaribu Tena",
      error: "Hitilafu",
      errorDesc: "Imeshindwa kuchanganua wasifu wako. Tafadhali jaribu tena.",
      notLoggedIn: "Tafadhali ingia ili kutumia kipengele hiki",
      signIn: "Ingia",
      completeProfile: "Tafadhali kamilisha wasifu wako ili kupata mechi bora",
      updateProfile: "Sasisha Wasifu",
      matchScore: "Alama ya Mechi",
      expertiseMatch: "Utaalamu wako katika {0} unafanana na mahitaji ya zabuni hii"
    }
  };

  const handleAnalyzeClick = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // In a real app, this would be a call to a backend service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data - in a real app, this would come from the backend
      const mockMatchedTenders: Tender[] = [
        {
          id: "1",
          title: "IT Infrastructure Upgrade",
          description: "Seeking vendors for upgrading government IT infrastructure",
          procuring_entity: "Ministry of ICT",
          tender_no: "ICT-2023-001",
          category: "IT & Telecommunications",
          deadline: new Date().toISOString(),
          location: "Nairobi",
          tender_url: "#",
          points_required: 100
        },
        {
          id: "2",
          title: "Medical Equipment Supply",
          description: "Supply of various medical equipment to county hospitals",
          procuring_entity: "Ministry of Health",
          tender_no: "MOH-2023-045",
          category: "Medical Supplies",
          deadline: new Date().toISOString(),
          location: "Multiple Counties",
          tender_url: "#",
          points_required: 200
        }
      ];
      
      setMatchedTenders(mockMatchedTenders);
      setTenderData(mockMatchedTenders);
      setAnalysisComplete(true);
    } catch (err) {
      console.error("Error analyzing profile:", err);
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const calculateMatchScore = (tender: Tender) => {
    // In a real app, this would be a more sophisticated algorithm
    if (!userProfile) return 50; // Default score
    
    let score = 60; // Base score
    
    // Check if user's areas of expertise match the tender category
    if (userProfile.areas_of_expertise && tender.category) {
      if (userProfile.areas_of_expertise.some(exp => 
        tender.category.toLowerCase().includes(exp.toLowerCase())
      )) {
        score += 20;
      }
    }
    
    // Check if user's location matches tender location
    if (userProfile.location && tender.location) {
      if (userProfile.location.toLowerCase() === tender.location.toLowerCase()) {
        score += 10;
      }
    }
    
    return Math.min(score, 100);
  };
  
  const getMatchDescription = (tender: Tender) => {
    if (!userProfile || !userProfile.areas_of_expertise) return "";
    
    // Find matching expertise
    const matchingExpertise = userProfile.areas_of_expertise.find(exp => 
      tender.category.toLowerCase().includes(exp.toLowerCase())
    );
    
    if (matchingExpertise) {
      return t[language].expertiseMatch.replace('{0}', matchingExpertise);
    }
    
    return "";
  };
  
  // If user is not logged in
  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t[language].title}</CardTitle>
          <CardDescription>
            {t[language].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>{t[language].notLoggedIn}</AlertTitle>
            <AlertDescription>
              <Button variant="link" className="p-0" onClick={() => window.location.href = "/auth"}>
                {t[language].signIn}
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // If user profile is incomplete
  if (userProfile && (!userProfile.areas_of_expertise || userProfile.areas_of_expertise.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t[language].title}</CardTitle>
          <CardDescription>
            {t[language].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>{t[language].completeProfile}</AlertTitle>
            <AlertDescription>
              <Button variant="link" className="p-0" onClick={() => window.location.href = "/preferences"}>
                {t[language].updateProfile}
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            {t[language].title}
          </span>
          {!isAnalyzing && !analysisComplete && (
            <Button size="sm" onClick={handleAnalyzeClick}>
              {t[language].analyze}
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {t[language].description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>{t[language].loading}</p>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertTitle>{t[language].error}</AlertTitle>
            <AlertDescription>
              {t[language].errorDesc}
              <Button variant="link" className="p-0 ml-2" onClick={handleAnalyzeClick}>
                {t[language].tryAgain}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {analysisComplete && matchedTenders.length > 0 && (
          <div className="space-y-4">
            {matchedTenders.map((tender) => {
              const matchScore = calculateMatchScore(tender);
              return (
                <div key={tender.id} className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{tender.title}</h3>
                    <Badge variant={matchScore > 80 ? "default" : "outline"} className="ml-2">
                      {matchScore}% {t[language].matchScore}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{tender.description}</p>
                  
                  {userProfile.areas_of_expertise && getMatchDescription(tender) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Lightbulb className="h-3 w-3 text-green-600" />
                      <span>{getMatchDescription(tender)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewDetails(String(tender.id))}
                    >
                      {t[language].viewDetails}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {analysisComplete && matchedTenders.length === 0 && (
          <div className="text-center p-6">
            <p className="mb-2">{t[language].noMatches}</p>
            <Button variant="outline" onClick={handleAnalyzeClick}>
              {t[language].tryAgain}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
