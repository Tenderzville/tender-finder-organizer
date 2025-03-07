
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePoints } from '@/hooks/use-points';
import { appTranslations } from '@/utils/translations';
import { Tender } from '@/types/tender';

interface TenderMatcherProps {
  tenders: Tender[];
  userProfile: any; // Replace with your user profile type
  language: 'en' | 'sw';
  userId: string | null;
  onViewDetails: (id: string) => void;
}

export const TenderMatcher: React.FC<TenderMatcherProps> = ({
  tenders,
  userProfile,
  language,
  userId,
  onViewDetails
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchedTenders, setMatchedTenders] = useState<Array<{tender: Tender, score: number}>>([]);
  const [feedbackSent, setFeedbackSent] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { points, spendPoints } = usePoints({ userId });
  const t = appTranslations[language];
  
  const AI_ANALYSIS_COST = 5; // Points cost for AI analysis
  
  const runAIMatching = async () => {
    // Check if user has enough points
    if (!(await spendPoints(AI_ANALYSIS_COST))) {
      return;
    }
    
    setIsAnalyzing(true);
    setMatchedTenders([]);
    
    try {
      // Simplified client-side matching algorithm
      // In a real implementation, this should be an API call to a backend service
      setTimeout(() => {
        const matches = tenders
          .map(tender => {
            let score = 0;
            
            // Calculate a matching score based on user profile and tender attributes
            // Business category match
            if (userProfile.businessCategory && 
                tender.category?.toLowerCase().includes(userProfile.businessCategory.toLowerCase())) {
              score += 30;
            }
            
            // Location match
            if (userProfile.location && tender.location && 
                (tender.location.toLowerCase().includes(userProfile.location.toLowerCase()) ||
                 userProfile.location.toLowerCase().includes(tender.location.toLowerCase()))) {
              score += 20;
            }
            
            // AGPO match (if applicable)
            if (userProfile.agpoCategory && 
                tender.affirmative_action?.type === userProfile.agpoCategory) {
              score += 25;
            }
            
            // Business size appropriate match
            if (tender.value) {
              const tenderValue = parseInt(tender.value.replace(/[^0-9]/g, '')) || 0;
              if (userProfile.annualTurnover >= tenderValue * 0.5) {
                score += 15;
              }
            }
            
            // Experience match
            if (userProfile.yearsInBusiness >= 2) {
              score += 10;
            }
            
            return { tender, score };
          })
          .filter(match => match.score > 30) // Only show reasonably good matches
          .sort((a, b) => b.score - a.score)
          .slice(0, 5); // Get top 5 matches
          
        setMatchedTenders(matches);
        setIsAnalyzing(false);
        
        toast({
          title: language === 'en' ? "Analysis complete" : "Uchambuzi umekamilika",
          description: language === 'en' ? "Here are your personalized tender matches" : "Hizi ndizo zabuni zinazolingana nawe",
        });
      }, 2500); // Simulate API delay
    } catch (error) {
      console.error('Error in AI matching:', error);
      setIsAnalyzing(false);
      toast({
        title: language === 'en' ? "Analysis failed" : "Uchambuzi umeshindwa",
        description: language === 'en' ? "Failed to analyze tenders. Please try again." : "Imeshindwa kuchambua zabuni. Tafadhali jaribu tena.",
        variant: "destructive"
      });
    }
  };
  
  const sendFeedback = (tenderId: string, isPositive: boolean) => {
    // Send feedback to improve AI matching
    // In a real implementation, this would be an API call
    
    toast({
      title: language === 'en' ? "Feedback received" : "Maoni yamepokelewa",
      description: language === 'en' ? "Thank you for your feedback" : "Asante kwa maoni yako",
    });
    
    setFeedbackSent(prev => ({
      ...prev,
      [tenderId]: true
    }));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{t.ai_matching}</h2>
          <p className="text-sm text-muted-foreground">
            {language === 'en' 
              ? "Find tenders that match your business profile" 
              : "Pata zabuni zinazolingana na wasifu wa biashara yako"}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {language === 'en' ? `Cost: ${AI_ANALYSIS_COST} points` : `Gharama: Pointi ${AI_ANALYSIS_COST}`}
          </span>
          <Button 
            onClick={runAIMatching} 
            disabled={isAnalyzing || points < AI_ANALYSIS_COST}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {language === 'en' ? "Analyzing..." : "Inachambua..."}
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                {language === 'en' ? "Find Matches" : "Tafuta Zinazolingana"}
              </>
            )}
          </Button>
        </div>
      </div>
      
      {isAnalyzing && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-28" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {!isAnalyzing && matchedTenders.length > 0 && (
        <div className="space-y-4">
          {matchedTenders.map(({ tender, score }) => (
            <Card key={tender.id} className="w-full">
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>{tender.title}</CardTitle>
                  <Badge variant={score >= 70 ? "default" : "outline"}>
                    {score >= 70 
                      ? (language === 'en' ? "Strong Match" : "Inalingana Sana") 
                      : (language === 'en' ? "Potential Match" : "Inaweza Kulingana")}
                  </Badge>
                </div>
                <CardDescription>{tender.category} - {tender.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.deadline}</p>
                    <p>{tender.deadline}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.value}</p>
                    <p>{tender.fees || "Contact for pricing"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'en' ? "Match Score" : "Alama ya Kulingana"}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className={`h-2.5 rounded-full ${score >= 70 ? 'bg-green-600' : 'bg-amber-500'}`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="default" 
                  onClick={() => onViewDetails(tender.id)}
                >
                  {t.viewDetails}
                </Button>
                
                {!feedbackSent[tender.id] ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => sendFeedback(tender.id, true)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => sendFeedback(tender.id, false)}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {language === 'en' ? "Feedback sent" : "Maoni yametumwa"}
                  </span>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {!isAnalyzing && matchedTenders.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {language === 'en' 
              ? "Run AI matching to find tenders that match your profile" 
              : "Endesha uchambuzi wa AI kupata zabuni zinazolingana na wasifu wako"}
          </p>
        </div>
      )}
    </div>
  );
};
