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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          ai_reply: string | null
          created_at: string
          email: string
          form_type: string
          id: string
          message: string
          name: string
          reply_sent: boolean
          subject: string | null
        }
        Insert: {
          ai_reply?: string | null
          created_at?: string
          email: string
          form_type?: string
          id?: string
          message: string
          name: string
          reply_sent?: boolean
          subject?: string | null
        }
        Update: {
          ai_reply?: string | null
          created_at?: string
          email?: string
          form_type?: string
          id?: string
          message?: string
          name?: string
          reply_sent?: boolean
          subject?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_shared: boolean | null
          mode: string
          model: string | null
          share_id: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared?: boolean | null
          mode?: string
          model?: string | null
          share_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_shared?: boolean | null
          mode?: string
          model?: string | null
          share_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      deapi_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string | null
          last_used_at: string | null
          usage_count: number | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          last_used_at?: string | null
          usage_count?: number | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          last_used_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          id: string
          status: string
          subject: string
          to_email: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          subject: string
          to_email: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          subject?: string
          to_email?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      memories: {
        Row: {
          created_at: string
          id: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          images: string[] | null
          liked: boolean | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          images?: string[] | null
          liked?: boolean | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          images?: string[] | null
          liked?: boolean | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      model_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          model_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          model_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          model_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          app_credits: boolean
          app_generation: boolean
          app_referral: boolean
          app_system: boolean
          created_at: string
          email_low_balance: boolean
          email_newsletter: boolean
          email_transactions: boolean
          email_welcome: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_credits?: boolean
          app_generation?: boolean
          app_referral?: boolean
          app_system?: boolean
          created_at?: string
          email_low_balance?: boolean
          email_newsletter?: boolean
          email_transactions?: boolean
          email_welcome?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_credits?: boolean
          app_generation?: boolean
          app_referral?: boolean
          app_system?: boolean
          created_at?: string
          email_low_balance?: boolean
          email_newsletter?: boolean
          email_transactions?: boolean
          email_welcome?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_clients: {
        Row: {
          client_id: string
          client_secret_hash: string
          created_at: string | null
          id: string
          is_public: boolean | null
          logo_url: string | null
          name: string
          redirect_uris: string[]
          user_id: string
        }
        Insert: {
          client_id: string
          client_secret_hash: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          logo_url?: string | null
          name: string
          redirect_uris?: string[]
          user_id: string
        }
        Update: {
          client_id?: string
          client_secret_hash?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          logo_url?: string | null
          name?: string
          redirect_uris?: string[]
          user_id?: string
        }
        Relationships: []
      }
      oauth_codes: {
        Row: {
          client_id: string
          code: string
          created_at: string | null
          expires_at: string
          id: string
          redirect_uri: string
          scope: string | null
          used: boolean | null
          user_id: string
        }
        Insert: {
          client_id: string
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          redirect_uri: string
          scope?: string | null
          used?: boolean | null
          user_id: string
        }
        Update: {
          client_id?: string
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          redirect_uri?: string
          scope?: string | null
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          access_token: string
          client_id: string
          created_at: string | null
          expires_at: string
          id: string
          scope: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          scope?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          scope?: string | null
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          display_name: string | null
          id: string
          plan: string
          two_factor_enabled: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          id: string
          plan?: string
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          id?: string
          plan?: string
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          conversation_id: string | null
          created_at: string
          files_snapshot: Json | null
          fly_app_name: string | null
          fly_machine_id: string | null
          id: string
          name: string
          preview_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          files_snapshot?: Json | null
          fly_app_name?: string | null
          fly_machine_id?: string | null
          id?: string
          name?: string
          preview_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          files_snapshot?: Json | null
          fly_app_name?: string | null
          fly_machine_id?: string | null
          id?: string
          name?: string
          preview_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_earnings: {
        Row: {
          amount: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          source_action: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          source_action: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          source_action?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      rp_portal_settings: {
        Row: {
          created_at: string
          id: string
          notify_on_earning: boolean | null
          notify_on_signup: boolean | null
          payment_details: string | null
          payment_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_on_earning?: boolean | null
          notify_on_signup?: boolean | null
          payment_details?: string | null
          payment_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_on_earning?: boolean | null
          notify_on_signup?: boolean | null
          payment_details?: string | null
          payment_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rp_referral_clicks: {
        Row: {
          clicked_at: string
          country: string | null
          id: string
          ip_hash: string | null
          referral_code: string
          referrer_url: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          country?: string | null
          id?: string
          ip_hash?: string | null
          referral_code: string
          referrer_url?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          country?: string | null
          id?: string
          ip_hash?: string | null
          referral_code?: string
          referrer_url?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      service_incidents: {
        Row: {
          created_at: string
          id: string
          message: string | null
          resolved_at: string | null
          service_name: string
          started_at: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          service_name: string
          started_at?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          service_name?: string
          started_at?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      service_status: {
        Row: {
          checked_at: string
          error_message: string | null
          id: string
          response_time_ms: number | null
          service_name: string
          service_url: string
          status: string
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          service_name: string
          service_url: string
          status?: string
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          service_name?: string
          service_url?: string
          status?: string
        }
        Relationships: []
      }
      showcase_items: {
        Row: {
          aspect_ratio: string
          created_at: string
          display_order: number
          duration: string | null
          id: string
          media_type: string
          media_url: string
          model_id: string
          model_name: string
          prompt: string
          quality: string
          style: string | null
        }
        Insert: {
          aspect_ratio?: string
          created_at?: string
          display_order?: number
          duration?: string | null
          id?: string
          media_type?: string
          media_url: string
          model_id?: string
          model_name?: string
          prompt?: string
          quality?: string
          style?: string | null
        }
        Update: {
          aspect_ratio?: string
          created_at?: string
          display_order?: number
          duration?: string | null
          id?: string
          media_type?: string
          media_url?: string
          model_id?: string
          model_name?: string
          prompt?: string
          quality?: string
          style?: string | null
        }
        Relationships: []
      }
      status_subscribers: {
        Row: {
          channel: string
          contact: string
          created_at: string
          id: string
        }
        Insert: {
          channel?: string
          contact: string
          created_at?: string
          id?: string
        }
        Update: {
          channel?: string
          contact?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          payment_details: string
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          payment_details?: string
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          payment_details?: string
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      service_status_public: {
        Row: {
          checked_at: string | null
          response_time_ms: number | null
          service_name: string | null
          status: string | null
        }
        Insert: {
          checked_at?: string | null
          response_time_ms?: number | null
          service_name?: string | null
          status?: string | null
        }
        Update: {
          checked_at?: string | null
          response_time_ms?: number | null
          service_name?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_profile_update_safe_policy: {
        Args: { profile_row: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      deduct_credits: {
        Args: {
          p_action_type: string
          p_amount: number
          p_description?: string
          p_user_id: string
        }
        Returns: Json
      }
      mark_notifications_read: {
        Args: { p_notification_ids?: string[]; p_user_id: string }
        Returns: undefined
      }
      owns_conversation: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      update_profile_safe: {
        Args: {
          p_avatar_url?: string
          p_display_name?: string
          p_two_factor_enabled?: boolean
          p_user_id: string
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
