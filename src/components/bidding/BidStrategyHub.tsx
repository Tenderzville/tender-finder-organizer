import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calculator, Target, FileBarChart } from "lucide-react";
import { Tender } from "@/types/tender";
import { CompetitiveAnalysis } from "./CompetitiveAnalysis";
import { BidCalculator } from "./BidCalculator";
import { WinProbability } from "./WinProbability";
import { StrategyRecommendations } from "./StrategyRecommendations";

interface BidStrategyHubProps {
  tender: Tender;
  userProfile?: {
    areas_of_expertise: string[];
    industry: string;
    location: string;
  };
}

export function BidStrategyHub({ tender, userProfile }: BidStrategyHubProps) {
  const [activeTab, setActiveTab] = useState("analysis");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="mr-2 h-5 w-5 text-primary" />
          Bid Strategy Center
        </CardTitle>
        <CardDescription>
          Comprehensive tools to develop winning bid strategies for {tender.title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis" className="flex items-center">
              <FileBarChart className="w-4 h-4 mr-1" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center">
              <Calculator className="w-4 h-4 mr-1" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="probability" className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Win Rate
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center">
              <Target className="w-4 h-4 mr-1" />
              Strategy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="mt-6">
            <CompetitiveAnalysis tender={tender} userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="calculator" className="mt-6">
            <BidCalculator tender={tender} />
          </TabsContent>

          <TabsContent value="probability" className="mt-6">
            <WinProbability tender={tender} userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="strategy" className="mt-6">
            <StrategyRecommendations tender={tender} userProfile={userProfile} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}