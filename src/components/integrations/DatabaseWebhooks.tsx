
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Webhook, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const DatabaseWebhooks = () => {
  const [isListening, setIsListening] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!isListening) return;

    const channel = supabase
      .channel('db-webhooks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenders'
        },
        (payload) => {
          console.log('Database event:', payload);
          setEvents(prev => [payload, ...prev.slice(0, 9)]);
          
          if (payload.eventType === 'INSERT') {
            const tender = payload.new;
            toast({
              title: "New Tender Added",
              description: `${tender.title} has been posted`,
            });

            // Send to Slack if connected
            const slackWebhook = localStorage.getItem('slack-webhook');
            if (slackWebhook) {
              sendSlackNotification(slackWebhook, tender);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isListening, toast]);

  const sendSlackNotification = async (webhookUrl: string, tender: any) => {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🆕 New Tender Available: ${tender.title}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${tender.title}*\n📍 ${tender.location}\n⏰ Deadline: ${new Date(tender.deadline).toLocaleDateString()}\n🏢 ${tender.procuring_entity || 'N/A'}`
              }
            }
          ]
        }),
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  };

  const toggleWebhooks = () => {
    setIsListening(!isListening);
    if (!isListening) {
      toast({
        title: "Database Webhooks Enabled",
        description: "Now listening for real-time tender updates",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Webhooks
          <Badge variant={isListening ? "default" : "outline"}>
            {isListening ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={toggleWebhooks} className="w-full">
          <Webhook className="h-4 w-4 mr-2" />
          {isListening ? "Stop Listening" : "Start Listening"}
        </Button>
        
        {events.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Events
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {events.map((event, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                  <span className="font-medium">{event.eventType}</span> on{" "}
                  <span className="text-blue-600">{event.table}</span>
                  {event.new?.title && (
                    <div className="text-xs text-gray-600 mt-1">
                      {event.new.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
