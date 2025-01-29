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
      profiles: {
        Row: {
          areas_of_expertise: string[] | null
          company_name: string
          id: string
          industry: string
          location: string
          user_id: string | null
        }
        Insert: {
          areas_of_expertise?: string[] | null
          company_name: string
          id: string
          industry: string
          location: string
          user_id?: string | null
        }
        Update: {
          areas_of_expertise?: string[] | null
          company_name?: string
          id?: string
          industry?: string
          location?: string
          user_id?: string | null
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
          }
        ]
      }
      tenders: {
        Row: {
          id: number
          title: string
          description: string
          requirements: string
          deadline: string
          contact_info: string | null
          fees: string | null
          prerequisites: string | null
          created_at: string | null
          category: string
          subcategory: string | null
          tender_url: string | null
        }
        Insert: {
          id?: never
          title: string
          description: string
          requirements: string
          deadline: string
          contact_info?: string | null
          fees?: string | null
          prerequisites?: string | null
          created_at?: string | null
          category?: string
          subcategory?: string | null
          tender_url?: string | null
        }
        Update: {
          id?: never
          title?: string
          description?: string
          requirements?: string
          deadline?: string
          contact_info?: string | null
          fees?: string | null
          prerequisites?: string | null
          created_at?: string | null
          category?: string
          subcategory?: string | null
          tender_url?: string | null
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
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}