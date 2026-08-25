export const prerender = false;

import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase admin not configured");
  return createClient(supabaseUrl, serviceKey);
}

async function verifyUser(request: Request) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  if (!supabaseUrl || !anonKey) return null;
  const supa = createClient(supabaseUrl, anonKey);
  const { data: { user }, error } = await supa.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export const GET: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  try {
    const supa = adminClient();
    const { data, error } = await supa.auth.admin.listUsers({ perPage: 100 });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data.users), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  try {
    const { email, password } = await request.json();
    if (!email || !password) return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400 });
    const supa = adminClient();
    const { data, error } = await supa.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data.user), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  try {
    const { id } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: "User ID required" }), { status: 400 });
    const supa = adminClient();
    const { error } = await supa.auth.admin.deleteUser(id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
