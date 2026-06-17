/**
 * Supabase database types.
 *
 * PLACEHOLDER — this file is regenerated from the live schema once the Supabase
 * project exists, via:
 *   supabase gen types typescript --project-id <id> > src/types/supabase.ts
 * (or the `generate_typescript_types` MCP tool). Until then a permissive shape
 * keeps the client typed without blocking the build.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<
      string,
      {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      }
    >;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
  };
}
