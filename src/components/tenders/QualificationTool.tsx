
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, HelpCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tender } from "@/types/tender";

interface BusinessProfile {
  registrationClass: string;
  annualTurnover: number;
  yearsInBusiness: number;
  hasCompletedSimilarProjects: boolean;
  location: string;
  industry: string;
}

interface QualificationToolProps {
  tenders: Tender[];
}

export function QualificationTool({ tenders }: QualificationToolProps) {
  const { toast } = useToast();
  const [profile, setProfile] = useState<BusinessProfile>({
    registrationClass: "",
    annualTurnover: 0,
    yearsInBusiness: 0,
    hasCompletedSimilarProjects: false,
    location: "",
    industry: ""
  });
  const [results, setResults] = useState<Array<{tender: Tender, eligible: boolean, reason: string}> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value
    }));
  };

  const analyzeEligibility = async () => {
    setIsAnalyzing(true);
    
    try {
      // Local AI eligibility check - this is a simplified version without calling a backend
      const analyzedResults = tenders.map(tender => {
        // Extract requirements from tender description and requirements fields
        const description = (tender.description || "").toLowerCase();
        const requirements = (tender.requirements || "").toLowerCase();
        const combined = `${description} ${requirements}`.toLowerCase();
        
        // Simple rule-based eligibility checks
        const checks = {
          registrationClassMatch: !combined.includes("class") || 
            combined.includes(profile.registrationClass.toLowerCase()),
          
          turnoverSufficient: !combined.includes("turnover") || 
            !combined.match(/turnover of (\d+)/) || 
            profile.annualTurnover >= parseInt(combined.match(/turnover of (\d+)/)?.[1] || "0"),
          
          experienceMatch: !combined.includes("years experience") || 
            !combined.match(/(\d+) years experience/) || 
            profile.yearsInBusiness >= parseInt(combined.match(/(\d+) years experience/)?.[1] || "0"),
          
          locationMatch: !tender.location || 
            tender.location.toLowerCase() === "international" || 
            tender.location.toLowerCase().includes(profile.location.toLowerCase()) ||
            profile.location.toLowerCase().includes(tender.location.toLowerCase()),
          
          industryMatch: !tender.category || 
            tender.category.toLowerCase() === "other" || 
            tender.category.toLowerCase().includes(profile.industry.toLowerCase()) ||
            profile.industry.toLowerCase().includes(tender.category.toLowerCase())
        };
        
        // Determine overall eligibility
        const eligible = Object.values(checks).every(check => check);
        
        // Generate reason message
        let reason = eligible 
          ? "Your business profile appears to meet all basic requirements for this tender."
          : "You may not qualify because: ";
        
        if (!eligible) {
          if (!checks.registrationClassMatch) reason += "Registration class mismatch. ";
          if (!checks.turnoverSufficient) reason += "Annual turnover insufficient. ";
          if (!checks.experienceMatch) reason += "Not enough years of experience. ";
          if (!checks.locationMatch) reason += "Location requirements not met. ";
          if (!checks.industryMatch) reason += "Industry/category mismatch. ";
        }
        
        return { tender, eligible, reason };
      });
      
      setResults(analyzedResults);
      
      // Show success toast
      toast({
        title: "Analysis Complete",
        description: `Analyzed ${analyzedResults.length} tenders based on your business profile.`,
      });
    } catch (error) {
      console.error("Error analyzing eligibility:", error);
      toast({
        title: "Analysis Failed",
        description: "Unable to complete eligibility analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Will I Qualify? Pre-Check Tool</CardTitle>
        <CardDescription>Enter your business details to check eligibility for available tenders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="registrationClass">Registration Class/Level</Label>
            <Input 
              id="registrationClass" 
              name="registrationClass" 
              placeholder="e.g., Class A, NCA 3, etc." 
              value={profile.registrationClass}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="annualTurnover">Annual Turnover (KES)</Label>
            <Input 
              id="annualTurnover" 
              name="annualTurnover" 
              type="number" 
              placeholder="0"
              value={profile.annualTurnover === 0 ? "" : profile.annualTurnover}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsInBusiness">Years in Business</Label>
            <Input 
              id="yearsInBusiness" 
              name="yearsInBusiness" 
              type="number" 
              placeholder="0"
              value={profile.yearsInBusiness === 0 ? "" : profile.yearsInBusiness}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Primary Location</Label>
            <Input 
              id="location" 
              name="location" 
              placeholder="e.g., Nairobi, Mombasa"
              value={profile.location}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Primary Industry</Label>
            <Input 
              id="industry" 
              name="industry" 
              placeholder="e.g., Construction, IT, Healthcare"
              value={profile.industry}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex items-center space-x-2 pt-8">
            <input
              type="checkbox"
              id="hasCompletedSimilarProjects"
              name="hasCompletedSimilarProjects"
              checked={profile.hasCompletedSimilarProjects}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="hasCompletedSimilarProjects" className="cursor-pointer">
              Completed similar projects before
            </Label>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={analyzeEligibility} 
          disabled={isAnalyzing} 
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Eligibility...
            </>
          ) : (
            "Check My Eligibility"
          )}
        </Button>
      </CardFooter>
      
      {results && results.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-lg font-medium mb-4">Eligibility Results:</h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-md border ${
                  result.eligible ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start">
                  {result.eligible ? 
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" /> : 
                    <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  }
                  <div>
                    <h4 className="font-medium">{result.tender.title}</h4>
                    <p className={`text-sm ${result.eligible ? "text-green-700" : "text-red-700"}`}>
                      {result.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {results && results.length === 0 && (
        <div className="px-6 pb-6 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No tenders to analyze</h3>
          <p className="text-gray-500">
            There are currently no tenders available to check against your profile.
          </p>
        </div>
      )}
    </Card>
  );
}
