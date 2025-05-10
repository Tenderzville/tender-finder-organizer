
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tender } from "@/types/tender";
import { analyzeComplexity, extractRequirements, findSimilarTenders } from "@/utils/tenderAnalysis";

interface AITenderInsightsProps {
  tender: Tender;
}

export function AITenderInsights({ tender }: AITenderInsightsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<null | {
    complexity: 'Low' | 'Medium' | 'High';
    keyRequirements: string[];
    similarTenders: Tender[];
  }>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeTender = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Simulate some processing time to make the UI more believable
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extract key requirements
      const keyRequirements = extractRequirements(tender.description || "");
      
      // Analyze complexity
      const complexity = analyzeComplexity(tender);
      
      // Find similar tenders
      const similarTenders = await findSimilarTenders(tender, 3);
      
      setAnalysis({
        complexity,
        keyRequirements,
        similarTenders
      });
    } catch (err) {
      console.error("Error analyzing tender:", err);
      setError("An error occurred while analyzing this tender. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BrainCircuit className="mr-2 h-5 w-5 text-indigo-500" />
          AI-Powered Tender Insights
        </CardTitle>
        <CardDescription>
          Get intelligent analysis and requirements extraction
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!analysis && !isAnalyzing && (
          <div className="flex justify-center">
            <Button 
              onClick={analyzeTender} 
              className="w-full mb-4"
              disabled={isAnalyzing}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze This Tender
            </Button>
          </div>
        )}
        
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
            <p className="text-center text-sm text-muted-foreground">
              Analyzing tender information...
            </p>
          </div>
        )}
        
        {analysis && !isAnalyzing && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Complexity Analysis</h3>
              <Badge 
                variant={
                  analysis.complexity === 'Low' ? 'outline' : 
                  analysis.complexity === 'Medium' ? 'secondary' : 
                  'destructive'
                }
                className="text-xs"
              >
                {analysis.complexity} Complexity
              </Badge>
              <p className="text-xs mt-1 text-muted-foreground">
                {analysis.complexity === 'Low' 
                  ? 'This tender appears to be straightforward with standard requirements.'
                  : analysis.complexity === 'Medium'
                  ? 'This tender has moderate complexity with some specialized requirements.'
                  : 'This tender is highly complex with numerous specialized requirements.'
                }
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Key Requirements</h3>
              {analysis.keyRequirements.length > 0 ? (
                <ul className="text-xs space-y-1">
                  {analysis.keyRequirements.map((req, idx) => (
                    <li key={idx} className="ml-4 list-disc">{req}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No specific requirements could be automatically extracted. Please review the full tender description.
                </p>
              )}
            </div>
            
            {analysis.similarTenders.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Similar Tenders</h3>
                <ul className="text-xs space-y-2">
                  {analysis.similarTenders.map((t) => (
                    <li key={t.id} className="border-l-2 border-indigo-200 pl-2">
                      <span className="font-medium">{t.title}</span>
                      <p className="text-muted-foreground truncate">{t.description?.substring(0, 60)}...</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <p>Powered by open source AI analysis</p>
        {analysis && (
          <Button variant="ghost" size="sm" onClick={() => setAnalysis(null)}>
            Analyze Again
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
