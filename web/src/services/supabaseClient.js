import { createClient } from "@supabase/supabase-js";

/**
 * Initialize the Supabase client for real-time notifications.
 * These variables are pulled from the .env file or Vercel Environment Variables.
 * IMPORTANT: For Web, ensure these are prefixed with EXPO_PUBLIC_
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const hasRealtimeConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasRealtimeConfig) {
  // Enhanced diagnostic for the user
  const missing = [];
  if (!supabaseUrl) missing.push("EXPO_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  
  console.warn(
    `[Supabase] Realtime is DISABLED. Missing: ${missing.join(", ")}. \n` +
    "Please add these to your Vercel Environment Variables for the Web project."
  );
} else {
  console.log("[Supabase] Realtime initialized successfully.");
}

export const supabase = hasRealtimeConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;
