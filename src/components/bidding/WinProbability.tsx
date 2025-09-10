import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Users, Award } from "lucide-react";
import { Tender } from "@/types/tender";
import { matchTenderToSupplier, analyzeComplexity } from "@/utils/tenderAnalysis";

interface WinProbabilityProps {
  tender: Tender;
  userProfile?: {
    areas_of_expertise: string[];
    industry: string;
    location: string;
  };
}

export function WinProbability({ tender, userProfile }: WinProbabilityProps) {
  const [probability, setProbability] = useState<{
    overall: number;
    factors: {
      expertise: number;
      location: number;
      experience: number;
      competition: number;
      complexity: number;
    };
    recommendations: string[];
  } | null>(null);

  useEffect(() => {
    if (!userProfile) {
      setProbability({
        overall: 25,
        factors: {
          expertise: 0,
          location: 0,
          experience: 0,
          competition: 50,
          complexity: 50
        },
        recommendations: ["Complete your profile to get accurate probability assessment"]
      });
      return;
    }

    // Calculate match score
    const matchScore = matchTenderToSupplier(tender, userProfile);
    const complexity = analyzeComplexity(tender);
    
    // Calculate individual factors
    const factors = {
      expertise: matchScore,
      location: tender.location?.toLowerCase().includes(userProfile.location.toLowerCase()) ? 85 : 40,
      experience: Math.min(90, userProfile.areas_of_expertise.length * 20), // Simulated
      competition: complexity === 'High' ? 65 : complexity === 'Medium' ? 50 : 35, // Higher complexity = fewer competitors
      complexity: complexity === 'Low' ? 80 : complexity === 'Medium' ? 60 : 40
    };

    // Calculate overall probability (weighted average)
    const weights = {
      expertise: 0.3,
      location: 0.2,
      experience: 0.25,
      competition: 0.15,
      complexity: 0.1
    };

    const overall = Math.round(
      factors.expertise * weights.expertise +
      factors.location * weights.location +
      factors.experience * weights.experience +
      factors.competition * weights.competition +
      factors.complexity * weights.complexity
    );

    // Generate recommendations
    const recommendations = [];
    if (factors.expertise < 60) {
      recommendations.push("Highlight relevant expertise more prominently in your bid");
    }
    if (factors.location < 70) {
      recommendations.push("Consider partnering with local companies for geographic advantage");
    }
    if (factors.experience < 70) {
      recommendations.push("Emphasize past project successes and client testimonials");
    }
    if (overall > 70) {
      recommendations.push("Strong position - focus on competitive pricing");
    } else if (overall > 50) {
      recommendations.push("Moderate chances - differentiate through innovation and value-adds");
    } else {
      recommendations.push("Consider if this tender aligns with your core strengths");
    }

    setProbability({ overall, factors, recommendations });
  }, [tender, userProfile]);

  if (!probability) return <div>Calculating win probability...</div>;

  const getProbabilityColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getProbabilityBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-100 text-green-800">High Probability</Badge>;
    if (score >= 50) return <Badge variant="secondary">Moderate Probability</Badge>;
    return <Badge variant="destructive">Low Probability</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Overall Probability */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <Award className="mr-2 h-5 w-5" />
            Win Probability Assessment
          </CardTitle>
          <div className="mt-4">
            <div className={`text-6xl font-bold ${getProbabilityColor(probability.overall)}`}>
              {probability.overall}%
            </div>
            <div className="mt-2">
              {getProbabilityBadge(probability.overall)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={probability.overall} className="h-3" />
        </CardContent>
      </Card>

      {/* Factor Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Probability Factors
          </CardTitle>
          <CardDescription>
            Key factors affecting your chances of winning this tender
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Expertise Match</span>
                <span className="text-sm">{probability.factors.expertise}%</span>
              </div>
              <Progress value={probability.factors.expertise} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Location Advantage</span>
                <span className="text-sm">{probability.factors.location}%</span>
              </div>
              <Progress value={probability.factors.location} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Experience Level</span>
                <span className="text-sm">{probability.factors.experience}%</span>
              </div>
              <Progress value={probability.factors.experience} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Competition Level</span>
                <span className="text-sm">{probability.factors.competition}%</span>
              </div>
              <Progress value={probability.factors.competition} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Complexity Match</span>
                <span className="text-sm">{probability.factors.complexity}%</span>
              </div>
              <Progress value={probability.factors.complexity} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Strategic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {probability.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <TrendingUp className="h-4 w-4 text-primary mr-2 mt-1 flex-shrink-0" />
                <span className="text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}