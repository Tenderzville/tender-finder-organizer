
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, Loader2, ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Navigation } from "@/components/Navigation";
import { UserProfile } from "@/types/user";

interface NotificationPreferences {
  push: boolean;
  email: boolean;
}

// Type guard to verify the shape of notification preferences
function isValidNotificationPreferences(data: unknown): data is NotificationPreferences {
  if (!data || typeof data !== 'object') return false;
  const pref = data as Record<string, unknown>;
  return typeof pref.push === 'boolean' && typeof pref.email === 'boolean';
}

const Preferences = () => {
  const navigate = useNavigate();

  const { data: preferences, isLoading, refetch } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      const defaultPreferences: NotificationPreferences = { push: true, email: true };
      
      if (!profile?.notification_preferences) {
        return defaultPreferences;
      }

      // Validate the preferences before returning
      return isValidNotificationPreferences(profile.notification_preferences)
        ? profile.notification_preferences
        : defaultPreferences;
    },
  });

  const updatePreferences = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newPreferences: NotificationPreferences = {
        ...(preferences || { push: true, email: true }),
        [key]: value,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: newPreferences,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved.",
      });

      refetch();
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              className="mr-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold">Notification Preferences</h1>
          </div>

          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-primary" />
                    <h2 className="text-lg font-medium">Push Notifications</h2>
                  </div>
                  <p className="text-sm text-gray-500">
                    Receive notifications about new tenders in your browser
                  </p>
                </div>
                <Switch
                  checked={preferences?.push || false}
                  onCheckedChange={(checked) => updatePreferences('push', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-primary" />
                    <h2 className="text-lg font-medium">Email Notifications</h2>
                  </div>
                  <p className="text-sm text-gray-500">
                    Receive updates about new tenders via email
                  </p>
                </div>
                <Switch
                  checked={preferences?.email || false}
                  onCheckedChange={(checked) => updatePreferences('email', checked)}
                />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Preferences;
