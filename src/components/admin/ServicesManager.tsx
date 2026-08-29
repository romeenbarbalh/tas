import { useEffect, useState } from "react";
import { getAuthToken } from "../../lib/supabase";

interface Service {
  id: string;
  category: string;
  name: { fr: string; en: string };
  priceEur: string;
  priceDzd: string;
  duration: { fr: string; en: string };
  description: { fr: string; en: string };
  sort_order?: number;
}

const CATEGORIES = [
  { id: "men", label: "Homme / Barbier" },
  { id: "women", label: "Femme / Coiffure" },
  { id: "braids", label: "Tresses / Braids" },
];

const STATUS_COLORS: Record<string, string> = {
  men: "border-white/8 bg-surface-2 text-white",
  women: "border-white/8 bg-surface-2 text-white",
  braids: "border-white/8 bg-surface-2 text-white",
};

async function api(token: string, method: string, path: string, body?: any) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Erreur");
  }
  return res.json();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Service | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/services/", { headers: { Accept: "application/json" } });
      const json = await res.json();
      setServices(Array.isArray(json.services) ? json.services : []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startAdd(category: string) {
    setEditingId("__new__");
    setDraft({
      id: "",
      category,
      name: { fr: "", en: "" },
      priceEur: "",
      priceDzd: "",
      duration: { fr: "", en: "" },
      description: { fr: "", en: "" },
      sort_order: 999,
    });
  }

  function startEdit(s: Service) {
    setEditingId(s.id);
    setDraft({ ...s, name: { ...s.name }, duration: { ...s.duration }, description: { ...s.description } });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function update(field: string, value: string) {
    if (!draft) return;
    const next = { ...draft };

    if (field.startsWith("name.") || field.startsWith("duration.") || field.startsWith("description.")) {
      const [key, lang] = field.split(".");
      next[key as "name" | "duration" | "description"] = {
        ...(next[key as "name" | "duration" | "description"] as any),
        [lang]: value,
      };
    } else if (field === "category") {
      next.category = value;
    } else if (field === "priceEur") {
      next.priceEur = value;
    } else if (field === "priceDzd") {
      next.priceDzd = value;
    } else if (field === "id") {
      next.id = value;
    }
    setDraft(next);
  }

  async function save() {
    if (!draft) return;
    const nameFr = (draft.name?.fr || "").trim();
    if (!nameFr) {
      setMessage({ type: "err", text: "Le nom (FR) est requis." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const token = await getAuthToken();
      const isNew = editingId === "__new__";
      const payload = {
        id: isNew ? draft.id || slugify(nameFr) : editingId,
        category: draft.category,
        name: { fr: draft.name.fr, en: draft.name.en || draft.name.fr },
        priceEur: draft.priceEur || "",
        priceDzd: draft.priceDzd || "",
        duration: { fr: draft.duration.fr || "", en: draft.duration.en || draft.duration.fr || "" },
        description: { fr: draft.description.fr || "", en: draft.description.en || draft.description.fr || "" },
        sort_order: draft.sort_order ?? 999,
      };

      if (isNew) {
        await api(token!, "POST", "/api/services/", payload);
      } else {
        await api(token!, "PUT", "/api/services/", payload);
      }

      setMessage({ type: "ok", text: isNew ? "Service ajouté." : "Service mis à jour." });
      cancelEdit();
      await load();
    } catch (e: any) {
      setMessage({ type: "err", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: Service) {
    if (!confirm(`Supprimer "${s.name.fr}" ?`)) return;
    try {
      const token = await getAuthToken();
      await api(token!, "DELETE", "/api/services/", { id: s.id });
      setMessage({ type: "ok", text: "Service supprimé." });
      if (editingId !== "__new__") cancelEdit();
      await load();
    } catch (e: any) {
      setMessage({ type: "err", text: e.message });
    }
  }

  const grouped = CATEGORIES.map((c) => ({ ...c, items: services.filter((s) => s.category === c.id) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-white">Services & tarifs</h2>
          <p className="mt-0.5 text-xs text-muted">
            Gérer les services affichés sur « Nos services & tarifs ». Les changements sont visibles immédiatement sur le site.
          </p>
        </div>
        <button
          onClick={() => setMessage(null)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-white"
        >
          Recharger
        </button>
      </div>

      {message && (
        <div className={`rounded-xl border p-3.5 text-sm ${message.type === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-white/8 bg-surface p-6 text-center text-sm text-muted">Chargement...</div>
      ) : (
        <div className="space-y-8">
          {grouped.map((cat) => (
            <div key={cat.id}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  {cat.label}
                  <span className="text-xs font-normal normal-case text-muted">({cat.items.length})</span>
                </h3>
                <button
                  onClick={() => startAdd(cat.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-white/30"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {cat.items.length === 0 && editingId !== "__new__" && (
                  <div className="rounded-xl border border-dashed border-white/10 bg-surface p-4 text-center text-sm text-muted">
                    Aucun service dans cette catégorie.
                  </div>
                )}

                {cat.items.map((s) => (
                  <div key={s.id} className={`rounded-xl border bg-surface p-4 ${STATUS_COLORS[cat.id] || "border-white/8 bg-surface-2"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{s.name.fr}</p>
                        {s.name.en && s.name.en !== s.name.fr && (
                          <p className="mt-0.5 text-xs text-muted">{s.name.en}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-surface px-2.5 py-0.5 text-xs font-semibold text-gold">{s.priceEur}</span>
                        <span className="rounded-full border border-white/10 bg-surface px-2.5 py-0.5 text-xs text-muted">{s.duration.fr}</span>
                        <button onClick={() => startEdit(s)} className="rounded-lg border border-white/10 p-1.5 text-muted transition-colors hover:text-white">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        </button>
                        <button onClick={() => remove(s)} className="rounded-lg border border-white/10 p-1.5 text-muted transition-colors hover:text-red-400">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                    {s.description?.fr && (
                      <p className="mt-1.5 text-xs text-muted">{s.description.fr}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / ADD MODAL */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={cancelEdit}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-white">
                {editingId === "__new__" ? "Ajouter un service" : "Modifier le service"}
              </h3>
              <button onClick={cancelEdit} className="rounded-lg p-1.5 text-muted transition-colors hover:text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Catégorie</label>
                <select
                  value={draft.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#19191d] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {editingId === "__new__" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                    Identifiant (laisser vide = auto)
                  </label>
                  <input
                    value={draft.id}
                    onChange={(e) => update("id", e.target.value)}
                    placeholder="ex: coupe-a-la-mode"
                    className="w-full rounded-lg border border-white/10 bg-[#19191d] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Nom (FR) *</label>
                  <input
                    value={draft.name.fr}
                    onChange={(e) => update("name.fr", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#19191d] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Nom (EN)</label>
                  <input
                    value={draft.name.en}
                    onChange={(e) => update("name.en", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#19191d] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Prix (EUR)</label>
                  <input
                    value={draft.priceEur}
                    onChange={(e) => update("priceEur", e.target.value)}
                    placeholder="ex: 15€ ou 40–45 DA"
                    className="w-full rounded-lg border border-white/10 bg-[#19191d] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Durée</label>
                  <input
                    value={draft.duration.fr}
                    onChange={(e) => update("duration.fr", e.target.value)}
                    placeholder="ex: 30–45 min"
                    className="w-full rounded-lg border border-white/10 bg-[#19191d] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Description (FR)</label>
                <input
                  value={draft.description.fr}
                  onChange={(e) => update("description.fr", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#19191d] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Description (EN)</label>
                <input
                  value={draft.description.en}
                  onChange={(e) => update("description.en", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#19191d] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={cancelEdit} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-white">
                Annuler
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0a0a0b] transition-opacity disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
