
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCw } from "lucide-react";
import { ScraperSourceItem } from "./ScraperSourceItem";
import { ScraperDiagnostics } from "./ScraperDiagnostics";
import { useScraperStatus } from "@/hooks/use-scraper-status";

export function ScraperStatus() {
  const { status, isRefreshing, fetchStatus, renderRelativeTime } = useScraperStatus();

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          Scraper Status
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchStatus} 
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
