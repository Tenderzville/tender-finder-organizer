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
      scraping_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          max_retries: number
          priority: number
          retry_count: number
          source: string
          started_at: string | null
          status: string
          url: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          priority?: number
          retry_count?: number
          source: string
          started_at?: string | null
          status?: string
          url: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          priority?: number
          retry_count?: number
          source?: string
          started_at?: string | null
          status?: string
          url?: string
        }
        Relationships: []
      }
      scraping_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: number
          records_found: number | null
          records_inserted: number | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          records_found?: number | null
          records_inserted?: number | null
          source: string
          status: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          records_found?: number | null
          records_inserted?: number | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      scraping_results: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          tender_data: Json
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          tender_data: Json
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          tender_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "scraping_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scraping_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      social_shares: {
        Row: {
          created_at: string
          id: number
          platform: string
          share_url: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          id?: number
          platform: string
          share_url: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          id?: number
          platform?: string
          share_url?: string
          user_id?: string
          verified?: boolean | null
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
          affirmative_action: Json | null
          category: string
          contact_info: string | null
          created_at: string | null
          deadline: string
          description: string | null
          fees: string | null
          id: number
          last_scrape_attempt: string | null
          location: string
          parsing_error: string | null
          points_required: number | null
          prerequisites: string | null
          requirements: string | null
          subcategory: string | null
          tender_url: string | null
          title: string
        }
        Insert: {
          affirmative_action?: Json | null
          category?: string
          contact_info?: string | null
          created_at?: string | null
          deadline: string
          description?: string | null
          fees?: string | null
          id?: never
          last_scrape_attempt?: string | null
          location?: string
          parsing_error?: string | null
          points_required?: number | null
          prerequisites?: string | null
          requirements?: string | null
          subcategory?: string | null
          tender_url?: string | null
          title: string
        }
        Update: {
          affirmative_action?: Json | null
          category?: string
          contact_info?: string | null
          created_at?: string | null
          deadline?: string
          description?: string | null
          fees?: string | null
          id?: never
          last_scrape_attempt?: string | null
          location?: string
          parsing_error?: string | null
          points_required?: number | null
          prerequisites?: string | null
          requirements?: string | null
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
          facebook_shares: number | null
          id: number
          linkedin_shares: number | null
          points: number | null
          referrals: number | null
          social_shares: number | null
          twitter_shares: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ads_watched?: number | null
          created_at?: string
          facebook_shares?: number | null
          id?: number
          linkedin_shares?: number | null
          points?: number | null
          referrals?: number | null
          social_shares?: number | null
          twitter_shares?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ads_watched?: number | null
          created_at?: string
          facebook_shares?: number | null
          id?: number
          linkedin_shares?: number | null
          points?: number | null
          referrals?: number | null
          social_shares?: number | null
          twitter_shares?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_tender_access: {
        Args: {
          tender_id: number
        }
        Returns: boolean
      }
      complete_scraping_job: {
        Args: {
          p_job_id: string
          p_status: string
          p_error_message?: string
        }
        Returns: undefined
      }
      get_next_scraping_job: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          source: string
          url: string
        }[]
      }
      initialize_scraping_jobs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
