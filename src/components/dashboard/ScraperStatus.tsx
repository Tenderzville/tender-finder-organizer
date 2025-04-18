
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCw, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { ScraperSourceItem } from "./ScraperSourceItem";
import { ScraperDiagnostics } from "./ScraperDiagnostics";
import { useScraperStatus } from "@/hooks/use-scraper-status";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ScraperStatus() {
  const { status, isRefreshing, fetchStatus, renderRelativeTime, triggerScraper } = useScraperStatus();

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          Scraper Status
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={triggerScraper} 
            disabled={isRefreshing}
            className="h-8 px-2"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          </Button>
        </CardTitle>
        <CardDescription>
          Last run: {status.lastRun 
            ? renderRelativeTime(status.lastRun)
            : 'Never'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {status.sources.map((source, i) => (
            <ScraperSourceItem
              key={i}
              name={source.name}
              count={source.count}
              status={source.status}
            />
          ))}
        </div>
        
        <div className="mt-4 mb-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <span>API Layer Integration:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 cursor-help">
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      API Layer is used for advanced web scraping to collect tender data from various sources.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant={status.apiLayerConfigured ? "success" : "destructive"}>
              {status.apiLayerConfigured ? "Configured" : "Not Configured"}
            </Badge>
          </div>
        </div>
        
        {status.apiLayerStatus && (
          <Alert variant={status.apiLayerStatus.includes("working") ? "default" : "destructive"} className="mt-2 mb-3">
            {status.apiLayerStatus.includes("working") ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className="text-xs">
              {status.apiLayerStatus}
            </AlertDescription>
          </Alert>
        )}
        
        <ScraperDiagnostics diagnostics={status.diagnostics} />
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full text-sm text-center text-muted-foreground">
          Total: {status.tendersFound} tenders found ({status.agpoTendersFound} AGPO)
        </div>
      </CardFooter>
    </Card>
  );
}
