
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface TenderStatsProps {
  totalTenders: number;
  loading: boolean;
  lastUpdated: string | null;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  sources?: {name: string, count: number, status: string}[];
}

export function TenderStats({
  totalTenders,
  loading,
  lastUpdated,
  refreshing,
  onRefresh,
  sources = []
}: TenderStatsProps) {
  const formattedLastUpdated = lastUpdated ? 
    formatDistanceToNow(new Date(lastUpdated), { addSuffix: true }) : 
    "Never";

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Tender Statistics</CardTitle>
          <Badge variant={refreshing ? "outline" : "default"} className="whitespace-nowrap">
            {refreshing ? "Updating..." : `${totalTenders} Tenders`}
          </Badge>
        </div>
        <CardDescription>
          Real-time data from Kenyan procurement platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                {totalTenders > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                )}
                <span>{totalTenders > 0 ? 'Data sources synced' : 'No tenders found'}</span>
              </div>
              <span className="text-muted-foreground text-xs">
                Last update: {formattedLastUpdated}
              </span>
            </div>
            
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Browser AI Integration</span>
                <span className={totalTenders > 0 ? "text-green-600" : "text-amber-600"}>
                  {totalTenders > 0 ? "Active" : "Pending"}
                </span>
              </div>
              <Progress value={totalTenders > 0 ? 100 : 25} className="h-1" />
            </div>

            {sources && sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <h4 className="text-sm font-medium mb-2">Data Sources</h4>
                {sources.map((source, idx) => (
                  <div key={idx} className="flex justify-between text-xs mb-1">
                    <span>{source.name}</span>
                    <span className="font-medium">{source.count} tenders</span>
                  </div>
                ))}
              </div>
            )}

            {totalTenders === 0 && (
              <div className="mt-2 bg-amber-50 p-2 rounded text-xs text-amber-800">
                <p className="mb-1">No tenders found. Possible reasons:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Browser AI API key needs validation</li>
                  <li>Edge function execution error</li>
                  <li>External sources are unavailable</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1 flex justify-between">
        <button 
          onClick={onRefresh} 
          disabled={refreshing || loading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center"
        >
          {refreshing ? (
            <>
              <Clock className="h-3 w-3 mr-1 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <Clock className="h-3 w-3 mr-1" />
              Refresh Data
            </>
          )}
        </button>
        
        <Button variant="link" size="sm" className="p-0 h-auto" asChild>
          <a href="https://supabase.com/dashboard/project/ohnqfcbplmsypwnpxiga/functions/browser-ai-tenders/logs" target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-gray-500">
            View Logs <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
