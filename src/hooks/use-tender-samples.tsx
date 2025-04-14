
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useTenderSamples() {
  const [isCreatingSamples, setIsCreatingSamples] = useState(false);
  const { toast } = useToast();

  const initializeSampleTenders = async () => {
    try {
      setIsCreatingSamples(true);
      
      // Create sample tenders if none exist
      console.log("Creating sample tenders...");
      const { data: existingTenders, error: checkError } = await supabase
        .from('tenders')
        .select('count', { count: 'exact', head: true });
        
      if (checkError) {
        console.error("Error checking tenders:", checkError);
        throw checkError;
      }
      
      // Properly handle the count response - it's returned as a number
      const tenderCount = existingTenders || 0;
      
      // If no tenders exist, create sample ones
      if (tenderCount === 0) {
        const sampleTenders = [
          {
            title: "Office Supplies Procurement",
            description: "Procurement of office supplies including stationery, printer cartridges, and office equipment.",
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            contact_info: "procurement@example.com",
            fees: "KES 50,000",
            prerequisites: "Must be a registered supplier.",
            category: "Supplies",
            location: "Nairobi",
            tender_url: "https://example.com/tenders/office-supplies"
          },
          {
            title: "IT Infrastructure Development",
            description: "Development of IT infrastructure including servers, networking, and security systems.",
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
            contact_info: "it@example.com",
            fees: "KES 2,000,000",
            prerequisites: "ISO 27001 certification required.",
            category: "IT",
            location: "Mombasa",
            tender_url: "https://example.com/tenders/it-infrastructure",
            affirmative_action: { type: "youth", percentage: 30 }
          }
        ];
        
        const { error: insertError } = await supabase
          .from('tenders')
          .insert(sampleTenders);
          
        if (insertError) {
          console.error("Error inserting sample tenders:", insertError);
          throw insertError;
        }
        
        toast({
          title: "Sample tenders created",
          description: "Created sample tenders for demonstration",
        });
      }

      return true;
    } catch (err) {
      console.error("Error initializing sample tenders:", err);
      toast({
        title: "Error",
        description: "Could not create sample tenders",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsCreatingSamples(false);
    }
  };

  return {
    initializeSampleTenders,
    isCreatingSamples
  };
}
