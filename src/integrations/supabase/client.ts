
import { createClient } from '@supabase/supabase-js';

// Get environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Using fallback values for development.');
}

// Initialize the Supabase client with fallback values for development
export const supabase = createClient(
  supabaseUrl || "https://ohnqfcbplmsypwnpxiga.supabase.co", 
  supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obnFmY2JwbG1zeXB3bnB4aWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDMxOTksImV4cCI6MjA1MzYxOTE5OX0.XdGT0rLGPTMEm_u89mDpU1MJjCMFQqA_aPGkWndEBv0"
);
