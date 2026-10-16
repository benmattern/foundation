import { supabase } from "../lib/supabaseClient";
export const getSession = () => supabase.auth.getSession();
export const observeAuth = (callback: () => void) =>
  supabase.auth.onAuthStateChange(callback).data.subscription;
export const signOut = () => supabase.auth.signOut();
export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
