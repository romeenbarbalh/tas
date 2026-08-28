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

// GET /api/schedule — returns salon hours + all stylist schedules + days off
export const GET: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const supa = adminClient();
    const [hoursRes, schedRes, daysOffRes] = await Promise.all([
      supa.from("salon_hours").select("*").order("day_of_week"),
      supa.from("stylist_schedule").select("*"),
      supa.from("stylist_days_off").select("*").order("off_date", { ascending: false }),
    ]);
    if (hoursRes.error) return new Response(JSON.stringify({ error: hoursRes.error.message }), { status: 400 });
    if (schedRes.error) return new Response(JSON.stringify({ error: schedRes.error.message }), { status: 400 });
    if (daysOffRes.error) return new Response(JSON.stringify({ error: daysOffRes.error.message }), { status: 400 });

    return new Response(JSON.stringify({
      hours: hoursRes.data,
      schedule: schedRes.data,
      daysOff: daysOffRes.data,
    }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// PUT /api/schedule — set salon hours for a day
// body: { type: "salon", day_of_week, open_time, close_time, is_closed }
export const PUT: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await request.json();
    const supa = adminClient();

    if (body.type === "salon") {
      const { day_of_week, open_time, close_time, is_closed } = body;
      if (day_of_week === undefined) return new Response(JSON.stringify({ error: "day_of_week required" }), { status: 400 });
      const { data, error } = await supa
        .from("salon_hours")
        .upsert({ day_of_week, open_time, close_time, is_closed }, { onConflict: "day_of_week" })
        .select()
        .single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify(data), { status: 200 });
    }

    if (body.type === "stylist-schedule") {
      const { barber, day_of_week, start_time, end_time, is_working } = body;
      if (!barber || day_of_week === undefined) return new Response(JSON.stringify({ error: "barber and day_of_week required" }), { status: 400 });
      const { data, error } = await supa
        .from("stylist_schedule")
        .upsert({ barber, day_of_week, start_time, end_time, is_working }, { onConflict: "barber,day_of_week" })
        .select()
        .single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify(data), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), { status: 400 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// POST /api/schedule — add day off (or bulk schedules)
// body: { type: "days-off", barber, off_date, reason } | { type: "days-off-bulk", items }
export const POST: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await request.json();
    const supa = adminClient();

    if (body.type === "days-off") {
      const { barber, off_date, reason } = body;
      if (!barber || !off_date) return new Response(JSON.stringify({ error: "barber and off_date required" }), { status: 400 });
      const { data, error } = await supa
        .from("stylist_days_off")
        .upsert({ barber, off_date, reason }, { onConflict: "barber,off_date" })
        .select()
        .single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify(data), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), { status: 400 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// DELETE /api/schedule — remove day off | reset full schedule for barber
// body: { type: "days-off", barber, off_date } | { type: "clear-schedule", barber } | { type: "clear-days-off", barber }
export const DELETE: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await request.json();
    const supa = adminClient();

    if (body.type === "days-off") {
      const { barber, off_date } = body;
      if (!barber || !off_date) return new Response(JSON.stringify({ error: "barber and off_date required" }), { status: 400 });
      await supa.from("stylist_days_off").delete().eq("barber", barber).eq("off_date", off_date);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (body.type === "clear-schedule") {
      const { barber } = body;
      if (!barber) return new Response(JSON.stringify({ error: "barber required" }), { status: 400 });
      await supa.from("stylist_schedule").delete().eq("barber", barber);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (body.type === "clear-days-off") {
      const { barber } = body;
      if (!barber) return new Response(JSON.stringify({ error: "barber required" }), { status: 400 });
      await supa.from("stylist_days_off").delete().eq("barber", barber);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), { status: 400 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
