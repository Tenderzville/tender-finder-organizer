
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bell, Slack } from "lucide-react";

export const SlackNotifications = () => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const testSlackConnection = async () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter your Slack webhook URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "🎉 Tender Connect successfully connected to your Slack workspace!",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*Tender Connect Integration Test*\n✅ Your tender notifications are now set up!"
              }
            }
          ]
        }),
      });

      if (response.ok) {
        setIsConnected(true);
        localStorage.setItem('slack-webhook', webhookUrl);
        toast({
          title: "Slack Connected!",
          description: "You'll now receive tender notifications in Slack",
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Please check your webhook URL and try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Slack className="h-5 w-5" />
          Slack Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="https://hooks.slack.com/services/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            disabled={isConnected}
          />
        </div>
        <Button 
          onClick={testSlackConnection}
          disabled={isConnected}
          className="w-full"
        >
          <Bell className="h-4 w-4 mr-2" />
          {isConnected ? "Connected" : "Connect Slack"}
        </Button>
        {isConnected && (
          <p className="text-sm text-green-600">
            ✅ Slack notifications enabled. You'll receive alerts for new tenders and deadlines.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
