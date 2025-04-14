
import { RefreshCw } from "lucide-react";

export const TenderLoadingState = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-lg">Loading tenders...</span>
    </div>
  );
};
