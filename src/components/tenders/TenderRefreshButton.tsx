
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface TenderRefreshButtonProps {
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  label?: string;
  refreshingLabel?: string;
}

export const TenderRefreshButton = ({
  isRefreshing,
  onRefresh,
  label = "Refresh Tenders",
  refreshingLabel = "Refreshing..."
}: TenderRefreshButtonProps) => {
  return (
    <Button 
      variant="outline" 
      onClick={onRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? refreshingLabel : label}
    </Button>
  );
};
