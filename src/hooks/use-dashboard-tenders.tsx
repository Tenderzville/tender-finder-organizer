
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
      console.log("Fetching tenders from database without sample data creation...");
      
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
      
      // If no tenders are found, just set empty array
      if (!data || data.length === 0) {
        console.log("No tenders found in database");
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
