export type Tender = {
  id: number;
  title: string;
  description: string;
  requirements: string;
  deadline: string;
  contact_info: string | null;
  fees: string | null;
  prerequisites: string | null;
  created_at: string | null;
  category: string;
  subcategory: string | null;
  tender_url: string | null;
  location: string;
  points_required: number | null;
  affirmative_action?: TenderAffirmativeAction;
};

export type SavedTender = {
  id: number;
  title: string;
  deadline: string;
};

export type TenderReview = {
  id: number;
  tender_id: number | null;
  user_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
};

export type TenderAffirmativeAction = {
  type: 'youth' | 'women' | 'pwds' | 'none';
  percentage?: number;
  details?: string;
};

