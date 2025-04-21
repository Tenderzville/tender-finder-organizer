
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSampleTenders() {
  const { toast } = useToast();

  const createSampleTenders = async () => {
    try {
      console.log("Creating fallback sample tenders");
      const sampleTenders = [
        {
          title: "Emergency Fallback Tender",
          description: "This is a fallback tender created when normal data fetching failed.",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          category: "Emergency",
          location: "Nairobi"
        },
        {
          title: "Backup IT Services Tender",
          description: "Emergency IT services tender created as a fallback.",
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          category: "IT",
          location: "Nairobi",
          affirmative_action: { type: "youth", percentage: 30 }
        }
      ];
      
      const { data: createdData, error: createError } = await supabase
        .from('tenders')
        .insert(sampleTenders)
        .select();
        
      if (createError) {
        console.error("Error creating fallback tenders:", createError);
        throw createError;
      }
      
      return createdData;
    } catch (err) {
      console.error("Failed to create sample tenders:", err);
      toast({
        title: "Error",
        description: "Failed to create sample tenders",
        variant: "destructive"
      });
      return null;
    }
  };

  return { createSampleTenders };
}
