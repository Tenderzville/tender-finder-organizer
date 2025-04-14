
export type UserProfile = {
  id: string;
  user_id: string | null;
  company_name: string;
  industry: string;
  location: string;
  areas_of_expertise: string[] | null;
  preferred_language: string | null;
  notification_preferences: {
    push: boolean;
    email: boolean;
  } | null;
  premium_until: string | null;
  total_points: number | null;
  onboarding_completed?: boolean;
  user_type?: string;
};

export type UserPoints = {
  id: number;
  user_id: string | null;
  points: number | null;
  ads_watched: number | null;
  referrals: number | null;
  social_shares: number | null;
  facebook_shares: number | null;
  twitter_shares: number | null;
  linkedin_shares: number | null;
  created_at: string;
  updated_at: string;
};
