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

interface Row {
  id: string;
  category: string;
  name_fr: string;
  name_en: string;
  price_eur: string;
  price_dzd: string;
  duration_fr: string;
  duration_en: string;
  description_fr: string;
  description_en: string;
  sort_order: number;
}

function toService(r: Row) {
  return {
    id: r.id,
    category: r.category,
    name: { fr: r.name_fr, en: r.name_en },
    priceEur: r.price_eur,
    priceDzd: r.price_dzd,
    duration: { fr: r.duration_fr, en: r.duration_en },
    description: { fr: r.description_fr, en: r.description_en },
    sort_order: r.sort_order,
  };
}

// GET /api/services — public: returns all services grouped by category
export const GET: APIRoute = async () => {
  try {
    const supa = adminClient();
    const { data, error } = await supa
      .from("services")
      .select("*")
      .order("category")
      .order("sort_order");
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(
      JSON.stringify({ services: (data || []).map(toService) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// POST /api/services — add a new service (authenticated)
export const POST: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await request.json();
    const { id, category, name, priceEur, priceDzd, duration, description, sort_order } = body;
    if (!id || !category || !name?.fr || !name?.en) {
      return new Response(JSON.stringify({ error: "id, category, name.fr, name.en required" }), { status: 400 });
    }

    const supa = adminClient();
    const { data, error } = await supa
      .from("services")
      .insert({
        id,
        category,
        name_fr: name.fr,
        name_en: name.en,
        price_eur: priceEur || "",
        price_dzd: priceDzd || "",
        duration_fr: duration?.fr || "",
        duration_en: duration?.en || "",
        description_fr: description?.fr || "",
        description_en: description?.en || "",
        sort_order: Number.isFinite(sort_order) ? sort_order : 999,
      })
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(toService((data as Row))), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// PUT /api/services — update a service by id (authenticated)
export const PUT: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });

    const patch: Record<string, unknown> = {};
    if (body.category !== undefined) patch.category = body.category;
    if (body.name?.fr !== undefined) patch.name_fr = body.name.fr;
    if (body.name?.en !== undefined) patch.name_en = body.name.en;
    if (body.priceEur !== undefined) patch.price_eur = body.priceEur;
    if (body.priceDzd !== undefined) patch.price_dzd = body.priceDzd;
    if (body.duration?.fr !== undefined) patch.duration_fr = body.duration.fr;
    if (body.duration?.en !== undefined) patch.duration_en = body.duration.en;
    if (body.description?.fr !== undefined) patch.description_fr = body.description.fr;
    if (body.description?.en !== undefined) patch.description_en = body.description.en;
    if (body.sort_order !== undefined) patch.sort_order = body.sort_order;

    const supa = adminClient();
    const { data, error } = await supa.from("services").update(patch).eq("id", id).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(toService((data as Row))), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// DELETE /api/services — delete by id (authenticated)
export const DELETE: APIRoute = async ({ request }) => {
  const user = await verifyUser(request);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });

    const supa = adminClient();
    const { error } = await supa.from("services").delete().eq("id", id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
