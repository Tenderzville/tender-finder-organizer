import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Tender } from "@/types/tender";
import { analyzeComplexity } from "@/utils/tenderAnalysis";

interface CompetitiveAnalysisProps {
  tender: Tender;
  userProfile?: {
    areas_of_expertise: string[];
    industry: string;
    location: string;
  };
}

export function CompetitiveAnalysis({ tender, userProfile }: CompetitiveAnalysisProps) {
  const [analysis, setAnalysis] = useState<{
    competitionLevel: 'Low' | 'Medium' | 'High';
    estimatedBidders: number;
    marketAdvantages: string[];
    challenges: string[];
    complexity: 'Low' | 'Medium' | 'High';
    differentiation: string[];
  } | null>(null);

  useEffect(() => {
    // Simulate competitive analysis
    const complexity = analyzeComplexity(tender);
    
    // Estimate competition based on tender characteristics
    let competitionLevel: 'Low' | 'Medium' | 'High' = 'Medium';
    let estimatedBidders = 5;
    
    if (tender.category?.toLowerCase().includes('construction')) {
      competitionLevel = 'High';
      estimatedBidders = 12;
    } else if (tender.category?.toLowerCase().includes('consultancy')) {
      competitionLevel = 'Medium';
      estimatedBidders = 7;
    } else if (tender.category?.toLowerCase().includes('supplies')) {
      competitionLevel = 'High';
      estimatedBidders = 15;
    }

    const marketAdvantages = [];
    const challenges = [];
    const differentiation = [];

    // Analyze user advantages
    if (userProfile?.areas_of_expertise.some(area => 
      tender.description?.toLowerCase().includes(area.toLowerCase())
    )) {
      marketAdvantages.push("Direct expertise match with tender requirements");
      differentiation.push("Specialized knowledge in required area");
    }

    if (userProfile?.location === tender.location) {
      marketAdvantages.push("Local presence and market knowledge");
      differentiation.push("Understanding of local regulations and customs");
    }

    // Common challenges
    if (complexity === 'High') {
      challenges.push("Complex technical requirements may limit bidder pool");
      challenges.push("Extensive documentation and compliance needed");
    }

    if (competitionLevel === 'High') {
      challenges.push("High competition expected from established players");
      challenges.push("Price competition likely to be intense");
    }

    // Differentiation opportunities
    differentiation.push("Past performance and proven track record");
    differentiation.push("Innovative approach to project delivery");
    differentiation.push("Strong partnerships and consortium capabilities");

    setAnalysis({
      competitionLevel,
      estimatedBidders,
      marketAdvantages,
      challenges,
      complexity,
      differentiation
    });
  }, [tender, userProfile]);

  if (!analysis) return <div>Loading competitive analysis...</div>;

  return (
    <div className="space-y-6">
      {/* Competition Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Competition Landscape
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Competition Level</h4>
              <Badge variant={
                analysis.competitionLevel === 'Low' ? 'outline' :
                analysis.competitionLevel === 'Medium' ? 'secondary' : 'destructive'
              }>
                {analysis.competitionLevel}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium mb-2">Estimated Bidders</h4>
              <span className="text-2xl font-bold text-primary">{analysis.estimatedBidders}</span>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Market Saturation</span>
              <span className="text-sm">{
                analysis.competitionLevel === 'Low' ? '30%' :
                analysis.competitionLevel === 'Medium' ? '60%' : '85%'
              }</span>
            </div>
            <Progress value={
              analysis.competitionLevel === 'Low' ? 30 :
              analysis.competitionLevel === 'Medium' ? 60 : 85
            } className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Your Advantages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
            Your Competitive Advantages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.marketAdvantages.length > 0 ? (
            <ul className="space-y-2">
              {analysis.marketAdvantages.map((advantage, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                  <span className="text-sm">{advantage}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              Complete your profile to identify competitive advantages
            </p>
          )}
        </CardContent>
      </Card>

      {/* Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-600" />
            Key Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.challenges.map((challenge, idx) => (
              <li key={idx} className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-amber-600 mr-2 mt-1 flex-shrink-0" />
                <span className="text-sm">{challenge}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Differentiation Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Differentiation Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.differentiation.map((diff, idx) => (
              <li key={idx} className="flex items-start">
                <TrendingUp className="h-4 w-4 text-primary mr-2 mt-1 flex-shrink-0" />
                <span className="text-sm">{diff}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}