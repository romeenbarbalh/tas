import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

function create() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return create();
  if (!_client) _client = create();
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase();
    if (!client) return () => {};
    return (client as Record<string | symbol, unknown>)[prop];
  },
});

// Return a fresh, validated access token. force-revalidates the session and
// refreshes the access token if expired (getSession alone returns a cached one).
export async function getAuthToken(): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  const session = await client.auth.getSession();
  return session.data.session?.access_token ?? null;
}
