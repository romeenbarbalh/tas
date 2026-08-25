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

// GET /api/availability?date=2026-08-25
export const GET: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    if (!date) return new Response(JSON.stringify({ error: "date required" }), { status: 400 });

    const supa = adminClient();
    const { data, error } = await supa
      .from("availability")
      .select("*")
      .eq("slot_date", date)
      .order("barber")
      .order("slot_time");

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// PUT /api/availability  — toggle single slot
// body: { barber, slot_date, slot_time, is_available }
export const PUT: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await request.json();
    const { barber, slot_date, slot_time, is_available } = body;
    if (!barber || !slot_date || !slot_time) {
      return new Response(JSON.stringify({ error: "barber, slot_date, slot_time required" }), { status: 400 });
    }

    const supa = adminClient();

    // Upsert the slot
    const { data, error } = await supa
      .from("availability")
      .upsert(
        { barber, slot_date, slot_time, is_available },
        { onConflict: "barber,slot_date,slot_time" }
      )
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// POST /api/availability — bulk set (copy day, etc.)
// body: { slots: [{ barber, slot_date, slot_time, is_available }] }
export const POST: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await request.json();
    const { slots } = body;
    if (!Array.isArray(slots) || slots.length === 0) {
      return new Response(JSON.stringify({ error: "slots array required" }), { status: 400 });
    }

    const supa = adminClient();
    const { data, error } = await supa
      .from("availability")
      .upsert(slots, { onConflict: "barber,slot_date,slot_time" })
      .select();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// DELETE /api/availability — delete all slots for a date (or date+barber)
// body: { slot_date, barber? }
export const DELETE: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await request.json();
    const { slot_date, barber } = body;
    if (!slot_date) return new Response(JSON.stringify({ error: "slot_date required" }), { status: 400 });

    const supa = adminClient();
    let query = supa.from("availability").delete().eq("slot_date", slot_date);
    if (barber) query = query.eq("barber", barber);
    const { error } = await query;

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
