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
      branches: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          id: string
          is_main: boolean
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          id?: string
          is_main?: boolean
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          id?: string
          is_main?: boolean
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          tax_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          tax_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          tax_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          branch_id: string | null
          business_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          order_count: number
          phone: string | null
          total_spent: number
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          order_count?: number
          phone?: string | null
          total_spent?: number
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          order_count?: number
          phone?: string | null
          total_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          branch_id: string
          id: string
          low_stock_threshold: number
          product_id: string
          quantity: number
        }
        Insert: {
          branch_id: string
          id?: string
          low_stock_threshold?: number
          product_id: string
          quantity?: number
        }
        Update: {
          branch_id?: string
          id?: string
          low_stock_threshold?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          custom_name: string | null
          custom_price: number | null
          discount: number
          id: string
          notes: string | null
          order_id: string
          product_id: string | null
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          custom_name?: string | null
          custom_price?: number | null
          discount?: number
          id?: string
          notes?: string | null
          order_id: string
          product_id?: string | null
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          custom_name?: string | null
          custom_price?: number | null
          discount?: number
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string
          discount: number
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          payment_status: string
          status: string
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          discount?: number
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string
          payment_status?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          discount?: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          business_id: string
          category_id: string | null
          cost_price: number
          created_at: string
          id: string
          image_url: string | null
          name: string
          selling_price: number
          sku: string | null
          status: string
          tags: string[] | null
          tax_rate: number
        }
        Insert: {
          barcode?: string | null
          business_id: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          selling_price?: number
          sku?: string | null
          status?: string
          tags?: string[] | null
          tax_rate?: number
        }
        Update: {
          barcode?: string | null
          business_id?: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          selling_price?: number
          sku?: string | null
          status?: string
          tags?: string[] | null
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          business_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          business_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          business_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
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
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_purchases: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
          purchase_date: string
          purchase_price: number
          quantity: number
          vendor_id: string | null
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
          purchase_date?: string
          purchase_price?: number
          quantity: number
          vendor_id?: string | null
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          purchase_date?: string
          purchase_price?: number
          quantity?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_purchases_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_purchases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_purchases_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
      vendors: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_remove_staff: {
        Args: { _target_user_id: string }
        Returns: undefined
      }
      admin_update_staff: {
        Args: {
          _branch_id?: string
          _full_name?: string
          _role?: Database["public"]["Enums"]["app_role"]
          _status?: string
          _target_user_id: string
        }
        Returns: undefined
      }
      check_invitation: { Args: { _email: string }; Returns: boolean }
      get_user_branch_id: { Args: { _user_id: string }; Returns: string }
      get_user_business_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
      setup_business: {
        Args: {
          _branch_name: string
          _business_address: string
          _business_email: string
          _business_name: string
          _business_phone: string
          _user_full_name: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "cashier"
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
      app_role: ["admin", "manager", "cashier"],
    },
  },
} as const
