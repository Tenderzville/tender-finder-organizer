
import { supabase } from "@/integrations/supabase/client";
import { Tender, parseTenderAffirmativeAction, getTenderStatus } from "@/types/tender";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function fetchLatestTendersOptimized(limit: number = 50): Promise<Tender[]> {
  const cacheKey = `tenders_${limit}`;
  const cached = getCachedData(cacheKey);
  
  if (cached) {
    console.log("Returning cached tender data");
    return cached;
  }

  console.log("Fetching fresh tender data from database...");
  
  try {
    // Optimized query with selective fields and proper indexing
    const { data: tenders, error } = await supabase
      .from('tenders')
      .select(`
        id,
        title,
        description,
        deadline,
        category,
        location,
        contact_info,
        tender_url,
        requirements,
        affirmative_action,
        points_required,
        source,
        created_at
      `)
      .neq('source', 'sample')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error fetching tenders:", error);
      throw error;
    }
    
    const processedTenders = (tenders || []).map(tender => ({
      ...tender,
      affirmative_action: parseTenderAffirmativeAction(tender.affirmative_action),
      status: getTenderStatus(tender.deadline)
    }));
    
    // Cache the results
    setCachedData(cacheKey, processedTenders);
    
    console.log(`Fetched and cached ${processedTenders.length} tenders`);
    return processedTenders;
  } catch (error) {
    console.error("Error in fetchLatestTendersOptimized:", error);
    return [];
  }
}

export async function getTotalTendersCountOptimized(): Promise<number> {
  const cacheKey = 'tender_count';
  const cached = getCachedData(cacheKey);
  
  if (cached !== null) {
    return cached;
  }

  try {
    const { count, error } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true })
      .neq('source', 'sample');
    
    if (error) {
      console.error("Error counting tenders:", error);
      throw error;
    }
    
    const totalCount = count || 0;
    setCachedData(cacheKey, totalCount);
    
    return totalCount;
  } catch (error) {
    console.error("Error in getTotalTendersCountOptimized:", error);
    return 0;
  }
}

// Clear cache function for manual refresh
export function clearTenderCache() {
  cache.clear();
  console.log("Tender cache cleared");
}

// Preload tenders in background
export async function preloadTenders() {
  try {
    console.log("Preloading tenders in background...");
    await fetchLatestTendersOptimized(20);
    await getTotalTendersCountOptimized();
  } catch (error) {
    console.error("Error preloading tenders:", error);
  }
}
