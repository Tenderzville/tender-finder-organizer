
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Share2, UserCheck, FileCheck, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PointsSystemProps {
  userId: string;
  language: 'en' | 'sw';
}

export const PointsSystem: React.FC<PointsSystemProps> = ({ userId, language }) => {
  const [points, setPoints] = useState<number>(0);
  const [level, setLevel] = useState<string>('Bronze');
  const [nextLevel, setNextLevel] = useState<string>('Silver');
  const [nextLevelPoints, setNextLevelPoints] = useState<number>(1000);
  const [loading, setLoading] = useState<boolean>(true);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const { toast } = useToast();

  const translations = {
    en: {
      title: "Your Points",
      description: "Earn points by completing actions and redeem them for premium features",
      level: "Current Level",
      next_level: "Next Level",
      remaining: "remaining to reach",
      history: "Points History",
      redeem: "Redeem Points",
      no_history: "No point transactions found",
      points_label: "Points",
      actions: {
        share: "Shared content",
        profile: "Completed profile",
        document: "Uploaded document",
        alert: "Set up alerts"
      }
    },
    sw: {
      title: "Pointi Zako",
      description: "Pata pointi kwa kukamilisha vitendo na uzitumie kupata huduma za ziada",
      level: "Kiwango cha Sasa",
      next_level: "Kiwango Kinachofuata",
      remaining: "zimesalia kufika",
      history: "Historia ya Pointi",
      redeem: "Tumia Pointi",
      no_history: "Hakuna rekodi za pointi zilizopatikana",
      points_label: "Pointi",
      actions: {
        share: "Umeshiriki maudhui",
        profile: "Umekamilisha wasifu",
        document: "Umepakia nyaraka",
        alert: "Umeanzisha arifa"
      }
    }
  };

  const t = translations[language];

  const levelThresholds = {
    Bronze: 0,
    Silver: 1000,
    Gold: 2500,
    Platinum: 5000,
    Diamond: 10000
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Bronze': return 'bg-amber-700';
      case 'Silver': return 'bg-slate-400';
      case 'Gold': return 'bg-yellow-500';
      case 'Platinum': return 'bg-blue-600';
      case 'Diamond': return 'bg-purple-600';
      default: return 'bg-gray-500';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'share': return <Share2 className="h-4 w-4" />;
      case 'profile': return <UserCheck className="h-4 w-4" />;
      case 'document': return <FileCheck className="h-4 w-4" />;
      case 'alert': return <Bell className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchUserPoints = async () => {
      setLoading(true);
      try {
        // Get user points
        const { data: userData, error: userError } = await supabase
          .from('user_profiles')
          .select('points')
          .eq('user_id', userId)
          .single();

        if (userError) throw userError;

        const userPoints = userData?.points || 0;
        setPoints(userPoints);

        // Determine user level
        let currentLevel = 'Bronze';
        let nextLevelPoints = 1000;
        let nextLevelName = 'Silver';

        for (const [levelName, threshold] of Object.entries(levelThresholds)) {
          if (userPoints >= threshold) {
            currentLevel = levelName;
          }
        }

        // Find next level
        const levels = Object.entries(levelThresholds).sort((a, b) => a[1] - b[1]);
        for (let i = 0; i < levels.length; i++) {
          if (levels[i][0] === currentLevel && i < levels.length - 1) {
            nextLevelName = levels[i+1][0];
            nextLevelPoints = levels[i+1][1];
            break;
          }
        }

        setLevel(currentLevel);
        setNextLevel(nextLevelName);
        setNextLevelPoints(nextLevelPoints);

        // Get points history
        const { data: historyData, error: historyError } = await supabase
          .from('points_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (historyError) throw historyError;
        setPointsHistory(historyData || []);

      } catch (error) {
        console.error('Error fetching points data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load points data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserPoints();
  }, [userId]);

  const progress = Math.min(
    100,
    nextLevelPoints > 0 
      ? Math.floor((points / nextLevelPoints) * 100) 
      : 100
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 animate-pulse rounded-md w-1/3"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded-md w-1/2"></div>
            <div className="h-8 bg-gray-200 animate-pulse rounded-md w-full"></div>
            <div className="h-16 bg-gray-200 animate-pulse rounded-md w-full"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">{t.level}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`${getLevelColor(level)} text-white`}>{level}</Badge>
                  <span className="text-2xl font-bold">{points} {t.points_label}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.next_level}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`${getLevelColor(nextLevel)} text-white`}>{nextLevel}</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-right">
                {nextLevelPoints - points} {t.points_label} {t.remaining} {nextLevel}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">{t.history}</h4>
              {pointsHistory.length > 0 ? (
                <div className="space-y-2">
                  {pointsHistory.map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div className="flex items-center space-x-2">
                        {getActionIcon(transaction.action_type)}
                        <span className="text-sm">
                          {t.actions[transaction.action_type as keyof typeof t.actions] || transaction.description}
                        </span>
                      </div>
                      <span className={`font-medium ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.no_history}</p>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          {t.redeem}
        </Button>
      </CardFooter>
    </Card>
  );
};
