
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";
import { useNotifications } from "@/hooks/use-notifications";

interface UserPreferences {
  push: boolean;
  email: boolean;
  categories?: string[];
  locations?: string[];
}

// Type guard to verify the shape of notification preferences
function isUserPreferences(data: unknown): data is UserPreferences {
  if (!data || typeof data !== 'object') return false;
  const pref = data as Record<string, unknown>;
  return typeof pref.push === 'boolean' && typeof pref.email === 'boolean';
}

export const TenderNotification = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuthState();
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  
  // For demo purposes, using a mock user ID since auth isn't fully implemented
  const userId = isAuthenticated ? "demo-user-id" : undefined;
  const { createNotification } = useNotifications(userId);

  // Fetch user preferences
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUserPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user found, skipping preferences fetch');
          return;
        }

        console.log('Fetching preferences for user:', user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }
        
        console.log('Fetched profile:', profile);
        
        if (!profile) {
          console.log('No profile found, using default preferences');
          // Set default preferences if no profile exists
          setUserPreferences({
            push: true,
            email: true,
            categories: [],
            locations: []
          });
          return;
        }
        
        // Validate preferences before setting them
        if (profile.notification_preferences && isUserPreferences(profile.notification_preferences)) {
          console.log('Setting valid preferences:', profile.notification_preferences);
          setUserPreferences(profile.notification_preferences);
        } else {
          console.error('Invalid notification preferences format:', profile.notification_preferences);
          // Set default preferences if invalid
          setUserPreferences({
            push: true,
            email: true,
            categories: [],
            locations: []
          });
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        toast({
          title: "Error",
          description: "Failed to load notification preferences. Using default settings.",
          variant: "destructive",
        });
      }
    };

    fetchUserPreferences();
  }, [isAuthenticated, toast]);

  // Set up real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !userPreferences || !userId) return;
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
            // Create notification in database
            createNotification({
              title: "New Tender Available!",
              message: `${tender.title} has been posted.`,
              type: 'info',
              tender_id: tender.id
            });

            // Show toast notification
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
            // Create notification in database
            createNotification({
              title: "Tender Updated",
              message: `${tender.title} has been updated.`,
              type: 'info',
              tender_id: tender.id
            });

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
  }, [toast, isAuthenticated, userPreferences, userId, createNotification]);

  return null; // This is a background component
};
