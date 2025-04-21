
import { supabase } from "@/integrations/supabase/client";
import { Tender } from "@/types/tender";
import { parseTenderAffirmativeAction } from "@/types/tender";

export async function fetchLatestTenders() {
  const { data: latestTenders, error: tendersError } = await supabase
    .from('tenders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (tendersError) {
    console.error("Error fetching tenders from database:", tendersError);
    throw tendersError;
  }

  return latestTenders?.map(tender => ({
    ...tender,
    affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action)
  })) || [];
}

export async function getTotalTendersCount() {
  const queryResult = await supabase
    .from('tenders')
    .select('*', { count: 'exact', head: true });
  
  if (queryResult.error) {
    console.error("Error counting tenders:", queryResult.error);
  }
  
  return queryResult.count || 0;
}
