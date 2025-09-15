export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      auth_logs: {
        Row: {
          created_at: string
          details: Json | null
          email: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          email?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          email?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bid_strategies: {
        Row: {
          competitive_analysis: Json | null
          created_at: string | null
          estimated_cost: number | null
          id: string
          profit_margin: number | null
          strategy_data: Json
          tender_id: number
          updated_at: string | null
          user_id: string
          win_probability: number | null
        }
        Insert: {
          competitive_analysis?: Json | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          profit_margin?: number | null
          strategy_data?: Json
          tender_id: number
          updated_at?: string | null
          user_id: string
          win_probability?: number | null
        }
        Update: {
          competitive_analysis?: Json | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          profit_margin?: number | null
          strategy_data?: Json
          tender_id?: number
          updated_at?: string | null
          user_id?: string
          win_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bid_strategies_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
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
      integration_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          integration_type: string
          settings: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          integration_type: string
          settings?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          integration_type?: string
          settings?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          tender_id: number | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          tender_id?: number | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          tender_id?: number | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tender_id_fkey"
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
          profile_visibility: string | null
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
          profile_visibility?: string | null
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
          profile_visibility?: string | null
          total_points?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notification_enabled: boolean | null
          search_criteria: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notification_enabled?: boolean | null
          search_criteria: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notification_enabled?: boolean | null
          search_criteria?: Json
          updated_at?: string | null
          user_id?: string
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
      security_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      tender_applications: {
        Row: {
          application_data: Json | null
          created_at: string | null
          id: string
          status: string | null
          submitted_at: string | null
          tender_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_data?: Json | null
          created_at?: string | null
          id?: string
          status?: string | null
          submitted_at?: string | null
          tender_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_data?: Json | null
          created_at?: string | null
          id?: string
          status?: string | null
          submitted_at?: string | null
          tender_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_applications_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
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
          procuring_entity: string | null
          requirements: string | null
          source: string | null
          subcategory: string | null
          tender_no: string | null
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
          procuring_entity?: string | null
          requirements?: string | null
          source?: string | null
          subcategory?: string | null
          tender_no?: string | null
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
          procuring_entity?: string | null
          requirements?: string | null
          source?: string | null
          subcategory?: string | null
          tender_no?: string | null
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
        Args: { tender_id: number }
        Returns: boolean
      }
      complete_scraping_job: {
        Args: { p_error_message?: string; p_job_id: string; p_status: string }
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
      log_data_access: {
        Args: {
          access_type: string
          accessing_user_id: string
          resource_id: string
        }
        Returns: boolean
      }
      remove_expired_tenders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_points: {
        Args: { points_to_add: number; user_id: string }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
