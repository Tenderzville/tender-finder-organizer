import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle, Clock, Users, FileText } from "lucide-react";
import { Tender } from "@/types/tender";
import { analyzeComplexity } from "@/utils/tenderAnalysis";

interface StrategyRecommendationsProps {
  tender: Tender;
  userProfile?: {
    areas_of_expertise: string[];
    industry: string;
    location: string;
  };
}

export function StrategyRecommendations({ tender, userProfile }: StrategyRecommendationsProps) {
  const complexity = analyzeComplexity(tender);
  
  const getStrategyRecommendations = () => {
    const strategies = [];

    // Based on complexity
    if (complexity === 'High') {
      strategies.push({
        category: 'Technical Approach',
        icon: <FileText className="h-4 w-4" />,
        priority: 'High',
        title: 'Demonstrate Deep Technical Expertise',
        description: 'Provide detailed technical solutions, methodologies, and innovative approaches that set you apart from competitors.',
        actions: [
          'Include technical diagrams and workflows',
          'Highlight unique methodologies or technologies',
          'Provide case studies of similar complex projects',
          'Detail your quality assurance processes'
        ]
      });
    }

    // Location-based strategy
    if (tender.location && userProfile?.location !== tender.location) {
      strategies.push({
        category: 'Partnership',
        icon: <Users className="h-4 w-4" />,
        priority: 'Medium',
        title: 'Local Partnership Strategy',
        description: 'Partner with local companies to gain geographic advantage and local market knowledge.',
        actions: [
          'Identify reputable local partners',
          'Highlight partner\'s local experience',
          'Show combined team capabilities',
          'Demonstrate local regulatory compliance'
        ]
      });
    }

    // Expertise match
    if (userProfile?.areas_of_expertise.some(area => 
      tender.description?.toLowerCase().includes(area.toLowerCase())
    )) {
      strategies.push({
        category: 'Value Proposition',
        icon: <CheckCircle className="h-4 w-4" />,
        priority: 'High',
        title: 'Leverage Core Expertise',
        description: 'Emphasize your specialized knowledge and experience in the tender\'s core requirements.',
        actions: [
          'Lead with expertise matching tender needs',
          'Provide relevant project examples',
          'Include team member certifications',
          'Showcase specialized tools and processes'
        ]
      });
    }

    // Timing strategy
    const deadline = tender.deadline ? new Date(tender.deadline) : null;
    const daysUntilDeadline = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    
    if (daysUntilDeadline && daysUntilDeadline < 14) {
      strategies.push({
        category: 'Timing',
        icon: <Clock className="h-4 w-4" />,
        priority: 'High',
        title: 'Expedited Proposal Strategy',
        description: 'Tight deadline requires focused approach and efficient resource allocation.',
        actions: [
          'Prioritize key sections of the proposal',
          'Use proven templates and past proposals',
          'Allocate dedicated team for proposal writing',
          'Schedule daily progress reviews'
        ]
      });
    }

    // Generic high-value strategies
    strategies.push({
      category: 'Competitive Advantage',
      icon: <Lightbulb className="h-4 w-4" />,
      priority: 'Medium',
      title: 'Value-Added Services',
      description: 'Differentiate your bid by offering additional value beyond basic requirements.',
      actions: [
        'Propose additional services at no extra cost',
        'Offer extended warranty or support',
        'Include training for client staff',
        'Provide ongoing maintenance options'
      ]
    });

    return strategies;
  };

  const strategies = getStrategyRecommendations();

  const getPriorityBadge = (priority: string) => {
    if (priority === 'High') return <Badge variant="destructive">High Priority</Badge>;
    if (priority === 'Medium') return <Badge variant="secondary">Medium Priority</Badge>;
    return <Badge variant="outline">Low Priority</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-primary" />
            Strategic Recommendations
          </CardTitle>
          <CardDescription>
            Tailored strategies to maximize your chances of winning {tender.title}
          </CardDescription>
        </CardHeader>
      </Card>

      {strategies.map((strategy, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                {strategy.icon}
                <div className="ml-2">
                  <CardTitle className="text-lg">{strategy.title}</CardTitle>
                  <Badge variant="outline" className="mt-1">{strategy.category}</Badge>
                </div>
              </div>
              {getPriorityBadge(strategy.priority)}
            </div>
            <CardDescription className="mt-2">
              {strategy.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Action Items:</h4>
              <ul className="space-y-2">
                {strategy.actions.map((action, actionIndex) => (
                  <li key={actionIndex} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Proposal Templates
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Partner Directory
            </Button>
            <Button variant="outline" className="justify-start">
              <CheckCircle className="mr-2 h-4 w-4" />
              Compliance Checklist
            </Button>
            <Button variant="outline" className="justify-start">
              <Clock className="mr-2 h-4 w-4" />
              Timeline Planner
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}