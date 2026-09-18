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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          byte_size: number
          complaint_id: string
          created_at: string
          id: string
          kind: string
          mime_type: string
          source: string
          storage_key: string
        }
        Insert: {
          byte_size: number
          complaint_id: string
          created_at?: string
          id?: string
          kind?: string
          mime_type: string
          source?: string
          storage_key: string
        }
        Update: {
          byte_size?: number
          complaint_id?: string
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string
          source?: string
          storage_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_departments: {
        Row: {
          complaint_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          department_id: string
          id: string
          reason: string | null
          role: string
          source: string
        }
        Insert: {
          complaint_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          department_id: string
          id?: string
          reason?: string | null
          role: string
          source?: string
        }
        Update: {
          complaint_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          department_id?: string
          id?: string
          reason?: string | null
          role?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_departments_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_duplicates: {
        Row: {
          complaint_id: string
          created_at: string
          id: string
          reason: string | null
          related_complaint_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          similarity: number
          source: string
          state: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          id?: string
          reason?: string | null
          related_complaint_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity?: number
          source?: string
          state?: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          related_complaint_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity?: number
          source?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_duplicates_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_duplicates_related_complaint_id_fkey"
            columns: ["related_complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_updates: {
        Row: {
          actor_name: string | null
          complaint_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          status: string
        }
        Insert: {
          actor_name?: string | null
          complaint_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          status: string
        }
        Update: {
          actor_name?: string | null
          complaint_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_updates_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_verifications: {
        Row: {
          complaint_id: string
          created_at: string
          decision: string
          id: string
          note: string | null
          reviewer_id: string | null
          reviewer_name: string | null
        }
        Insert: {
          complaint_id: string
          created_at?: string
          decision: string
          id?: string
          note?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
        }
        Update: {
          complaint_id?: string
          created_at?: string
          decision?: string
          id?: string
          note?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_verifications_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          analysis_method: string
          analysis_notes: Json
          analysis_status: string
          category: string
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string
          device_accuracy_m: number | null
          device_lat: number | null
          device_lng: number | null
          device_observed_at: string | null
          due_date: string | null
          duplicate_suspect: boolean
          id: string
          integrity_acknowledged: boolean
          integrity_flag: string
          integrity_reasons: Json
          issue_lat: number | null
          issue_lng: number | null
          landmark: string | null
          language: string
          latitude: number | null
          location_policy_version: string
          location_text: string
          longitude: number | null
          priority: string
          priority_band: string | null
          priority_factors: Json
          priority_policy_version: string
          priority_score: number | null
          proximity_distance_m: number | null
          proximity_state: string
          reporter_contact: string | null
          reporter_name: string | null
          reporter_user_id: string | null
          resolution_note: string | null
          status: string
          suggested_category: string | null
          title: string
          tracking_code: string
          updated_at: string
        }
        Insert: {
          analysis_method?: string
          analysis_notes?: Json
          analysis_status?: string
          category: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description: string
          device_accuracy_m?: number | null
          device_lat?: number | null
          device_lng?: number | null
          device_observed_at?: string | null
          due_date?: string | null
          duplicate_suspect?: boolean
          id?: string
          integrity_acknowledged?: boolean
          integrity_flag?: string
          integrity_reasons?: Json
          issue_lat?: number | null
          issue_lng?: number | null
          landmark?: string | null
          language?: string
          latitude?: number | null
          location_policy_version?: string
          location_text: string
          longitude?: number | null
          priority?: string
          priority_band?: string | null
          priority_factors?: Json
          priority_policy_version?: string
          priority_score?: number | null
          proximity_distance_m?: number | null
          proximity_state?: string
          reporter_contact?: string | null
          reporter_name?: string | null
          reporter_user_id?: string | null
          resolution_note?: string | null
          status?: string
          suggested_category?: string | null
          title: string
          tracking_code: string
          updated_at?: string
        }
        Update: {
          analysis_method?: string
          analysis_notes?: Json
          analysis_status?: string
          category?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string
          device_accuracy_m?: number | null
          device_lat?: number | null
          device_lng?: number | null
          device_observed_at?: string | null
          due_date?: string | null
          duplicate_suspect?: boolean
          id?: string
          integrity_acknowledged?: boolean
          integrity_flag?: string
          integrity_reasons?: Json
          issue_lat?: number | null
          issue_lng?: number | null
          landmark?: string | null
          language?: string
          latitude?: number | null
          location_policy_version?: string
          location_text?: string
          longitude?: number | null
          priority?: string
          priority_band?: string | null
          priority_factors?: Json
          priority_policy_version?: string
          priority_score?: number | null
          proximity_distance_m?: number | null
          proximity_state?: string
          reporter_contact?: string | null
          reporter_name?: string | null
          reporter_user_id?: string | null
          resolution_note?: string | null
          status?: string
          suggested_category?: string | null
          title?: string
          tracking_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          id: string
          name_en: string
          name_hi: string
          name_mr: string
        }
        Insert: {
          code: string
          id?: string
          name_en: string
          name_hi: string
          name_mr: string
        }
        Update: {
          code?: string
          id?: string
          name_en?: string
          name_hi?: string
          name_mr?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      staff_departments: {
        Row: {
          created_at: string
          department_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "citizen"
        | "intake_officer"
        | "field_officer"
        | "supervisor"
        | "admin"
        | "auditor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "citizen",
        "intake_officer",
        "field_officer",
        "supervisor",
        "admin",
        "auditor",
      ],
    },
  },
} as const
