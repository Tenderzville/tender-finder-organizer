
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, FileText, Brain } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AITenderAnalysisProps {
  tenderTitle?: string;
  tenderDescription?: string;
}

export function AITenderAnalysis({ tenderTitle, tenderDescription }: AITenderAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<null | {
    summary: string;
    keyRequirements: string[];
    complexity: 'Low' | 'Medium' | 'High';
    suggestedApproach: string;
    potentialChallenges: string[];
  }>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeTender = async () => {
    // This is a placeholder for future AI integration
    // No API keys or costs are involved
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response
      setAnalysis({
        summary: "This appears to be a tender for IT services requiring experience in government projects.",
        keyRequirements: [
          "5+ years of relevant experience",
          "Tax compliance certificate",
          "Company registration documents",
          "3 reference letters from past clients"
        ],
        complexity: "Medium",
        suggestedApproach: "Focus on demonstrating past government experience and compliance with all documentation requirements.",
        potentialChallenges: [
          "Tight deadline for submission",
          "Complex technical requirements",
          "Strong competition expected"
        ]
      });
    } catch (err) {
      setError("Open-source AI analysis is still in development. This feature will be available soon at no cost.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          AI Tender Analysis
        </CardTitle>
        <CardDescription>
          Get AI-powered insights on tender requirements and suggestions (Coming soon)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!analysis && !isAnalyzing && (
          <div className="space-y-4">
            <Textarea 
              placeholder="Paste tender description here or use the pre-loaded tender information"
              className="min-h-[100px]"
              defaultValue={tenderDescription || ""}
            />
            <Button 
              onClick={analyzeTender} 
              className="w-full"
              disabled={isAnalyzing}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Tender (Open Source - No Cost)
            </Button>
          </div>
        )}
        
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center text-sm text-muted-foreground">
              Analyzing tender information using open-source models...
              <br />
              This may take a moment
            </p>
          </div>
        )}
        
        {analysis && !isAnalyzing && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Summary</h3>
              <p className="text-sm">{analysis.summary}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Key Requirements</h3>
              <ul className="text-sm space-y-1">
                {analysis.keyRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-start">
                    <FileText className="h-3 w-3 mr-2 mt-1 text-primary" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Complexity Level</h3>
                <p className="text-sm">{analysis.complexity}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Approach</h3>
                <p className="text-sm">{analysis.suggestedApproach}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Potential Challenges</h3>
              <ul className="text-sm space-y-1">
                {analysis.potentialChallenges.map((challenge, idx) => (
                  <li key={idx}>{challenge}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <p>100% Free Open Source AI - No API costs</p>
        {analysis && (
          <Button variant="ghost" size="sm" onClick={() => setAnalysis(null)}>
            Analyze Another
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
