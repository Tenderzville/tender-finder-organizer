
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bell, Slack } from "lucide-react";
import { useIntegrationSettings } from "@/hooks/use-integration-settings";
import { useAuthState } from "@/hooks/useAuthState";

export const SlackNotifications = () => {
  const { isAuthenticated } = useAuthState();
  const [webhookUrl, setWebhookUrl] = useState("");
  const { toast } = useToast();
  
  // For demo purposes, using a mock user ID since auth isn't fully implemented
  const userId = isAuthenticated ? "demo-user-id" : undefined;
  const { getSettingByType, updateSetting, isUpdating } = useIntegrationSettings(userId);
  
  const slackSettings = getSettingByType('slack');
  const isConnected = slackSettings?.enabled || false;

  useEffect(() => {
    if (slackSettings?.settings?.webhook_url) {
      setWebhookUrl(slackSettings.settings.webhook_url);
    }
  }, [slackSettings]);

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
        // Save settings to database
        updateSetting({
          integration_type: 'slack',
          settings: { webhook_url: webhookUrl },
          enabled: true
        });
        
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

  const disconnectSlack = () => {
    updateSetting({
      integration_type: 'slack',
      settings: { webhook_url: '' },
      enabled: false
    });
    setWebhookUrl('');
    
    toast({
      title: "Slack Disconnected",
      description: "Slack notifications have been disabled",
    });
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Slack className="h-5 w-5" />
            Slack Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Please sign in to configure Slack notifications.</p>
        </CardContent>
      </Card>
    );
  }

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
        
        {isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-green-600">
              ✅ Slack notifications enabled. You'll receive alerts for new tenders and deadlines.
            </p>
            <Button 
              onClick={disconnectSlack}
              variant="outline"
              disabled={isUpdating}
              className="w-full"
            >
              Disconnect Slack
            </Button>
          </div>
        ) : (
          <Button 
            onClick={testSlackConnection}
            disabled={isUpdating}
            className="w-full"
          >
            <Bell className="h-4 w-4 mr-2" />
            Connect Slack
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
