
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, RotateCw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/lib/supabase-client";
import { formatDistanceToNow } from "date-fns";

export function ScraperStatus() {
  const [scraperStatus, setScraperStatus] = useState<{
    lastRun: string | null;
    status: 'idle' | 'running' | 'success' | 'failed';
    tendersFound: number;
    agpoTendersFound: number;
    sources: {name: string, count: number, status: string}[];
    diagnostics: any | null;
  }>({
    lastRun: null,
    status: 'idle',
    tendersFound: 0,
    agpoTendersFound: 0,
    sources: [
      { name: 'Tenders.go.ke', count: 0, status: 'idle' },
      { name: 'Private Sector', count: 0, status: 'idle' },
      { name: 'AGPO Tenders', count: 0, status: 'idle' }
    ],
    diagnostics: null
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    fetchScraperStatus();
  }, []);

  const fetchScraperStatus = async () => {
    try {
      // Try to call the check-scraper-status edge function
      try {
        const { data: functionData, error: functionError } = await supabase.functions.invoke('check-scraper-status');
        
        if (!functionError && functionData) {
          console.log("Received data from check-scraper-status function:", functionData);
          
          // Update status with data from the function
          setScraperStatus({
            lastRun: functionData.last_check || null,
            status: functionData.scraper_available ? 'idle' : 'failed',
            tendersFound: functionData.total_tenders || 0,
            agpoTendersFound: 0, // We'll calculate this separately
            sources: [
              { 
                name: 'Tenders.go.ke', 
                count: functionData.latest_tenders?.filter((t: any) => t.source === 'tenders.go.ke')?.length || 0,
                status: functionData.scraper_available ? 'idle' : 'failed'
              },
              { 
                name: 'Private Sector', 
                count: functionData.latest_tenders?.filter((t: any) => t.source === 'private')?.length || 0,
                status: functionData.scraper_available ? 'idle' : 'failed'
              },
              { 
                name: 'AGPO Tenders', 
                count: functionData.latest_tenders?.filter((t: any) => 
                  t.affirmative_action && t.affirmative_action.type !== 'none')?.length || 0,
                status: functionData.scraper_available ? 'idle' : 'failed'
              }
            ],
            diagnostics: functionData.diagnostics || null
          });
          
          return;
        }
      } catch (e) {
        console.error("Error invoking check-scraper-status function:", e);
      }

      // Fallback: Fetch status from database directly
      const { data, error } = await supabase
        .from('scraping_logs')
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
          status: log.status === 'success' ? 'success' : 
                  log.status === 'in_progress' ? 'running' : 
                  log.status === 'error' ? 'failed' : 'idle',
          tendersFound: log.records_found || 0,
          agpoTendersFound: agpoData?.[0]?.count || 0,
          sources: [
            { 
              name: 'Tenders.go.ke', 
              count: log.source === 'tenders.go.ke' ? (log.records_found || 0) : 0,
              status: log.source === 'tenders.go.ke' ? log.status : 'idle'
            },
            { 
              name: 'Private Sector', 
              count: log.source === 'private' ? (log.records_found || 0) : 0,
              status: log.source === 'private' ? log.status : 'idle'
            },
            { 
              name: 'AGPO Tenders', 
              count: agpoData?.[0]?.count || 0,
              status: 'idle'
            }
          ],
          diagnostics: null
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
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Running <Loader2 className="ml-1 h-3 w-3 animate-spin" /></Badge>;
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Success <CheckCircle className="ml-1 h-3 w-3" /></Badge>;
      case 'failed':
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Failed <AlertCircle className="ml-1 h-3 w-3" /></Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  const renderRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return new Date(dateString).toLocaleString();
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
            ? renderRelativeTime(scraperStatus.lastRun)
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
        
        {/* Diagnostics Collapsible Section */}
        {scraperStatus.diagnostics && (
          <Collapsible 
            open={showDiagnostics} 
            onOpenChange={setShowDiagnostics}
            className="mt-4 border-t pt-2"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center w-full justify-between">
                <span className="flex items-center">
                  <Terminal className="h-4 w-4 mr-2" />
                  Diagnostics
                </span>
                <span className="text-xs text-muted-foreground">
                  {showDiagnostics ? 'Hide' : 'Show'}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="text-xs p-2 bg-slate-50 rounded text-slate-700 font-mono">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(scraperStatus.diagnostics).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-semibold">{key.replace(/_/g, ' ')}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full text-sm text-center text-muted-foreground">
          Total: {scraperStatus.tendersFound} tenders found ({scraperStatus.agpoTendersFound} AGPO)
        </div>
      </CardFooter>
    </Card>
  );
}
