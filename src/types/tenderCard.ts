
import { TenderAffirmativeAction } from "@/types/tender";

export interface ShareAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface TenderCardProps {
  id: number;
  title: string;
  organization: string;
  deadline: string;
  category: string;
  value: string;
  location?: string;
  pointsRequired?: number;
  tender_url?: string | null;
  onViewDetails: () => void;
  hasAffirmativeAction?: boolean;
  affirmativeActionType?: 'youth' | 'women' | 'pwds' | 'none';
  language?: 'en' | 'sw';
  shareActions?: ShareAction[];
}
