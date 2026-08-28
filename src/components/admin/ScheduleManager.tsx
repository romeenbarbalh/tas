import { useState, useEffect, useCallback } from "react";
import { supabase, getAuthToken } from "../../lib/supabase";

const BARBERS = [
  "Hairbydm",
  "Kenny Cutz",
  "Crespo",
  "Gnk",
  "House.Barber4840",
  "NBCutz4K",
  "Pretty Little Hair",
];

const DAYS = [
  { index: 0, label: "Dimanche", short: "Dim" },
  { index: 1, label: "Lundi", short: "Lun" },
  { index: 2, label: "Mardi", short: "Mar" },
  { index: 3, label: "Mercredi", short: "Mer" },
  { index: 4, label: "Jeudi", short: "Jeu" },
  { index: 5, label: "Vendredi", short: "Ven" },
  { index: 6, label: "Samedi", short: "Sam" },
];

interface SalonHour { day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean; }
interface Schedule { barber: string; day_of_week: number; start_time: string; end_time: string; is_working: boolean; }
interface DayOff { barber: string; off_date: string; reason: string; }

async function api(token: string, method: string, path: string, body?: any) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error((err as any).error || "Erreur");
  }
  return res.json();
}

export default function ScheduleManager() {
  const [hours, setHours] = useState<SalonHour[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState<string>("");

  // Days-off form
  const [offBarber, setOffBarber] = useState(BARBERS[0]);
  const [offDate, setOffDate] = useState("");
  const [offReason, setOffReason] = useState("");

  const load = useCallback(async () => {
    const tok = await getAuthToken();
    if (!tok) {
      window.location.href = "/admin/";
      return;
    }
    setToken(tok);
    setLoading(true);
    try {
      const data = await api(tok, "GET", "/api/schedule/");
      setHours(data.hours || []);
      setSchedule(data.schedule || []);
      setDaysOff(data.daysOff || []);
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getHour = (day: number) => hours.find((h) => h.day_of_week === day);
  const getSched = (barber: string, day: number) => schedule.find((s) => s.barber === barber && s.day_of_week === day);

  const saveSalonHour = async (day: number, patch: Partial<SalonHour>) => {
    const current = getHour(day);
    const merged = { day_of_week: day, open_time: current?.open_time || null, close_time: current?.close_time || null, is_closed: current?.is_closed || false, ...patch };
    try {
      const saved = await api(token, "PUT", "/api/schedule/", { type: "salon", ...merged });
      setHours((prev) => {
        const idx = prev.findIndex((h) => h.day_of_week === day);
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
    } catch (e: any) { alert("Erreur: " + e.message); }
  };

  const saveSched = async (barber: string, day: number, patch: Partial<Schedule>) => {
    const current = getSched(barber, day);
    const merged = { barber, day_of_week: day, start_time: current?.start_time || "09:00", end_time: current?.end_time || "17:00", is_working: current?.is_working ?? true, ...patch };
    try {
      const saved = await api(token, "PUT", "/api/schedule/", { type: "stylist-schedule", ...merged });
      setSchedule((prev) => {
        const idx = prev.findIndex((s) => s.barber === barber && s.day_of_week === day);
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
    } catch (e: any) { alert("Erreur: " + e.message); }
  };

  const addDayOff = async () => {
    if (!offDate) return;
    setSaving(true);
    try {
      const saved = await api(token, "POST", "/api/schedule/", { type: "days-off", barber: offBarber, off_date: offDate, reason: offReason });
      setDaysOff((prev) => [saved, ...prev.filter((d) => !(d.barber === offBarber && d.off_date === offDate))]);
      setOffDate(""); setOffReason("");
    } catch (e: any) { alert("Erreur: " + e.message); }
    setSaving(false);
  };

  const removeDayOff = async (barber: string, date: string) => {
    try {
      await api(token, "DELETE", "/api/schedule/", { type: "days-off", barber, off_date: date });
      setDaysOff((prev) => prev.filter((d) => !(d.barber === barber && d.off_date === date)));
    } catch (e: any) { alert("Erreur: " + e.message); }
  };

  const clearSchedule = async (barber: string) => {
    if (!confirm(`Effacer tout le planning de ${barber} ?`)) return;
    setSaving(true);
    try {
      await api(token, "DELETE", "/api/schedule/", { type: "clear-schedule", barber });
      setSchedule((prev) => prev.filter((s) => s.barber !== barber));
    } catch (e: any) { alert("Erreur: " + e.message); }
    setSaving(false);
  };

  const clearDaysOff = async (barber: string) => {
    if (!confirm(`Effacer toutes les congÃ©s de ${barber} ?`)) return;
    setSaving(true);
    try {
      await api(token, "DELETE", "/api/schedule/", { type: "clear-days-off", barber });
      setDaysOff((prev) => prev.filter((d) => d.barber !== barber));
    } catch (e: any) { alert("Erreur: " + e.message); }
    setSaving(false);
  };

  const allTime = (check: string) =>
    Math.round((Number(check.split(":")[0]) * 60 + Number(check.split(":")[1])) / 15) * 15;

  if (loading) return <div className="text-center py-12 text-muted text-sm">Chargement...</div>;

  return (
    <div className="space-y-8">
      {/* === SALON HOURS === */}
      <section>
        <h3 className="font-display text-base font-semibold text-white mb-4">1. Horaires du salon</h3>
        <div className="grid md:grid-cols-2 gap-2">
          {DAYS.map((day) => {
            const h = getHour(day.index);
            return (
              <div key={day.index} className="flex items-center gap-2 bg-surface-2 border border-white/10 rounded-xl px-3 py-2.5">
                <span className="text-sm font-medium text-white w-24">{day.label}</span>
                <button
                  onClick={() => saveSalonHour(day.index, { is_closed: !h?.is_closed })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${h?.is_closed ? "bg-red-500/20 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}
                >
                  {h?.is_closed ? "FermÃ©" : "Ouvert"}
                </button>
                <input
                  type="time"
                  value={h?.open_time || "09:00"}
                  disabled={h?.is_closed}
                  onChange={(e) => saveSalonHour(day.index, { open_time: e.target.value || null, is_closed: false })}
                  className="bg-surface-2 border border-white/10 rounded-lg px-2 py-1 text-sm text-white disabled:opacity-30 w-28"
                />
                <span className="text-muted text-xs">â€”</span>
                <input
                  type="time"
                  value={h?.close_time || "20:00"}
                  disabled={h?.is_closed}
                  onChange={(e) => saveSalonHour(day.index, { close_time: e.target.value || null, is_closed: false })}
                  className="bg-surface-2 border border-white/10 rounded-lg px-2 py-1 text-sm text-white disabled:opacity-30 w-28"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* === STYLIST SCHEDULES === */}
      <section>
        <h3 className="font-display text-base font-semibold text-white mb-1">2. Plannings des stylistes</h3>
        <p className="text-xs text-muted mb-4">DÃ©finissez pour chaque styliste ses jours et ses horaires de travail.</p>

        <div className="space-y-4">
          {BARBERS.map((barber) => {
            const schs = schedule.filter((s) => s.barber === barber);
            return (
              <div key={barber} className="bg-surface-2 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm text-white">{barber}</span>
                  <button onClick={() => clearSchedule(barber)} disabled={saving}
                    className="text-xs text-muted hover:text-red-400 transition-colors">
                    Effacer planning
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {DAYS.map((day) => {
                    const s = getSched(barber, day.index);
                    return (
                      <div key={day.index} className="flex items-center gap-2">
                        <button
                          onClick={() => saveSched(barber, day.index, { is_working: !s?.is_working })}
                          className={`w-16 text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${s?.is_working === false ? "bg-red-500/15 text-red-400" : "bg-surface-2 text-white/80 hover:border-gold/40"}`}
                        >
                          {s?.is_working === false ? "Off" : day.short}
                        </button>
                        <input
                          type="time"
                          value={s?.start_time || "09:00"}
                          disabled={s?.is_working === false}
                          onChange={(e) => saveSched(barber, day.index, { start_time: e.target.value, is_working: true })}
                          className="bg-surface-2 border border-white/10 rounded-lg px-1.5 py-1 text-xs text-white disabled:opacity-30 w-24"
                        />
                        <span className="text-muted/50 text-[10px]">â€”</span>
                        <input
                          type="time"
                          value={s?.end_time || "17:00"}
                          disabled={s?.is_working === false}
                          onChange={(e) => saveSched(barber, day.index, { end_time: e.target.value, is_working: true })}
                          className="bg-surface-2 border border-white/10 rounded-lg px-1.5 py-1 text-xs text-white disabled:opacity-30 w-24"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* === DAYS OFF === */}
      <section>
        <h3 className="font-display text-base font-semibold text-white mb-1">3. Jours de congÃ© / absences</h3>
        <p className="text-xs text-muted mb-4">Ajoutez des jours oÃ¹ un styliste est absent (vacances, etc.).</p>

        <div className="flex flex-wrap gap-2 items-end mb-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">Styliste</label>
            <select value={offBarber} onChange={(e) => setOffBarber(e.target.value)}
              className="bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              {BARBERS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">Date</label>
            <input type="date" value={offDate} onChange={(e) => setOffDate(e.target.value)}
              className="bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-muted mb-1">Raison</label>
            <input type="text" value={offReason} onChange={(e) => setOffReason(e.target.value)} placeholder="Vacances..."
              className="bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-40" />
          </div>
          <button onClick={addDayOff} disabled={saving || !offDate}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-gold text-background hover:bg-gold-light transition-colors disabled:opacity-50">
            Ajouter
          </button>
        </div>

        {BARBERS.map((barber) => {
          const offs = daysOff.filter((d) => d.barber === barber);
          if (offs.length === 0) return null;
          return (
            <div key={barber} className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted">{barber}</span>
                <button onClick={() => clearDaysOff(barber)} className="text-[11px] text-muted/50 hover:text-red-400 transition-colors">Effacer tout</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {offs.map((o) => (
                  <span key={o.off_date} className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-full pl-3 pr-1.5 py-1 text-xs text-red-300">
                    {new Date(o.off_date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    {o.reason ? ` Â· ${o.reason}` : ""}
                    <button onClick={() => removeDayOff(barber, o.off_date)} className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-500/30 transition-colors">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {daysOff.length === 0 && (
          <p className="text-sm text-muted/50">Aucun jour de congÃ© enregistrÃ©.</p>
        )}
      </section>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-surface-2 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/80 shadow-xl z-50">
          Sauvegarde...
        </div>
      )}
    </div>
  );
}
