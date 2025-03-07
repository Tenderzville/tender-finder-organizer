import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";

export function ScraperStatus() {
  const [scraperStatus, setScraperStatus] = useState<{
    lastRun: string | null;
    status: 'idle' | 'running' | 'success' | 'failed';
    tendersFound: number;
    agpoTendersFound: number;
    sources: {name: string, count: number, status: string}[];
  }>({
    lastRun: null,
    status: 'idle',
    tendersFound: 0,
    agpoTendersFound: 0,
    sources: [
      { name: 'Tenders.go.ke', count: 0, status: 'idle' },
      { name: 'Private Sector', count: 0, status: 'idle' },
      { name: 'AGPO Tenders', count: 0, status: 'idle' }
    ]
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchScraperStatus();
  }, []);

  const fetchScraperStatus = async () => {
    try {
      // Fetch status from database
      const { data, error } = await supabase
        .from('scraper_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const log = data[0];

        // Count AGPO tenders
        const { data: agpoData } = await supabase
          .from('tenders')
          .select('count')
          .not('affirmative_action', 'is', null);

        setScraperStatus({
          lastRun: log.created_at,
          status: log.status,
          tendersFound: log.tenders_found || 0,
          agpoTendersFound: agpoData?.[0]?.count || 0,
          sources: [
            { 
              name: 'Tenders.go.ke', 
              count: log.sources?.find(s => s.name === 'tenders.go.ke')?.count || 0,
              status: log.sources?.find(s => s.name === 'tenders.go.ke')?.status || 'idle'
            },
            { 
              name: 'Private Sector', 
              count: log.sources?.find(s => s.name === 'private')?.count || 0,
              status: log.sources?.find(s => s.name === 'private')?.status || 'idle'
            },
            { 
              name: 'AGPO Tenders', 
              count: agpoData?.[0]?.count || 0,
              status: 'idle'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching scraper status:', error);
    }
  };

  const refreshScraperStatus = async () => {
    setIsRefreshing(true);
    await fetchScraperStatus();
    setIsRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Running <Loader2 className="ml-1 h-3 w-3 animate-spin" /></Badge>;
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Success <CheckCircle className="ml-1 h-3 w-3" /></Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Failed <AlertCircle className="ml-1 h-3 w-3" /></Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          Scraper Status
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshScraperStatus} 
            disabled={isRefreshing}
            className="h-8 px-2"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          </Button>
        </CardTitle>
        <CardDescription>
          Last run: {scraperStatus.lastRun 
            ? new Date(scraperStatus.lastRun).toLocaleString() 
            : 'Never'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scraperStatus.sources.map((source, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
              <span className="text-sm font-medium">{source.name}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm">{source.count} tenders</span>
                {getStatusBadge(source.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full text-sm text-center text-muted-foreground">
          Total: {scraperStatus.tendersFound} tenders found ({scraperStatus.agpoTendersFound} AGPO)
        </div>
      </CardFooter>
    </Card>
  );
}