
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tender, parseTenderAffirmativeAction } from "@/types/tender";
import { useToast } from "@/hooks/use-toast";

export function useDashboardTenders() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isLoadingTenders, setIsLoadingTenders] = useState(true);
  const [errorTenders, setErrorTenders] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchTenders = useCallback(async (): Promise<void> => {
    setIsLoadingTenders(true);
    setErrorTenders(null);
    
    try {
      console.log("Fetching tenders from database with improved error handling...");
      
      // First check if tenders exist
      const countResult = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });
        
      const count = countResult.count;
      
      console.log(`Database reports ${count} tenders available`);
      
      // If there are no tenders, try to force the scraper to run
      if (count === 0 || count === null) {
        console.log("No tenders found, attempting to force trigger scraper...");
        try {
          const { data, error } = await supabase.functions.invoke('scrape-tenders', {
            body: { 
              force: true, 
              useApiLayer: true,
              fullScrape: true,
              skipCache: true,
              verboseLogging: true
            }
          });
          
          if (error) {
            console.error("Error triggering scraper:", error);
          } else {
            console.log("Scraper triggered successfully:", data);
            toast({
              title: "Scraper triggered",
              description: "Fetching latest tenders from source...",
            });
            
            // Wait a moment for scraping to complete
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (err) {
          console.error("Error triggering scraper:", err);
        }
      }
      
      // Now fetch all tenders (even if scraper just ran or not)
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching tenders:", error);
        throw new Error(error.message);
      }
      
      console.log(`Successfully fetched ${data?.length || 0} tenders from database`);
      
      // If no tenders found after scraper attempt, create sample tenders
      if (!data || data.length === 0) {
        console.log("Still no tenders found, creating sample tenders directly");
        try {
          const sampleTenders = [
            {
              title: "Emergency Office Supplies Procurement",
              description: "Procurement of office supplies including stationery, printer cartridges, and office equipment.",
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              contact_info: "procurement@example.com",
              fees: "KES 50,000",
              prerequisites: "Must be a registered supplier.",
              category: "Supplies",
              location: "Nairobi",
              tender_url: "https://example.com/tenders/office-supplies"
            },
            {
              title: "Critical IT Infrastructure Development",
              description: "Development of IT infrastructure including servers, networking, and security systems.",
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              contact_info: "it@example.com",
              fees: "KES 2,000,000",
              prerequisites: "ISO 27001 certification required.",
              category: "IT",
              location: "Mombasa",
              tender_url: "https://example.com/tenders/it-infrastructure",
              affirmative_action: { type: "youth", percentage: 30 }
            },
            {
              title: "Urgent Road Construction Project",
              description: "Construction of a 5km tarmac road including drainage systems and street lighting.",
              deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
              contact_info: "infrastructure@example.com",
              fees: "KES 50,000,000",
              prerequisites: "Must have completed at least 3 similar projects.",
              category: "Construction",
              location: "Kisumu",
              tender_url: "https://example.com/tenders/road-construction"
            }
          ];
          
          const { data: createdSamples, error: createError } = await supabase
            .from('tenders')
            .insert(sampleTenders)
            .select();
            
          if (createError) {
            console.error("Error creating sample tenders:", createError);
          } else {
            console.log(`Successfully created ${createdSamples.length} sample tenders`);
            toast({
              title: "Sample tenders created",
              description: `Added ${createdSamples.length} sample tenders to get you started`,
            });
            
            // Transform the data to match the Tender type
            const formattedSamples = createdSamples.map(tender => ({
              ...tender,
              affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action)
            }));
            
            setTenders(formattedSamples);
            setIsLoadingTenders(false);
            return;
          }
        } catch (createErr) {
          console.error("Failed to create sample tenders:", createErr);
        }
      }
      
      // Transform the data to match the Tender type
      const formattedTenders = data?.map(tender => ({
        ...tender,
        affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action)
      })) || [];
      
      setTenders(formattedTenders);
    } catch (err) {
      console.error("Failed to fetch tenders:", err);
      setErrorTenders(err instanceof Error ? err : new Error("Failed to fetch tenders"));
    } finally {
      setIsLoadingTenders(false);
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    fetchTenders();
  }, [fetchTenders]);

  return {
    tenders,
    isLoadingTenders,
    errorTenders,
    fetchTenders
  };
}
