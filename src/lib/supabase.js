import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.https://edvvwnaxmjuvwnxineph.supabase.co;
const supabaseAnonKey = import.meta.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdnZ3bmF4bWp1dndueGluZXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDI2OTIsImV4cCI6MjEwMjkxODY5Mn0.Izbapo0CVHY3L1594cuviuVWGEi3D3rxEn_kzqmwgUw;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
