
import { Loader2 } from "lucide-react";

interface TenderListLoadingProps {
  loadingText: string;
}

export const TenderListLoading = ({ loadingText }: TenderListLoadingProps) => {
  return (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
      <span>{loadingText}</span>
    </div>
  );
};
