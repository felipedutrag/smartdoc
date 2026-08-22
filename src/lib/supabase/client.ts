import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vfxbhpihtykzfhvwwkuo.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmeGJocGlodHlremZodnd3a3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzU1OTIsImV4cCI6MjEwMjk1MTU5Mn0.TovKvIXpcvVkOW_Ssm8Has-tMlHxXKNB8STWHpnkdkk";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
