
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  totalRequests: number;
  errorCount: number;
  lastUpdate: string;
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      // Get performance metrics from the last 24 hours
      const { data: perfData, error: perfError } = await supabase
        .from('performance_logs')
        .select('duration_ms, operation')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: apiData, error: apiError } = await supabase
        .from('api_request_logs')
        .select('duration_ms, success')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: errorData, error: errorError } = await supabase
        .from('error_logs')
        .select('id')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (perfError || apiError || errorError) {
        console.error('Error fetching metrics:', { perfError, apiError, errorError });
        return;
      }

      const allRequests = [...(perfData || []), ...(apiData || [])];
      const totalRequests = allRequests.length;
      const successfulRequests = (apiData || []).filter(req => req.success).length;
      const averageResponseTime = totalRequests > 0 
        ? allRequests.reduce((sum, req) => sum + (req.duration_ms || 0), 0) / totalRequests 
        : 0;

      setMetrics({
        averageResponseTime: Math.round(averageResponseTime),
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
        totalRequests,
        errorCount: (errorData || []).length,
        lastUpdate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      toast({
        title: "Monitoring Error",
        description: "Failed to fetch performance metrics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    isLoading,
    refetch: fetchMetrics
  };
}
