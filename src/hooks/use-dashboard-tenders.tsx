
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
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
      console.log("Fetching tenders from database...");
      
      // Directly fetch tenders from the database
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching tenders:", error);
        throw new Error(error.message);
      }
      
      console.log(`Successfully fetched ${data?.length || 0} tenders from database`);
      
      // If no tenders are found, try to fetch from Browser AI
      if (!data || data.length === 0) {
        console.log("No tenders found in database, trying Browser AI...");
        
        try {
          // Try to fetch tenders from Browser AI
          const { data: browserAIData, error: browserAIError } = await supabase.functions.invoke(
            'browser-ai-tenders/fetch-browser-ai'
          );
          
          if (browserAIError) {
            console.error("Error fetching from Browser AI:", browserAIError);
          } else if (browserAIData?.success) {
            console.log(`Successfully fetched ${browserAIData.inserted} tenders from Browser AI`);
            
            // Refresh tenders from database
            const { data: refreshedData, error: refreshError } = await supabase
              .from('tenders')
              .select('*')
              .order('created_at', { ascending: false });
              
            if (refreshError) {
              console.error("Error fetching refreshed tenders:", refreshError);
            } else if (refreshedData) {
              // Transform the data to match the Tender type
              const formattedTenders = refreshedData.map(tender => ({
                ...tender,
                affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action)
              }));
              
              setTenders(formattedTenders);
              setIsLoadingTenders(false);
              return;
            }
          }
        } catch (aiError) {
          console.error("Browser AI fetch error:", aiError);
        }
        
        // If we get here, set empty array
        setTenders([]);
        setIsLoadingTenders(false);
        return;
      }
      
      // Transform the data to match the Tender type
      const formattedTenders = data.map(tender => ({
        ...tender,
        affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action)
      }));
      
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
