
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, HelpCircle } from 'lucide-react';

type TenderStatus = 'open' | 'closing_soon' | 'closed' | 'awarded' | 'unknown';

interface TenderStatusBadgeProps {
  status: TenderStatus;
  className?: string;
}

export function TenderStatusBadge({ status, className = '' }: TenderStatusBadgeProps) {
  switch (status) {
    case 'open':
      return (
        <Badge variant="secondary" className={`bg-green-100 text-green-800 hover:bg-green-200 ${className}`}>
          <CheckCircle className="h-3 w-3 mr-1" />
          Open
        </Badge>
      );
    case 'closing_soon':
      return (
        <Badge variant="secondary" className={`bg-amber-100 text-amber-800 hover:bg-amber-200 ${className}`}>
          <Clock className="h-3 w-3 mr-1" />
          Closing Soon
        </Badge>
      );
    case 'closed':
      return (
        <Badge variant="secondary" className={`bg-red-100 text-red-800 hover:bg-red-200 ${className}`}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          Closed
        </Badge>
      );
    case 'awarded':
      return (
        <Badge variant="secondary" className={`bg-blue-100 text-blue-800 hover:bg-blue-200 ${className}`}>
          <CheckCircle className="h-3 w-3 mr-1" />
          Awarded
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`${className}`}>
          <HelpCircle className="h-3 w-3 mr-1" />
          Unknown
        </Badge>
      );
  }
}
