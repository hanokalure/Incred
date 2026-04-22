import { createClient } from "@supabase/supabase-js";

/**
 * Initialize the Supabase client for real-time notifications.
 * These variables are pulled from the .env file.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
