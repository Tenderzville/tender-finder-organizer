import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BidStrategy {
  id: string;
  user_id: string;
  tender_id: number;
  strategy_data: any;
  competitive_analysis: any;
  win_probability: number;
  estimated_cost: number;
  profit_margin: number;
  created_at: string;
  updated_at: string;
}

export function useBidStrategies(tenderId?: number) {
  const [strategies, setStrategies] = useState<BidStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStrategies = async () => {
    if (!tenderId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('bid_strategies')
        .select('*')
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStrategies(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bid strategies';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStrategy = async (
    tenderId: number,
    strategyData: any,
    competitiveAnalysis?: any,
    winProbability?: number,
    estimatedCost?: number,
    profitMargin?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bid_strategies')
        .upsert({
          user_id: user.id,
          tender_id: tenderId,
          strategy_data: strategyData,
          competitive_analysis: competitiveAnalysis,
          win_probability: winProbability,
          estimated_cost: estimatedCost,
          profit_margin: profitMargin,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Strategy Saved",
        description: "Your bid strategy has been saved successfully.",
      });

      fetchStrategies(); // Refresh the list
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save bid strategy';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteStrategy = async (strategyId: string) => {
    try {
      const { error } = await supabase
        .from('bid_strategies')
        .delete()
        .eq('id', strategyId);

      if (error) throw error;

      toast({
        title: "Strategy Deleted",
        description: "Bid strategy has been deleted successfully.",
      });

      fetchStrategies(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete bid strategy';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, [tenderId]);

  return {
    strategies,
    loading,
    error,
    saveStrategy,
    deleteStrategy,
    refetch: fetchStrategies
  };
}