
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tender, parseTenderAffirmativeAction } from "@/types/tender";

export function useDashboardTenders() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isLoadingTenders, setIsLoadingTenders] = useState(true);
  const [errorTenders, setErrorTenders] = useState<Error | null>(null);

  const fetchTenders = useCallback(async () => {
    setIsLoadingTenders(true);
    setErrorTenders(null);
    
    try {
      console.log("Fetching tenders from database...");
      
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching tenders:", error);
        throw new Error(error.message);
      }
      
      console.log(`Fetched ${data?.length || 0} tenders from database`);
      
      // If no tenders found, try to initialize sample data
      if (data?.length === 0) {
        console.log("No tenders found, trying to initialize sample data...");
        try {
          const { data: sampleData, error: sampleError } = await supabase.functions.invoke(
            'initialize-sample-data'
          );
          
          if (sampleError) {
            console.error("Error initializing sample data:", sampleError);
          } else {
            console.log("Sample data initialization response:", sampleData);
            
            // If sample data was created, fetch tenders again
            if (sampleData?.tendersCreated > 0) {
              const { data: freshData, error: freshError } = await supabase
                .from('tenders')
                .select('*')
                .order('created_at', { ascending: false });
                
              if (freshError) {
                console.error("Error fetching fresh tenders after initialization:", freshError);
              } else if (freshData?.length > 0) {
                const formattedTenders = freshData.map(tender => ({
                  ...tender,
                  affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action)
                }));
                
                setTenders(formattedTenders);
                return formattedTenders;
              }
            }
          }
        } catch (sampleErr) {
          console.error("Failed to initialize sample data:", sampleErr);
        }
      }
      
      // Transform the data to match the Tender type
      const formattedTenders = data?.map(tender => ({
        ...tender,
        affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action)
      })) || [];
      
      setTenders(formattedTenders);
      return formattedTenders;
    } catch (err) {
      console.error("Failed to fetch tenders:", err);
      setErrorTenders(err instanceof Error ? err : new Error("Failed to fetch tenders"));
      return [];
    } finally {
      setIsLoadingTenders(false);
    }
  }, []);

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
