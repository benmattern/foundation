import { createClient } from "@supabase/supabase-js";
export async function requireCaller(request: Request) {
  const token = request.headers.get("authorization")?.replace(
    /^Bearer\s+/i,
    "",
  );
  if (!token) throw new Error("Authentication required.");
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false } },
  );
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Authentication required.");
  return data.user;
}
