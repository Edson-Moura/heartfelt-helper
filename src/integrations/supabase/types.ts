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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievement_templates: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points_reward: number | null
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          points_reward?: number | null
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points_reward?: number | null
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      achievements: {
        Row: {
          achievement_template_id: string
          created_at: string
          id: string
          is_new: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_template_id: string
          created_at?: string
          id?: string
          is_new?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_template_id?: string
          created_at?: string
          id?: string
          is_new?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_achievement_template"
            columns: ["achievement_template_id"]
            isOneToOne: false
            referencedRelation: "achievement_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_achievements_template_id"
            columns: ["achievement_template_id"]
            isOneToOne: false
            referencedRelation: "achievement_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          severity: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          severity?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          severity?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bd_ativo: {
        Row: {
          created_at: string
          id: number
          num: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          num?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          num?: number | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_activities: {
        Row: {
          activity_date: string
          created_at: string
          id: string
          points_earned: number | null
          sentences_mastered: number | null
          sentences_practiced: number | null
          streak_maintained: boolean | null
          time_spent_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          created_at?: string
          id?: string
          points_earned?: number | null
          sentences_mastered?: number | null
          sentences_practiced?: number | null
          streak_maintained?: boolean | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          id?: string
          points_earned?: number | null
          sentences_mastered?: number | null
          sentences_practiced?: number | null
          streak_maintained?: boolean | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_type: string
          created_at: string | null
          description: string
          difficulty: string
          gems_reward: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          requirement_type: string
          requirement_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          created_at?: string | null
          description: string
          difficulty: string
          gems_reward?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          requirement_type: string
          requirement_value: number
          title: string
          xp_reward: number
        }
        Update: {
          challenge_type?: string
          created_at?: string | null
          description?: string
          difficulty?: string
          gems_reward?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          requirement_type?: string
          requirement_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          ai_interactions: number
          conversation_minutes: number
          conversations_count: number
          created_at: string
          date: string
          exercises_completed: number
          id: string
          lessons_completed: number
          pronunciation_checks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_interactions?: number
          conversation_minutes?: number
          conversations_count?: number
          created_at?: string
          date?: string
          exercises_completed?: number
          id?: string
          lessons_completed?: number
          pronunciation_checks?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_interactions?: number
          conversation_minutes?: number
          conversations_count?: number
          created_at?: string
          date?: string
          exercises_completed?: number
          id?: string
          lessons_completed?: number
          pronunciation_checks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ebook_leads: {
        Row: {
          created_at: string
          downloaded_at: string | null
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          downloaded_at?: string | null
          email: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          downloaded_at?: string | null
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lesson_progress_lesson_id"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_sentences: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          order_index: number
          sentence_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          order_index: number
          sentence_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          order_index?: number
          sentence_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lesson_sentences_lesson_id"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lesson_sentences_sentence_id"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "sentences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_sentences_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_sentences_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "sentences"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          level: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          level: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          body: string | null
          category: string
          error_message: string | null
          id: string
          metadata: Json | null
          notification_type: string
          sent_at: string | null
          success: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          sent_at?: string | null
          success?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          sent_at?: string | null
          success?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          achievement_notifications: boolean | null
          created_at: string | null
          daily_goal_reminders: boolean | null
          email_enabled: boolean | null
          id: string
          lesson_reminders: boolean | null
          push_enabled: boolean | null
          streak_reminders: boolean | null
          updated_at: string | null
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          achievement_notifications?: boolean | null
          created_at?: string | null
          daily_goal_reminders?: boolean | null
          email_enabled?: boolean | null
          id?: string
          lesson_reminders?: boolean | null
          push_enabled?: boolean | null
          streak_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          achievement_notifications?: boolean | null
          created_at?: string | null
          daily_goal_reminders?: boolean | null
          email_enabled?: boolean | null
          id?: string
          lesson_reminders?: boolean | null
          push_enabled?: boolean | null
          streak_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_summary?: boolean | null
        }
        Relationships: []
      }
      nps_responses: {
        Row: {
          category: string | null
          created_at: string
          feedback: string | null
          id: string
          score: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_level: number | null
          current_xp: number | null
          daily_goal: number | null
          display_name: string | null
          gems: number | null
          id: string
          last_activity: string | null
          learning_goal: string | null
          level: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          points: number | null
          preferred_training_mode: string | null
          proficiency_level: string | null
          streak_count: number | null
          streak_freezes_available: number | null
          total_phrases_learned: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_level?: number | null
          current_xp?: number | null
          daily_goal?: number | null
          display_name?: string | null
          gems?: number | null
          id?: string
          last_activity?: string | null
          learning_goal?: string | null
          level?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          points?: number | null
          preferred_training_mode?: string | null
          proficiency_level?: string | null
          streak_count?: number | null
          streak_freezes_available?: number | null
          total_phrases_learned?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_level?: number | null
          current_xp?: number | null
          daily_goal?: number | null
          display_name?: string | null
          gems?: number | null
          id?: string
          last_activity?: string | null
          learning_goal?: string | null
          level?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          points?: number | null
          preferred_training_mode?: string | null
          proficiency_level?: string | null
          streak_count?: number | null
          streak_freezes_available?: number | null
          total_phrases_learned?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          device_name: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          device_name?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          device_name?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sentences: {
        Row: {
          audio_url: string | null
          category: string | null
          created_at: string
          difficulty_score: number | null
          english_text: string
          id: string
          level: string
          portuguese_text: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          category?: string | null
          created_at?: string
          difficulty_score?: number | null
          english_text: string
          id?: string
          level: string
          portuguese_text: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          category?: string | null
          created_at?: string
          difficulty_score?: number | null
          english_text?: string
          id?: string
          level?: string
          portuguese_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          after: string | null
          age: number | null
          approved: boolean | null
          avatar_url: string | null
          before: string | null
          created_at: string
          days_using: number | null
          featured: boolean | null
          id: string
          image_url: string | null
          lessons_completed: number | null
          level_current: string | null
          level_start: string | null
          location: string | null
          name: string
          platform: string | null
          rating: number | null
          role: string | null
          text: string
          title: string
          updated_at: string
          user_id: string | null
          verified: boolean | null
          video_url: string | null
        }
        Insert: {
          after?: string | null
          age?: number | null
          approved?: boolean | null
          avatar_url?: string | null
          before?: string | null
          created_at?: string
          days_using?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          lessons_completed?: number | null
          level_current?: string | null
          level_start?: string | null
          location?: string | null
          name: string
          platform?: string | null
          rating?: number | null
          role?: string | null
          text: string
          title: string
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
          video_url?: string | null
        }
        Update: {
          after?: string | null
          age?: number | null
          approved?: boolean | null
          avatar_url?: string | null
          before?: string | null
          created_at?: string
          days_using?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          lessons_completed?: number | null
          level_current?: string | null
          level_start?: string | null
          location?: string | null
          name?: string
          platform?: string | null
          rating?: number | null
          role?: string | null
          text?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
          video_url?: string | null
        }
        Relationships: []
      }
      user_daily_challenges: {
        Row: {
          challenge_date: string
          challenge_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          progress: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenge_date?: string
          challenge_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenge_date?: string
          challenge_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          attempts: number | null
          correct_attempts: number | null
          created_at: string
          id: string
          last_practiced: string | null
          mastered_at: string | null
          sentence_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number | null
          correct_attempts?: number | null
          created_at?: string
          id?: string
          last_practiced?: string | null
          mastered_at?: string | null
          sentence_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number | null
          correct_attempts?: number | null
          created_at?: string
          id?: string
          last_practiced?: string | null
          mastered_at?: string | null
          sentence_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_progress_sentence_id"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "sentences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "sentences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      subscriber_status: {
        Row: {
          created_at: string | null
          subscribed: boolean | null
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          subscribed?: boolean | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          subscribed?: boolean | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_level: { Args: { xp: number }; Returns: number }
      initialize_lesson_progress_for_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      inserir_3x_e_parar: { Args: never; Returns: undefined }
      log_security_event:
        | {
            Args: { event_type: string; table_name: string; user_id?: string }
            Returns: undefined
          }
        | {
            Args: {
              action?: string
              event_type: string
              metadata?: Json
              new_data?: Json
              old_data?: Json
              severity?: string
              table_name: string
              user_id?: string
            }
            Returns: undefined
          }
      validate_subscriber_access: {
        Args: { target_user_id: string }
        Returns: boolean
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
