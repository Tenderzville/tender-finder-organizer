export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      discussions: {
        Row: {
          content: string
          created_at: string
          id: number
          points_earned: number | null
          tender_id: number | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          points_earned?: number | null
          tender_id?: number | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          points_earned?: number | null
          tender_id?: number | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussions_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          areas_of_expertise: string[] | null
          company_name: string
          id: string
          industry: string
          location: string
          notification_preferences: Json | null
          preferred_language: string | null
          premium_until: string | null
          total_points: number | null
          user_id: string | null
        }
        Insert: {
          areas_of_expertise?: string[] | null
          company_name: string
          id: string
          industry: string
          location: string
          notification_preferences?: Json | null
          preferred_language?: string | null
          premium_until?: string | null
          total_points?: number | null
          user_id?: string | null
        }
        Update: {
          areas_of_expertise?: string[] | null
          company_name?: string
          id?: string
          industry?: string
          location?: string
          notification_preferences?: Json | null
          preferred_language?: string | null
          premium_until?: string | null
          total_points?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      sponsored_ads: {
        Row: {
          cash_cost: number | null
          company_name: string
          created_at: string
          description: string
          end_date: string
          id: number
          image_url: string | null
          points_cost: number | null
          start_date: string
          status: string | null
          title: string
          website_url: string | null
        }
        Insert: {
          cash_cost?: number | null
          company_name: string
          created_at?: string
          description: string
          end_date: string
          id?: number
          image_url?: string | null
          points_cost?: number | null
          start_date: string
          status?: string | null
          title: string
          website_url?: string | null
        }
        Update: {
          cash_cost?: number | null
          company_name?: string
          created_at?: string
          description?: string
          end_date?: string
          id?: number
          image_url?: string | null
          points_cost?: number | null
          start_date?: string
          status?: string | null
          title?: string
          website_url?: string | null
        }
        Relationships: []
      }
      supplier_tender: {
        Row: {
          created_at: string | null
          id: number
          notified: boolean | null
          supplier_id: string | null
          tender_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          notified?: boolean | null
          supplier_id?: string | null
          tender_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: never
          notified?: boolean | null
          supplier_id?: string | null
          tender_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_tender_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_tender_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_url: string
          id: number
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_url: string
          id?: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_url?: string
          id?: number
          title?: string
        }
        Relationships: []
      }
      tender_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          rating: number | null
          tender_id: number | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: number
          rating?: number | null
          tender_id?: number | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: number
          rating?: number | null
          tender_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_reviews_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          category: string
          contact_info: string | null
          created_at: string | null
          deadline: string
          description: string
          fees: string | null
          id: number
          location: string
          prerequisites: string | null
          requirements: string
          subcategory: string | null
          tender_url: string | null
          title: string
        }
        Insert: {
          category?: string
          contact_info?: string | null
          created_at?: string | null
          deadline: string
          description: string
          fees?: string | null
          id?: never
          location?: string
          prerequisites?: string | null
          requirements: string
          subcategory?: string | null
          tender_url?: string | null
          title: string
        }
        Update: {
          category?: string
          contact_info?: string | null
          created_at?: string | null
          deadline?: string
          description?: string
          fees?: string | null
          id?: never
          location?: string
          prerequisites?: string | null
          requirements?: string
          subcategory?: string | null
          tender_url?: string | null
          title?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          ads_watched: number | null
          created_at: string
          id: number
          points: number | null
          referrals: number | null
          social_shares: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ads_watched?: number | null
          created_at?: string
          id?: number
          points?: number | null
          referrals?: number | null
          social_shares?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ads_watched?: number | null
          created_at?: string
          id?: number
          points?: number | null
          referrals?: number | null
          social_shares?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      social_shares: {
        Row: {
          id: number;
          user_id: string;
          platform: string;
          share_url: string;
          verified: boolean;
          created_at: string;
        }
        Insert: {
          user_id: string;
          platform: string;
          share_url: string;
          verified: boolean;
          created_at?: string;
        }
        Update: {
          user_id?: string;
          platform?: string;
          share_url?: string;
          verified?: boolean;
          created_at?: string;
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      remove_expired_tenders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_points: {
        Args: {
          user_id: string
          points_to_add: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface UserProfile {
  id: string;
  user_id: string;
  company_name: string;
  industry: string;
  location: string;
  areas_of_expertise: string[];
  notification_preferences: {
    push: boolean;
    email: boolean;
    categories?: string[];
    locations?: string[];
  };
  total_points: number;
}

export interface UserPoints {
  id: number;
  user_id: string;
  points: number;
  ads_watched: number;
  social_shares: number;
  created_at: string;
  updated_at: string;
}

export interface SavedTender {
  id: number;
  supplier_id: string;
  tender_id: number;
  notified: boolean;
  created_at: string;
}
