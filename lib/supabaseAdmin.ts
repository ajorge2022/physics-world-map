import { createClient } from "@supabase/supabase-js";
import type { Physicist } from "@/lib/types";

type PhysicistRow = Physicist & { edit_code_hash: string };
type PhysicistInsert = Partial<PhysicistRow> & {
  name: string;
  current_city: string;
  country: string;
  latitude: number;
  longitude: number;
  edit_code_hash: string;
};

type Database = {
  public: {
    Tables: {
      physicists: {
        Row: PhysicistRow;
        Insert: PhysicistInsert;
        Update: Partial<PhysicistRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function hasSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return Boolean(
    url &&
      serviceRoleKey &&
      !url.includes("your-project.supabase.co") &&
      serviceRoleKey !== "your-service-role-key"
  );
}
