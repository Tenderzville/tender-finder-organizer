
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

// Helper function to safely parse the JSON affirmative_action field from database
export function parseTenderAffirmativeAction(value: any): TenderAffirmativeAction {
  // Default value if parsing fails
  const defaultValue: TenderAffirmativeAction = { type: 'none' };
  
  if (!value) return defaultValue;
  
  try {
    // If it's already an object (not a string)
    if (typeof value === 'object') {
      // Validate that it has the required 'type' property
      if (value.type && 
          (value.type === 'youth' || 
           value.type === 'women' || 
           value.type === 'pwds' || 
           value.type === 'none')) {
        return value as TenderAffirmativeAction;
      }
      return defaultValue;
    }
    
    // If it's a string, try to parse it
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      if (parsed.type && 
          (parsed.type === 'youth' || 
           parsed.type === 'women' || 
           parsed.type === 'pwds' || 
           parsed.type === 'none')) {
        return parsed as TenderAffirmativeAction;
      }
    }
    
    return defaultValue;
  } catch (error) {
    console.error("Error parsing affirmative action:", error);
    return defaultValue;
  }
}
