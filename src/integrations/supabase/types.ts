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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      card_details: {
        Row: {
          brand: string | null
          card_number: string | null
          card_year: number | null
          condition: string | null
          created_at: string | null
          estimated_value: number | null
          grade: number | null
          grading_company: string | null
          id: string
          is_graded: boolean | null
          item_id: string
          last_price_update: string | null
          last_sale_date: string | null
          last_sale_price: number | null
          player_name: string | null
          price_trend_30d: number | null
          price_trend_7d: number | null
          set_name: string | null
          special_attributes: string[] | null
          sport: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          card_number?: string | null
          card_year?: number | null
          condition?: string | null
          created_at?: string | null
          estimated_value?: number | null
          grade?: number | null
          grading_company?: string | null
          id?: string
          is_graded?: boolean | null
          item_id: string
          last_price_update?: string | null
          last_sale_date?: string | null
          last_sale_price?: number | null
          player_name?: string | null
          price_trend_30d?: number | null
          price_trend_7d?: number | null
          set_name?: string | null
          special_attributes?: string[] | null
          sport?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          card_number?: string | null
          card_year?: number | null
          condition?: string | null
          created_at?: string | null
          estimated_value?: number | null
          grade?: number | null
          grading_company?: string | null
          id?: string
          is_graded?: boolean | null
          item_id?: string
          last_price_update?: string | null
          last_sale_date?: string | null
          last_sale_price?: number | null
          player_name?: string | null
          price_trend_30d?: number | null
          price_trend_7d?: number | null
          set_name?: string | null
          special_attributes?: string[] | null
          sport?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      card_pricing_cache: {
        Row: {
          average_sale_price: number | null
          brand: string | null
          card_key: string
          card_number: string | null
          card_year: number | null
          condition: string | null
          created_at: string | null
          estimated_value: number | null
          id: string
          is_graded: boolean | null
          last_ebay_fetch: string | null
          player_name: string | null
          sale_count: number | null
          set_name: string | null
          sport: string | null
          updated_at: string | null
        }
        Insert: {
          average_sale_price?: number | null
          brand?: string | null
          card_key: string
          card_number?: string | null
          card_year?: number | null
          condition?: string | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          is_graded?: boolean | null
          last_ebay_fetch?: string | null
          player_name?: string | null
          sale_count?: number | null
          set_name?: string | null
          sport?: string | null
          updated_at?: string | null
        }
        Update: {
          average_sale_price?: number | null
          brand?: string | null
          card_key?: string
          card_number?: string | null
          card_year?: number | null
          condition?: string | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          is_graded?: boolean | null
          last_ebay_fetch?: string | null
          player_name?: string | null
          sale_count?: number | null
          set_name?: string | null
          sport?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      detections: {
        Row: {
          bbox_height: number | null
          bbox_width: number | null
          bbox_x: number | null
          bbox_y: number | null
          confidence: number | null
          created_at: string
          id: string
          item_id: string
          label: string
        }
        Insert: {
          bbox_height?: number | null
          bbox_width?: number | null
          bbox_x?: number | null
          bbox_y?: number | null
          confidence?: number | null
          created_at?: string
          id?: string
          item_id: string
          label: string
        }
        Update: {
          bbox_height?: number | null
          bbox_width?: number | null
          bbox_x?: number | null
          bbox_y?: number | null
          confidence?: number | null
          created_at?: string
          id?: string
          item_id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "detections_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      email_tracking: {
        Row: {
          created_at: string
          email_type: string
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_type: string
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_type?: string
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          acquired_date: string | null
          back_image_url: string | null
          category: string | null
          cost: number | null
          created_at: string
          expiry_date: string | null
          id: string
          image_url: string | null
          location_id: string | null
          name: string
          quantity: number | null
          sold: boolean | null
          sold_date: string | null
          sold_price: number | null
          source_context: string | null
          user_id: string
        }
        Insert: {
          acquired_date?: string | null
          back_image_url?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          name: string
          quantity?: number | null
          sold?: boolean | null
          sold_date?: string | null
          sold_price?: number | null
          source_context?: string | null
          user_id: string
        }
        Update: {
          acquired_date?: string | null
          back_image_url?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          name?: string
          quantity?: number | null
          sold?: boolean | null
          sold_date?: string | null
          sold_price?: number | null
          source_context?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          name: string
          share_token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          name: string
          share_token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          name?: string
          share_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          alert_type: string
          card_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          threshold_amount: number | null
          threshold_percentage: number | null
          user_id: string
        }
        Insert: {
          alert_type: string
          card_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          threshold_amount?: number | null
          threshold_percentage?: number | null
          user_id: string
        }
        Update: {
          alert_type?: string
          card_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          threshold_amount?: number | null
          threshold_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_details"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          card_id: string
          condition: string | null
          created_at: string | null
          date_of_sale: string | null
          id: string
          price: number | null
          sale_url: string | null
          source: string
        }
        Insert: {
          card_id: string
          condition?: string | null
          created_at?: string | null
          date_of_sale?: string | null
          id?: string
          price?: number | null
          sale_url?: string | null
          source: string
        }
        Update: {
          card_id?: string
          condition?: string | null
          created_at?: string | null
          date_of_sale?: string | null
          id?: string
          price?: number | null
          sale_url?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_details"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_queue: {
        Row: {
          card_details_id: string
          card_key: string
          created_at: string | null
          error_message: string | null
          id: string
          priority: number | null
          processed_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          card_details_id: string
          card_key: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          card_details_id?: string
          card_key?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_queue_card_details_id_fkey"
            columns: ["card_details_id"]
            isOneToOne: false
            referencedRelation: "card_details"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_usage: {
        Row: {
          bonus_items: number
          created_at: string
          id: string
          items_detected: number
          period_end: string | null
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_items?: number
          created_at?: string
          id?: string
          items_detected?: number
          period_end?: string | null
          period_start: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_items?: number
          created_at?: string
          id?: string
          items_detected?: number
          period_end?: string | null
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_access: {
        Row: {
          granted_at: string
          id: string
          location_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          location_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          location_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_access_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_tier: Database["public"]["Enums"]["subscription_tier"]
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_tier?: Database["public"]["Enums"]["subscription_tier"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_tier?: Database["public"]["Enums"]["subscription_tier"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          card_id: string
          card_name: string | null
          created_at: string
          id: string
          player: string | null
          sport: string | null
          user_id: string
        }
        Insert: {
          card_id: string
          card_name?: string | null
          created_at?: string
          id?: string
          player?: string | null
          sport?: string | null
          user_id: string
        }
        Update: {
          card_id?: string
          card_name?: string | null
          created_at?: string
          id?: string
          player?: string | null
          sport?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_reminder_date: {
        Args: {
          p_interval_unit: string
          p_interval_value: number
          p_last_date: string
        }
        Returns: string
      }
      can_user_add_items: {
        Args: { p_item_count?: number; p_user_id: string }
        Returns: boolean
      }
      can_user_create_location: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      generate_card_key: {
        Args: {
          p_brand: string
          p_number: string
          p_player: string
          p_sport: string
          p_year: number
        }
        Returns: string
      }
      get_admin_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_item_limit: {
        Args: { tier: Database["public"]["Enums"]["subscription_tier"] }
        Returns: number
      }
      get_location_info: {
        Args: { p_location_id: string }
        Returns: {
          created_at: string
          gps_lat: number
          gps_lng: number
          id: string
          is_owner: boolean
          name: string
          user_id: string
        }[]
      }
      get_location_share_url: {
        Args: { p_location_id: string }
        Returns: string
      }
      get_onboarding_funnel: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_conversion: number
          active_users: number
          avg_scans_per_user: number
          completed_onboarding: number
          first_scan: number
          onboarding_conversion: number
          scan_conversion: number
          total_signups: number
        }[]
      }
      get_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          item_count: number
          location_count: number
          plan_tier: Database["public"]["Enums"]["subscription_tier"]
          scan_count: number
          user_id: string
        }[]
      }
      get_users_needing_reminders: {
        Args: Record<PropertyKey, never>
        Returns: {
          days_since_signup: number
          email: string
          has_items: boolean
          has_location: boolean
          last_email_type: string
          user_id: string
        }[]
      }
      grant_shared_access: {
        Args: { p_location_id: string; p_share_token: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_item_usage: {
        Args: { p_item_count?: number; p_user_id: string }
        Returns: boolean
      }
      user_has_location_access: {
        Args: { _location_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      subscription_tier: "free" | "starter" | "pro" | "power" | "investor"
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
      app_role: ["admin", "user"],
      subscription_tier: ["free", "starter", "pro", "power", "investor"],
    },
  },
} as const
