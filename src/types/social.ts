export type SocialShare = {
  id: number;
  user_id: string;
  platform: string;
  share_url: string;
  verified: boolean | null;
  created_at: string;
};

export type SponsoredAd = {
  id: number;
  title: string;
  description: string;
  company_name: string;
  image_url: string | null;
  website_url: string | null;
  points_cost: number | null;
  cash_cost: number | null;
  start_date: string;
  end_date: string;
  created_at: string;
  status: string | null;
};