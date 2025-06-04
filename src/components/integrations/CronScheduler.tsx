
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const CronScheduler = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const { toast } = useToast();

  const schedules = [
    { name: "Tender Scraping", frequency: "Every 6 hours", description: "Fetch new tenders from sources" },
    { name: "Deadline Alerts", frequency: "Daily at 9 AM", description: "Send deadline reminders" },
    { name: "Data Cleanup", frequency: "Weekly", description: "Remove expired tenders" }
  ];

  const triggerManualRun = async () => {
    setIsRunning(true);
    toast({
      title: "Manual Sync Started",
      description: "Triggering tender data refresh...",
    });

    try {
      // Trigger the Browser AI fetch function
      const { data, error } = await supabase.functions.invoke('browser-ai-tenders/fetch-browser-ai');
      
      if (error) {
        throw error;
      }

      setLastRun(new Date().toLocaleString());
      toast({
        title: "Sync Completed",
        description: `Successfully updated tender data. ${data?.totalInserted || 0} new tenders added.`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to update tender data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Automated Scheduling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {schedules.map((schedule, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">{schedule.name}</div>
                <div className="text-sm text-gray-600">{schedule.description}</div>
              </div>
              <div className="text-right">
                <Badge variant="outline">{schedule.frequency}</Badge>
              </div>
            </div>
          ))}
        </div>

        <Button 
          onClick={triggerManualRun} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Trigger Manual Sync
            </>
          )}
        </Button>

        {lastRun && (
          <p className="text-sm text-gray-600">
            Last manual run: {lastRun}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
