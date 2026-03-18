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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      departments: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      management_profiles: {
        Row: {
          bio: string | null
          created_at: string
          department_id: string | null
          id: string
          manager_user_id: string | null
          office_location: string | null
          onboarding_completed: boolean
          phone: string | null
          primary_team_id: string | null
          responsibilities: string[]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          manager_user_id?: string | null
          office_location?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          primary_team_id?: string | null
          responsibilities?: string[]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          manager_user_id?: string | null
          office_location?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          primary_team_id?: string | null
          responsibilities?: string[]
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_profiles_primary_team_id_fkey"
            columns: ["primary_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          client: string | null
          created_at: string
          created_by: string
          daily_rate: number | null
          description: string | null
          effort_days: number | null
          end_date: string | null
          experience_level: string | null
          id: string
          location: string | null
          project_id: string | null
          required_skills: string[]
          start_date: string | null
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          client?: string | null
          created_at?: string
          created_by: string
          daily_rate?: number | null
          description?: string | null
          effort_days?: number | null
          end_date?: string | null
          experience_level?: string | null
          id?: string
          location?: string | null
          project_id?: string | null
          required_skills?: string[]
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          client?: string | null
          created_at?: string
          created_by?: string
          daily_rate?: number | null
          description?: string | null
          effort_days?: number | null
          end_date?: string | null
          experience_level?: string | null
          id?: string
          location?: string | null
          project_id?: string | null
          required_skills?: string[]
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_applications: {
        Row: {
          applicant_user_id: string
          applied_at: string
          id: string
          opportunity_id: string
          resource_id: string | null
          status: string
        }
        Insert: {
          applicant_user_id: string
          applied_at?: string
          id?: string
          opportunity_id: string
          resource_id?: string | null
          status?: string
        }
        Update: {
          applicant_user_id?: string
          applied_at?: string
          id?: string
          opportunity_id?: string
          resource_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_applications_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          organization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          source_document_name: string | null
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          client?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          source_document_name?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          client?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          source_document_name?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposal_requirements: {
        Row: {
          created_at: string
          effort_days: number | null
          end_date: string | null
          experience_level: string | null
          id: string
          proposal_id: string
          required_skills: string[]
          role_name: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          effort_days?: number | null
          end_date?: string | null
          experience_level?: string | null
          id?: string
          proposal_id: string
          required_skills?: string[]
          role_name: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          effort_days?: number | null
          end_date?: string | null
          experience_level?: string | null
          id?: string
          proposal_id?: string
          required_skills?: string[]
          role_name?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_requirements_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          builder_mode: string
          client: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          linked_opportunity_id: string | null
          project_id: string | null
          status: string
          title: string
          total_budget: number | null
          updated_at: string
          uploaded_document_name: string | null
        }
        Insert: {
          builder_mode?: string
          client?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          linked_opportunity_id?: string | null
          project_id?: string | null
          status?: string
          title: string
          total_budget?: number | null
          updated_at?: string
          uploaded_document_name?: string | null
        }
        Update: {
          builder_mode?: string
          client?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          linked_opportunity_id?: string | null
          project_id?: string | null
          status?: string
          title?: string
          total_budget?: number | null
          updated_at?: string
          uploaded_document_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_linked_opportunity_id_fkey"
            columns: ["linked_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          ai_bid_ready_summary: string | null
          certifications: Json
          city: string | null
          contractual_status: string | null
          country: string | null
          created_at: string
          created_by: string
          division: string | null
          email: string | null
          fte_status: number | null
          full_name: string
          id: string
          line_manager: string | null
          monthly_availability: number | null
          organization: string | null
          pricing: Json
          profile_completeness: number | null
          profile_id: string | null
          quality_score: number | null
          reliability_score: number | null
          remote: boolean
          skills: Json
          tier: number | null
          title: string | null
          updated_at: string
          weekly_availability: number | null
        }
        Insert: {
          ai_bid_ready_summary?: string | null
          certifications?: Json
          city?: string | null
          contractual_status?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          division?: string | null
          email?: string | null
          fte_status?: number | null
          full_name: string
          id?: string
          line_manager?: string | null
          monthly_availability?: number | null
          organization?: string | null
          pricing?: Json
          profile_completeness?: number | null
          profile_id?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          remote?: boolean
          skills?: Json
          tier?: number | null
          title?: string | null
          updated_at?: string
          weekly_availability?: number | null
        }
        Update: {
          ai_bid_ready_summary?: string | null
          certifications?: Json
          city?: string | null
          contractual_status?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          division?: string | null
          email?: string | null
          fte_status?: number | null
          full_name?: string
          id?: string
          line_manager?: string | null
          monthly_availability?: number | null
          organization?: string | null
          pricing?: Json
          profile_completeness?: number | null
          profile_id?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          remote?: boolean
          skills?: Json
          tier?: number | null
          title?: string | null
          updated_at?: string
          weekly_availability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_by: string
          department_id: string | null
          id: string
          is_team_lead: boolean
          job_title: string | null
          joined_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_by: string
          department_id?: string | null
          id?: string
          is_team_lead?: boolean
          job_title?: string | null
          joined_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_by?: string
          department_id?: string | null
          id?: string
          is_team_lead?: boolean
          job_title?: string | null
          joined_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_selections: {
        Row: {
          builder_mode: string
          created_at: string
          daily_rate: number | null
          id: string
          match_reasons: Json
          match_score: number | null
          proposal_id: string
          requirement_id: string | null
          resource_id: string | null
          role_name: string
          selected: boolean
          total_cost: number | null
        }
        Insert: {
          builder_mode?: string
          created_at?: string
          daily_rate?: number | null
          id?: string
          match_reasons?: Json
          match_score?: number | null
          proposal_id: string
          requirement_id?: string | null
          resource_id?: string | null
          role_name: string
          selected?: boolean
          total_cost?: number | null
        }
        Update: {
          builder_mode?: string
          created_at?: string
          daily_rate?: number | null
          id?: string
          match_reasons?: Json
          match_score?: number | null
          proposal_id?: string
          requirement_id?: string | null
          resource_id?: string | null
          role_name?: string
          selected?: boolean
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_selections_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_selections_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "proposal_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_selections_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          id: string
          manager_user_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          id?: string
          manager_user_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          id?: string
          manager_user_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          department_id: string | null
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invite_token: string
          invited_by: string
          note: string | null
          organization: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          team_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invite_token?: string
          invited_by: string
          note?: string | null
          organization?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          team_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invite_token?: string
          invited_by?: string
          note?: string | null
          organization?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          team_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_first_admin: { Args: never; Returns: boolean }
      claim_pending_invitation: {
        Args: never
        Returns: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          department_id: string | null
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invite_token: string
          invited_by: string
          note: string | null
          organization: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          team_id: string | null
          title: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "workspace_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_management_profile: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_roles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "professional"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
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
    Enums: {
      app_role: ["admin", "manager", "professional"],
      invitation_status: ["pending", "accepted", "revoked", "expired"],
    },
  },
} as const
