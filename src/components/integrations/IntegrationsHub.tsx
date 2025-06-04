
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlackNotifications } from "./SlackNotifications";
import { DatabaseWebhooks } from "./DatabaseWebhooks";
import { CronScheduler } from "./CronScheduler";
import { Settings, Zap } from "lucide-react";

export const IntegrationsHub = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Integrations Hub
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications">
            <div className="space-y-6">
              <SlackNotifications />
              <DatabaseWebhooks />
            </div>
          </TabsContent>
          
          <TabsContent value="automation">
            <DatabaseWebhooks />
          </TabsContent>
          
          <TabsContent value="scheduling">
            <CronScheduler />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
