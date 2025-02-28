
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export const ScraperStatus = () => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkScraperStatus = async () => {
    setIsChecking(true);
    setErrorMessage(null);
    
    try {
      // Check tenders in the database
      const { count: tenderCount, error: tenderError } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });
      
      if (tenderError) throw tenderError;
      
      // Get recent scraping logs
      const { data: logs, error: logsError } = await supabase
        .from('scraping_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (logsError) throw logsError;
      
      // Get a sample tender for inspection
      const { data: sampleTenders, error: sampleError } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (sampleError) throw sampleError;
      
      setDiagnosticData({
        tenderCount,
        recentLogs: logs || [],
        sampleTender: sampleTenders?.[0] || null
      });
      
      toast({
        title: "Diagnostic Complete",
        description: `Found ${tenderCount} tenders in the database.`,
      });
    } catch (error) {
      console.error("Diagnostic error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      toast({
        title: "Diagnostic Failed",
        description: "Could not complete diagnostics. See details for more information.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  const runScraper = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    
    try {
      toast({
        title: "Scraper Started",
        description: "Scraping new tenders. This may take up to 30 seconds...",
      });
      
      const { data, error } = await supabase.functions.invoke('scrape-tenders');
      
      if (error) throw error;
      
      console.log("Scraper response:", data);
      
      setDiagnosticData(prev => ({
        ...prev,
        scraperResult: data
      }));
      
      toast({
        title: "Scraper Completed",
        description: `Found ${data.tenders_scraped} new tenders. Database now has ${data.total_tenders} tenders.`,
      });
      
      // Refresh diagnostic data
      setTimeout(() => checkScraperStatus(), 1000);
    } catch (error) {
      console.error("Scraper error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      toast({
        title: "Scraper Failed",
        description: "Failed to run the scraper. See details for more information.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  // Initial check on load
  useEffect(() => {
    checkScraperStatus();
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tender Scraper Diagnostics</CardTitle>
        <CardDescription>
          Check the status of the tender scraper and database
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {isChecking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Checking system status...</span>
          </div>
        ) : diagnosticData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <div>
                <p className="font-medium">Tenders in Database</p>
                <p className="text-2xl font-bold">{diagnosticData.tenderCount}</p>
              </div>
              {diagnosticData.tenderCount > 0 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-500" />
              )}
            </div>
            
            {diagnosticData.sampleTender && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-md">
                <p className="font-medium">Sample Tender</p>
                <p className="font-bold">{diagnosticData.sampleTender.title}</p>
                <p className="text-sm text-gray-500">Category: {diagnosticData.sampleTender.category}</p>
                <p className="text-sm text-gray-500">Deadline: {new Date(diagnosticData.sampleTender.deadline).toLocaleDateString()}</p>
              </div>
            )}
            
            {diagnosticData.recentLogs && diagnosticData.recentLogs.length > 0 && (
              <div>
                <p className="font-medium mb-2">Recent Scraping Logs</p>
                <div className="overflow-auto max-h-48">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Source</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Found</th>
                        <th className="text-left p-2">Inserted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnosticData.recentLogs.map((log: any) => (
                        <tr key={log.id} className="border-b">
                          <td className="p-2">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="p-2">{log.source}</td>
                          <td className="p-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              log.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : log.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-2">{log.records_found || '-'}</td>
                          <td className="p-2">{log.records_inserted || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {diagnosticData.scraperResult && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="font-medium">Latest Scraper Run</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-sm text-gray-600">Sources Checked</p>
                    <p className="font-bold">{diagnosticData.scraperResult.sources_checked || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sources Successful</p>
                    <p className="font-bold">{diagnosticData.scraperResult.sources_successful || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tenders Scraped</p>
                    <p className="font-bold">{diagnosticData.scraperResult.tenders_scraped || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tenders Inserted</p>
                    <p className="font-bold">{diagnosticData.scraperResult.tenders_inserted || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
            <p>No diagnostic data available</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={checkScraperStatus}
          disabled={isChecking || isRunning}
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Checking...
            </>
          ) : (
            'Refresh Diagnostics'
          )}
        </Button>
        <Button 
          onClick={runScraper}
          disabled={isChecking || isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Running Scraper...
            </>
          ) : (
            'Run Scraper Now'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
