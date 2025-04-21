
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export const checkScraperStatus = async () => {
  const { data, error } = await supabase.functions.invoke('check-scraper-status');
  if (error) throw error;
  return data;
};

export const forceTriggerScraper = async () => {
  const { data, error } = await supabase.functions.invoke('scrape-tenders', {
    body: { 
      force: true,
      useApiLayer: true 
    }
  });
  
  if (error) throw error;
  return { success: true, data };
};

export const renderRelativeTime = (dateString: string | null) => {
  if (!dateString) return 'Never';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (error) {
    return new Date(dateString).toLocaleString();
  }
};

export const getSourcesStatus = (data: any) => {
  return [
    { 
      name: 'Tenders.go.ke', 
      count: data?.latest_tenders?.filter((t: any) => t.source === 'tenders.go.ke')?.length || 0,
      status: data?.scraper_available ? 'idle' : 'failed'
    },
    { 
      name: 'Private Sector', 
      count: data?.latest_tenders?.filter((t: any) => t.source === 'private')?.length || 0,
      status: data?.scraper_available ? 'idle' : 'failed'
    },
    { 
      name: 'AGPO Tenders', 
      count: data?.latest_tenders?.filter((t: any) => 
        t.affirmative_action && t.affirmative_action.type !== 'none')?.length || 0,
      status: data?.scraper_available ? 'idle' : 'failed'
    }
  ];
};
