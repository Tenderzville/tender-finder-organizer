import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";

interface UserPreferences {
  push: boolean;
  email: boolean;
  categories?: string[];
  locations?: string[];
}

export const TenderNotification = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuthState();
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  // Fetch user preferences
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUserPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        console.log('Fetched user preferences:', profile?.notification_preferences);
        setUserPreferences(profile?.notification_preferences as UserPreferences);
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };

    fetchUserPreferences();
  }, [isAuthenticated]);

  // Set up real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !userPreferences) return;
    if (!userPreferences.push) {
      console.log('Push notifications are disabled for this user');
      return;
    }

    console.log("Setting up real-time tender notifications with preferences:", userPreferences);
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tenders'
        },
        (payload) => {
          console.log('New tender received:', payload);
          
          // Check if tender matches user preferences
          const tender = payload.new;
          const matchesCategory = !userPreferences.categories?.length || 
            userPreferences.categories.includes(tender.category);
          const matchesLocation = !userPreferences.locations?.length || 
            userPreferences.locations.includes(tender.location);

          if (matchesCategory && matchesLocation) {
            toast({
              title: "New Tender Available!",
              description: `${tender.title} has been posted.`,
            });
          } else {
            console.log('Tender does not match user preferences:', {
              tender,
              userPreferences
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tenders'
        },
        (payload) => {
          console.log('Tender updated:', payload);
          
          // Check if updated tender matches user preferences
          const tender = payload.new;
          const matchesCategory = !userPreferences.categories?.length || 
            userPreferences.categories.includes(tender.category);
          const matchesLocation = !userPreferences.locations?.length || 
            userPreferences.locations.includes(tender.location);

          if (matchesCategory && matchesLocation) {
            toast({
              title: "Tender Updated",
              description: `${tender.title} has been updated.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up tender notification subscription");
      supabase.removeChannel(channel);
    };
  }, [toast, isAuthenticated, userPreferences]);

  return null; // This is a background component
};