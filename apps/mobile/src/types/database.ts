export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.15';
  };
  public: {
    Tables: {
      body_metrics: {
        Row: {
          body_fat_percentage: number | null;
          created_at: string;
          id: string;
          local_date: string;
          recorded_at: string;
          updated_at: string;
          user_id: string;
          weight_kg: number;
        };
        Insert: {
          body_fat_percentage?: number | null;
          created_at?: string;
          id?: string;
          local_date?: string;
          recorded_at?: string;
          updated_at?: string;
          user_id: string;
          weight_kg: number;
        };
        Update: {
          body_fat_percentage?: number | null;
          created_at?: string;
          id?: string;
          local_date?: string;
          recorded_at?: string;
          updated_at?: string;
          user_id?: string;
          weight_kg?: number;
        };
        Relationships: [];
      };
      favorite_foods: {
        Row: {
          created_at: string;
          food_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          food_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          food_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'favorite_foods_food_id_fkey';
            columns: ['food_id'];
            isOneToOne: false;
            referencedRelation: 'foods';
            referencedColumns: ['id'];
          },
        ];
      };
      food_logs: {
        Row: {
          brand: string | null;
          calories: number;
          carbs_g: number;
          created_at: string;
          fat_g: number;
          fiber_g: number | null;
          food_id: string | null;
          food_name: string;
          id: string;
          item_quantity: number;
          logged_at: string;
          meal_type: string;
          portion_amount: number;
          portion_unit: string;
          protein_g: number;
          quantity: number;
          serving_calories: number;
          serving_carbs_g: number;
          serving_equivalent: number;
          serving_fat_g: number;
          serving_fiber_g: number | null;
          serving_protein_g: number;
          serving_size: number | null;
          serving_sodium_mg: number | null;
          serving_sugar_g: number | null;
          serving_unit: string | null;
          sodium_mg: number | null;
          sugar_g: number | null;
          user_id: string;
        };
        Insert: {
          brand?: string | null;
          calories: number;
          carbs_g: number;
          created_at?: string;
          fat_g: number;
          fiber_g?: number | null;
          food_id?: string | null;
          food_name: string;
          id?: string;
          item_quantity: number;
          logged_at?: string;
          meal_type: string;
          portion_amount: number;
          portion_unit: string;
          protein_g: number;
          quantity: number;
          serving_calories: number;
          serving_carbs_g: number;
          serving_equivalent: number;
          serving_fat_g: number;
          serving_fiber_g?: number | null;
          serving_protein_g: number;
          serving_size?: number | null;
          serving_sodium_mg?: number | null;
          serving_sugar_g?: number | null;
          serving_unit?: string | null;
          sodium_mg?: number | null;
          sugar_g?: number | null;
          user_id: string;
        };
        Update: {
          brand?: string | null;
          calories?: number;
          carbs_g?: number;
          created_at?: string;
          fat_g?: number;
          fiber_g?: number | null;
          food_id?: string | null;
          food_name?: string;
          id?: string;
          item_quantity?: number;
          logged_at?: string;
          meal_type?: string;
          portion_amount?: number;
          portion_unit?: string;
          protein_g?: number;
          quantity?: number;
          serving_calories?: number;
          serving_carbs_g?: number;
          serving_equivalent?: number;
          serving_fat_g?: number;
          serving_fiber_g?: number | null;
          serving_protein_g?: number;
          serving_size?: number | null;
          serving_sodium_mg?: number | null;
          serving_sugar_g?: number | null;
          serving_unit?: string | null;
          sodium_mg?: number | null;
          sugar_g?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'food_logs_food_id_fkey';
            columns: ['food_id'];
            isOneToOne: false;
            referencedRelation: 'foods';
            referencedColumns: ['id'];
          },
        ];
      };
      foods: {
        Row: {
          barcode: string | null;
          brand: string | null;
          calories: number;
          carbs_g: number;
          created_at: string;
          created_by: string | null;
          external_id: string | null;
          fat_g: number;
          fiber_g: number | null;
          id: string;
          name: string;
          protein_g: number;
          serving_size: number | null;
          serving_unit: string | null;
          sodium_mg: number | null;
          source: string;
          sugar_g: number | null;
          updated_at: string;
        };
        Insert: {
          barcode?: string | null;
          brand?: string | null;
          calories: number;
          carbs_g: number;
          created_at?: string;
          created_by?: string | null;
          external_id?: string | null;
          fat_g: number;
          fiber_g?: number | null;
          id?: string;
          name: string;
          protein_g: number;
          serving_size?: number | null;
          serving_unit?: string | null;
          sodium_mg?: number | null;
          source: string;
          sugar_g?: number | null;
          updated_at?: string;
        };
        Update: {
          barcode?: string | null;
          brand?: string | null;
          calories?: number;
          carbs_g?: number;
          created_at?: string;
          created_by?: string | null;
          external_id?: string | null;
          fat_g?: number;
          fiber_g?: number | null;
          id?: string;
          name?: string;
          protein_g?: number;
          serving_size?: number | null;
          serving_unit?: string | null;
          sodium_mg?: number | null;
          source?: string;
          sugar_g?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      nutrition_goals: {
        Row: {
          activity_level: string;
          carbs_g: number;
          created_at: string;
          daily_calories: number;
          fat_g: number;
          goal_type: string;
          id: string;
          is_active: boolean;
          protein_g: number;
          target_source: string;
          target_weight_kg: number | null;
          updated_at: string;
          user_id: string;
          weekly_rate_kg: number | null;
        };
        Insert: {
          activity_level: string;
          carbs_g: number;
          created_at?: string;
          daily_calories: number;
          fat_g: number;
          goal_type: string;
          id?: string;
          is_active?: boolean;
          protein_g: number;
          target_source?: string;
          target_weight_kg?: number | null;
          updated_at?: string;
          user_id: string;
          weekly_rate_kg?: number | null;
        };
        Update: {
          activity_level?: string;
          carbs_g?: number;
          created_at?: string;
          daily_calories?: number;
          fat_g?: number;
          goal_type?: string;
          id?: string;
          is_active?: boolean;
          protein_g?: number;
          target_source?: string;
          target_weight_kg?: number | null;
          updated_at?: string;
          user_id?: string;
          weekly_rate_kg?: number | null;
        };
        Relationships: [];
      };
      saved_meal_items: {
        Row: {
          brand: string | null;
          calories: number;
          carbs_g: number;
          created_at: string;
          fat_g: number;
          fiber_g: number | null;
          food_id: string | null;
          food_name: string;
          id: string;
          item_quantity: number;
          portion_amount: number;
          portion_unit: string;
          protein_g: number;
          quantity: number;
          saved_meal_id: string;
          serving_calories: number;
          serving_carbs_g: number;
          serving_equivalent: number;
          serving_fat_g: number;
          serving_fiber_g: number | null;
          serving_protein_g: number;
          serving_size: number | null;
          serving_sodium_mg: number | null;
          serving_sugar_g: number | null;
          serving_unit: string | null;
          sodium_mg: number | null;
          sort_order: number;
          sugar_g: number | null;
        };
        Insert: {
          brand?: string | null;
          calories: number;
          carbs_g: number;
          created_at?: string;
          fat_g: number;
          fiber_g?: number | null;
          food_id?: string | null;
          food_name: string;
          id?: string;
          item_quantity?: number;
          portion_amount: number;
          portion_unit: string;
          protein_g: number;
          quantity: number;
          saved_meal_id: string;
          serving_calories: number;
          serving_carbs_g: number;
          serving_equivalent: number;
          serving_fat_g: number;
          serving_fiber_g?: number | null;
          serving_protein_g: number;
          serving_size?: number | null;
          serving_sodium_mg?: number | null;
          serving_sugar_g?: number | null;
          serving_unit?: string | null;
          sodium_mg?: number | null;
          sort_order?: number;
          sugar_g?: number | null;
        };
        Update: {
          brand?: string | null;
          calories?: number;
          carbs_g?: number;
          created_at?: string;
          fat_g?: number;
          fiber_g?: number | null;
          food_id?: string | null;
          food_name?: string;
          id?: string;
          item_quantity?: number;
          portion_amount?: number;
          portion_unit?: string;
          protein_g?: number;
          quantity?: number;
          saved_meal_id?: string;
          serving_calories?: number;
          serving_carbs_g?: number;
          serving_equivalent?: number;
          serving_fat_g?: number;
          serving_fiber_g?: number | null;
          serving_protein_g?: number;
          serving_size?: number | null;
          serving_sodium_mg?: number | null;
          serving_sugar_g?: number | null;
          serving_unit?: string | null;
          sodium_mg?: number | null;
          sort_order?: number;
          sugar_g?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_meal_items_food_id_fkey';
            columns: ['food_id'];
            isOneToOne: false;
            referencedRelation: 'foods';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_meal_items_saved_meal_id_fkey';
            columns: ['saved_meal_id'];
            isOneToOne: false;
            referencedRelation: 'saved_meals';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_meals: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          current_weight_kg: number | null;
          date_of_birth: string | null;
          display_name: string | null;
          height_cm: number | null;
          id: string;
          onboarding_completed: boolean;
          preferred_unit_system: string;
          sex_for_calculation: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_weight_kg?: number | null;
          date_of_birth?: string | null;
          display_name?: string | null;
          height_cm?: number | null;
          id: string;
          onboarding_completed?: boolean;
          preferred_unit_system?: string;
          sex_for_calculation?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_weight_kg?: number | null;
          date_of_birth?: string | null;
          display_name?: string | null;
          height_cm?: number | null;
          id?: string;
          onboarding_completed?: boolean;
          preferred_unit_system?: string;
          sex_for_calculation?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_nutrition_onboarding: {
        Args: {
          p_activity_level: string;
          p_carbs_g: number;
          p_current_weight_kg: number;
          p_daily_calories: number;
          p_date_of_birth: string;
          p_fat_g: number;
          p_goal_type: string;
          p_height_cm: number;
          p_preferred_unit_system: string;
          p_protein_g: number;
          p_sex_for_calculation: string;
          p_target_weight_kg: number;
          p_weekly_rate_kg: number;
        };
        Returns: undefined;
      };
      replace_active_nutrition_goal: {
        Args: {
          p_carbs_g: number;
          p_daily_calories: number;
          p_fat_g: number;
          p_protein_g: number;
          p_target_source: string;
        };
        Returns: {
          activity_level: string;
          carbs_g: number;
          created_at: string;
          daily_calories: number;
          fat_g: number;
          goal_type: string;
          id: string;
          is_active: boolean;
          protein_g: number;
          target_source: string;
          target_weight_kg: number | null;
          updated_at: string;
          user_id: string;
          weekly_rate_kg: number | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'nutrition_goals';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      upsert_weight_check_in: {
        Args: {
          p_local_date: string;
          p_recorded_at: string;
          p_weight_kg: number;
        };
        Returns: {
          body_fat_percentage: number | null;
          created_at: string;
          id: string;
          local_date: string;
          recorded_at: string;
          updated_at: string;
          user_id: string;
          weight_kg: number;
        };
      };
      log_saved_meal: {
        Args: {
          p_meal_type: string;
          p_multiplier?: number;
          p_saved_meal_id: string;
        };
        Returns: {
          brand: string | null;
          calories: number;
          carbs_g: number;
          created_at: string;
          fat_g: number;
          fiber_g: number | null;
          food_id: string | null;
          food_name: string;
          id: string;
          item_quantity: number;
          logged_at: string;
          meal_type: string;
          portion_amount: number;
          portion_unit: string;
          protein_g: number;
          quantity: number;
          serving_calories: number;
          serving_carbs_g: number;
          serving_equivalent: number;
          serving_fat_g: number;
          serving_fiber_g: number | null;
          serving_protein_g: number;
          serving_size: number | null;
          serving_sodium_mg: number | null;
          serving_sugar_g: number | null;
          serving_unit: string | null;
          sodium_mg: number | null;
          sugar_g: number | null;
          user_id: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'food_logs';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
