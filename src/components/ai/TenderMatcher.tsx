import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle, Share, ChevronDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useNavigate } from "react-router-dom";
import type { Tender } from "@/types/tender";
import type { UserProfile } from "@/types/user";

interface TenderMatcherProps {
  userId: string;
  language: 'en' | 'sw';
}

export const TenderMatcher: React.FC<TenderMatcherProps> = ({ userId, language }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingTenders, setLoadingTenders] = useState(true);
  const [matchScores, setMatchScores] = useState<{ [tenderId: number]: number }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const translations = {
    en: {
      title: "Tender Matcher",
      description: "Find tenders that best match your company profile",
      profileDetails: "Enter your company profile details",
      companyName: "Company Name",
      industry: "Industry",
      location: "Location",
      expertise: "Expertise",
      searchTenders: "Search Tenders",
      match: "Match",
      location: "Location",
      category: "Category",
      deadline: "Deadline",
      viewDetails: "View Details",
      generateProposal: "Generate Proposal",
      generateProposalDesc: "Are you sure you want to generate a proposal for this tender?",
      cancel: "Cancel",
      continue: "Continue",
      share: "Share",
      strengths: "Strengths",
      weaknesses: "Weaknesses",
      viewAnalysis: "View Strength/Weakness Analysis",
    },
    sw: {
      title: "Linganisha Zabuni",
      description: "Tafuta zabuni zinazolingana vyema na wasifu wa kampuni yako",
      profileDetails: "Ingiza maelezo ya wasifu wa kampuni yako",
      companyName: "Jina la Kampuni",
      industry: "Sekta",
      location: "Mahali",
      expertise: "Utaalamu",
      searchTenders: "Tafuta Zabuni",
      match: "Linganisho",
      location: "Mahali",
      category: "Kategoria",
      deadline: "Tarehe ya mwisho",
      viewDetails: "Angalia Maelezo",
      generateProposal: "Tengeneza Pendekezo",
      generateProposalDesc: "Una uhakika unataka kutengeneza pendekezo la zabuni hii?",
      cancel: "Ghairi",
      continue: "Endelea",
      share: "Shiriki",
      strengths: "Nguvu",
      weaknesses: "Udhaifu",
      viewAnalysis: "Angalia Uchambuzi wa Nguvu/Udhaifu",
      viewAnalysis: "Angalia Uchambuzi wa Nguvu/Udhaifu",
    }
  };

  const t = translations[language];

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) throw error;

        setProfile(data as UserProfile);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchTenders = async () => {
      setLoadingTenders(true);
      try {
        const { data, error } = await supabase
          .from('tenders')
          .select('*');

        if (error) throw error;

        setTenders(data as Tender[]);
      } catch (error) {
        console.error("Error fetching tenders:", error);
        toast({
          title: "Error",
          description: "Failed to load tenders. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingTenders(false);
      }
    };

    fetchProfile();
    fetchTenders();
  }, [userId]);

  useEffect(() => {
    if (profile && tenders.length > 0) {
      const scores: { [tenderId: number]: number } = {};
      tenders.forEach(tender => {
        let score = 0;

        // Simple matching logic (can be improved)
        if (profile.company_name && tender.title.toLowerCase().includes(profile.company_name.toLowerCase())) {
          score += 20;
        }
        if (profile.industry && tender.category?.toLowerCase().includes(profile.industry.toLowerCase())) {
          score += 30;
        }
        if (profile.location && tender.location?.toLowerCase().includes(profile.location.toLowerCase())) {
          score += 25;
        }
        if (profile.expertise && tender.description?.toLowerCase().includes(profile.expertise.toLowerCase())) {
          score += 25;
        }

        scores[tender.id] = Math.min(100, score); // Cap at 100
      });
      setMatchScores(scores);
    }
  }, [profile, tenders]);

  const handleGenerateProposal = async (tenderId: string) => {
    setIsGenerating(true);
    try {
      // Simulate proposal generation (replace with actual logic)
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Proposal Generated",
        description: `Proposal generated for tender ID: ${tenderId}`,
      });
    } catch (error) {
      console.error("Error generating proposal:", error);
      toast({
        title: "Error",
        description: "Failed to generate proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareTender = async (tenderId: string) => {
    try {
      // Simulate sharing logic (replace with actual sharing)
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Tender Shared",
        description: `Tender shared successfully (ID: ${tenderId})`,
      });
    } catch (error) {
      console.error("Error sharing tender:", error);
      toast({
        title: "Error",
        description: "Failed to share tender. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onViewDetails = (tenderId: string) => {
    navigate(`/tenders/${tenderId}`);
  };

  const generateStrengths = (tender: Tender, profile: UserProfile | null): string[] => {
    const strengths: string[] = [];
    if (!profile) return strengths;

    if (profile.company_name && tender.title.toLowerCase().includes(profile.company_name.toLowerCase())) {
      strengths.push("Your company name matches the tender title.");
    }
    if (profile.industry && tender.category?.toLowerCase().includes(profile.industry.toLowerCase())) {
      strengths.push("Your industry aligns with the tender category.");
    }
    if (profile.location && tender.location?.toLowerCase().includes(profile.location.toLowerCase())) {
      strengths.push("Your location matches the tender location.");
    }
    if (profile.expertise && tender.description?.toLowerCase().includes(profile.expertise.toLowerCase())) {
      strengths.push("Your expertise aligns with the tender description.");
    }
    return strengths;
  };

  const generateWeaknesses = (tender: Tender, profile: UserProfile | null): string[] => {
    const weaknesses: string[] = [];
    if (!profile) return weaknesses;

    if (profile.company_name && !tender.title.toLowerCase().includes(profile.company_name.toLowerCase())) {
      weaknesses.push("Your company name does not closely match the tender title.");
    }
    if (profile.industry && !tender.category?.toLowerCase().includes(profile.industry.toLowerCase())) {
      weaknesses.push("Your industry does not align well with the tender category.");
    }
    if (profile.location && !tender.location?.toLowerCase().includes(profile.location.toLowerCase())) {
      weaknesses.push("Your location does not match the tender location.");
    }
    if (profile.expertise && !tender.description?.toLowerCase().includes(profile.expertise.toLowerCase())) {
      weaknesses.push("Your expertise does not align well with the tender description.");
    }
    return weaknesses;
  };

  if (loadingProfile || loadingTenders) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>No profile found. Please complete your profile to use the Tender Matcher.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-lg font-medium">{t.profileDetails}</h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="company-name">{t.companyName}</Label>
            <Input id="company-name" value={profile.company_name || ""} readOnly />
          </div>
          <div>
            <Label htmlFor="industry">{t.industry}</Label>
            <Input id="industry" value={profile.industry || ""} readOnly />
          </div>
          <div>
            <Label htmlFor="location">{t.location}</Label>
            <Input id="location" value={profile.location || ""} readOnly />
          </div>
          <div>
            <Label htmlFor="expertise">{t.expertise}</Label>
            <Input id="expertise" value={profile.expertise || ""} readOnly />
          </div>
        </div>

        <h3 className="text-lg font-medium">{t.searchTenders}</h3>
        {tenders.map((tender) => (
          <div key={tender.id} className="mb-6 p-4 border rounded shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold mb-2">{tender.title}</h3>
              <Badge variant="outline" className={matchScores[tender.id] >= 80 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                {matchScores[tender.id]}% {t.match}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              <div><span className="font-medium">{t.location}:</span> {tender.location}</div>
              <div><span className="font-medium">{t.category}:</span> {tender.category}</div>
              <div><span className="font-medium">{t.deadline}:</span> {new Date(tender.deadline).toLocaleDateString()}</div>
            </div>
            
            {/* Strength/weakness analysis section */}
            <div className="mt-3 mb-3">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    {t.viewAnalysis} <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="space-y-2 text-sm">
                    <div>
                      <h4 className="font-medium text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> {t.strengths}
                      </h4>
                      <ul className="list-disc list-inside pl-1 text-gray-600">
                        {generateStrengths(tender, profile).map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {t.weaknesses}
                      </h4>
                      <ul className="list-disc list-inside pl-1 text-gray-600">
                        {generateWeaknesses(tender, profile).map((weakness, i) => (
                          <li key={i}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
            
            <div className="flex gap-2 mt-2">
              {/* Fix TS2345 error by converting tender.id to string */}
              <Button size="sm" onClick={() => onViewDetails(String(tender.id))}>
                {t.viewDetails}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    {t.generateProposal}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.generateProposal}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.generateProposalDesc}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                    {/* Fix TS2345 error by converting tender.id to string */}
                    <AlertDialogAction onClick={() => handleGenerateProposal(String(tender.id))}>
                      {t.continue}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {/* Fix TS2345 error by converting tender.id to string */}
              <Button size="sm" variant="ghost" onClick={() => handleShareTender(String(tender.id))}>
                <Share className="h-4 w-4 mr-1" /> {t.share}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
