
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TenderStatsProps {
  totalTenders: number;
  loading: boolean;
  lastUpdated: string | null;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

export function TenderStats({
  totalTenders,
  loading,
  lastUpdated,
  refreshing,
  onRefresh
}: TenderStatsProps) {
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
          Real-time data from Kenya procurement platforms
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
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                <span>Data sources synced</span>
              </div>
              <span className="text-muted-foreground text-xs">
                {lastUpdated ? `Last update: ${lastUpdated}` : "Not synced yet"}
              </span>
            </div>
            
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Browser AI Integration</span>
                <span className="text-green-600">Active</span>
              </div>
              <Progress value={100} className="h-1" />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1">
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
      </CardFooter>
    </Card>
  );
}
