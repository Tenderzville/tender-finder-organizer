
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ScraperSourceItemProps {
  name: string;
  count: number;
  status: string;
}

export function ScraperSourceItem({ name, count, status }: ScraperSourceItemProps) {
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

  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium">{name}</span>
      <div className="flex items-center space-x-2">
        <span className="text-sm">{count} tenders</span>
        {getStatusBadge(status)}
      </div>
    </div>
  );
}
