import { createClient } from "@supabase/supabase-js";

/**
 * Initialize the Supabase client for real-time notifications.
 * These variables are pulled from the .env file.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const hasRealtimeConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasRealtimeConfig) {
  // Keep app boot resilient in local/dev when realtime env vars are not set.
  console.warn(
    "Supabase realtime is disabled: missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = hasRealtimeConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;
