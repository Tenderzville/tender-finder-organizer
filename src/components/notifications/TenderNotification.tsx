import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";

export const TenderNotification = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuthState();

  useEffect(() => {
    if (!isAuthenticated) return;

    console.log("Setting up real-time tender notifications");
    
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
          toast({
            title: "New Tender Available!",
            description: `${payload.new.title} has been posted.`,
          });
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
          toast({
            title: "Tender Updated",
            description: `${payload.new.title} has been updated.`,
          });
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up tender notification subscription");
      supabase.removeChannel(channel);
    };
  }, [toast, isAuthenticated]);

  return null; // This is a background component
};