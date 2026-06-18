export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      document_types: {
        Row: {
          default_lead_time_days: number
          display_order: number
          id: string
          is_active: boolean
          name_ar: string
        }
        Insert: {
          default_lead_time_days?: number
          display_order?: number
          id?: string
          is_active?: boolean
          name_ar: string
        }
        Update: {
          default_lead_time_days?: number
          display_order?: number
          id?: string
          is_active?: boolean
          name_ar?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          branch_id: string
          created_at: string
          document_type_id: string
          expiry_date: string | null
          file_path: string | null
          id: string
          is_not_applicable: boolean
          notes: string | null
          start_date: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          document_type_id: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          is_not_applicable?: boolean
          notes?: string | null
          start_date?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          document_type_id?: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          is_not_applicable?: boolean
          notes?: string | null
          start_date?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "v_branch_document_status"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "v_branch_document_status"
            referencedColumns: ["document_type_id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_document_types: {
        Row: {
          default_lead_time_days: number
          display_order: number
          id: string
          is_active: boolean
          name_ar: string
        }
        Insert: {
          default_lead_time_days?: number
          display_order?: number
          id?: string
          is_active?: boolean
          name_ar: string
        }
        Update: {
          default_lead_time_days?: number
          display_order?: number
          id?: string
          is_active?: boolean
          name_ar?: string
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string
          employee_document_type_id: string
          employee_id: string
          expiry_date: string | null
          file_path: string | null
          id: string
          is_not_applicable: boolean
          notes: string | null
          start_date: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          employee_document_type_id: string
          employee_id: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          is_not_applicable?: boolean
          notes?: string | null
          start_date?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          employee_document_type_id?: string
          employee_id?: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          is_not_applicable?: boolean
          notes?: string | null
          start_date?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_document_type_id_fkey"
            columns: ["employee_document_type_id"]
            isOneToOne: false
            referencedRelation: "employee_document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_employee_document_type_id_fkey"
            columns: ["employee_document_type_id"]
            isOneToOne: false
            referencedRelation: "v_employee_document_status"
            referencedColumns: ["employee_document_type_id"]
          },
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_document_status"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          branch_id: string
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          title: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          title?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "v_branch_document_status"
            referencedColumns: ["branch_id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          full_name: string
          id: string
          role: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          full_name: string
          id: string
          role: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "v_branch_document_status"
            referencedColumns: ["branch_id"]
          },
        ]
      }
      reminder_log: {
        Row: {
          channel: string
          entity_id: string
          entity_type: string
          id: string
          reminder_stage: string
          sent_at: string
        }
        Insert: {
          channel?: string
          entity_id: string
          entity_type: string
          id?: string
          reminder_stage: string
          sent_at?: string
        }
        Update: {
          channel?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reminder_stage?: string
          sent_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_branch_document_status: {
        Row: {
          branch_id: string | null
          branch_name: string | null
          display_order: number | null
          document_id: string | null
          document_type_id: string | null
          document_type_name_ar: string | null
          expiry_date: string | null
          file_path: string | null
          is_not_applicable: boolean | null
          notes: string | null
          start_date: string | null
          status: string | null
        }
        Relationships: []
      }
      v_employee_document_status: {
        Row: {
          branch_id: string | null
          display_order: number | null
          employee_document_id: string | null
          employee_document_type_id: string | null
          employee_document_type_name_ar: string | null
          employee_full_name: string | null
          employee_id: string | null
          employee_title: string | null
          expiry_date: string | null
          file_path: string | null
          is_not_applicable: boolean | null
          notes: string | null
          start_date: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "v_branch_document_status"
            referencedColumns: ["branch_id"]
          },
        ]
      }
    }
    Functions: {
      current_branch_id: { Args: never; Returns: string }
      current_role: { Args: never; Returns: string }
      is_legal_admin: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

