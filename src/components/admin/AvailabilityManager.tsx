import { useEffect, useMemo, useState } from "react";
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

const TIME_SLOTS: string[] = (() => {
  const s: string[] = [];
  for (let h = 9; h < 20; h++) {
    s.push(`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`);
  }
  s.push("20:00");
  return s;
})();

const DOW_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface SalonHour { day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean; }
interface Schedule { barber: string; day_of_week: number; start_time: string; end_time: string; is_working: boolean; }
interface DayOff { barber: string; off_date: string; reason?: string | null; }
interface AvailRow { barber: string; slot_date: string; slot_time: string; is_available: boolean; }

const toMin = (t: string | null | undefined): number => {
  if (!t) return -1;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const fmt = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const todayStr = fmt(new Date());

function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return fmt(d);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return fmt(d);
}

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

interface SlotState { time: string; auto: boolean; booked: boolean; exception?: boolean; }

export default function AvailabilityManager() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayStr));
  const [selected, setSelected] = useState(0); // dow 0..6
  const [selectedBarber, setSelectedBarber] = useState<string>(BARBERS[0]);

  const [salonHours, setSalonHours] = useState<Record<number, SalonHour>>({});
  const [schedules, setSchedules] = useState<Record<string, Record<number, Schedule>>>({});
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [exceptions, setExceptions] = useState<Record<string, Record<string, Map<string, boolean>>>>({}); // barber -> date -> time -> is_available
  const [bookings, setBookings] = useState<Record<string, Record<string, string[]>>>({}); // barber -> date -> times
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyCell, setBusyCell] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = await getAuthToken();
      const end = addDays(weekStart, 6);
      let data: any;
      try {
        data = await api(token!, "GET", "/api/schedule/");
      } catch {
        data = { hours: [], schedule: [], daysOff: [] };
      }

      const hMap: Record<number, SalonHour> = {};
      (data.hours || []).forEach((h: SalonHour) => (hMap[h.day_of_week] = h));
      setSalonHours(hMap);

      const sMap: Record<string, Record<number, Schedule>> = {};
      (data.schedule || []).forEach((s: Schedule) => {
        sMap[s.barber] = sMap[s.barber] || {};
        sMap[s.barber][s.day_of_week] = s;
      });
      setSchedules(sMap);

      const off = (data.daysOff || []).filter(
        (o: DayOff) => o.off_date >= weekStart && o.off_date <= end
      );
      setDaysOff(off);

      // Fetch exceptions + bookings for the whole week
      const exMap: Record<string, Record<string, Map<string, boolean>>> = {};
      const bkMap: Record<string, Record<string, string[]>> = {};

      try {
        const daysRes = await fetch(
          `/api/availability/?start=${weekStart}&end=${end}`
        );
        if (daysRes.ok) {
          const rows: AvailRow[] = await daysRes.json();
          rows.forEach((r) => {
            exMap[r.barber] = exMap[r.barber] || {};
            exMap[r.barber][r.slot_date] = exMap[r.barber][r.slot_date] || new Map();
            exMap[r.barber][r.slot_date].set(r.slot_time, r.is_available);
          });
        }
      } catch { /* ignore */ }

      const { data: bks, error } = await supabase
        .from("bookings")
        .select("booking_date, booking_time, barber")
        .gte("booking_date", weekStart)
        .lte("booking_date", end)
        .in("status", ["pending", "confirmed"]);
      (bks || []).forEach((b: any) => {
        bkMap[b.barber] = bkMap[b.barber] || {};
        bkMap[b.barber][b.booking_date] = bkMap[b.barber][b.booking_date] || [];
        bkMap[b.barber][b.booking_date].push(b.booking_time);
      });
      if (error) console.error(error);

      setExceptions(exMap);
      setBookings(bkMap);
      setLoading(false);
    };
    load();
  }, [weekStart]);

  // Compute the state of each slot for a given barber + date (smart engine)
  const computeDay = (barber: string, dateStr: string): SlotState[] => {
    const dow = (new Date(dateStr + "T00:00:00").getDay() + 6) % 7;
    const h = salonHours[dow];
    const s = schedules[barber]?.[dow];
    const isOff = daysOff.some((o) => o.barber === barber && o.off_date === dateStr);
    const dayExc = exceptions[barber]?.[dateStr] || new Map<string, boolean>();
    const dayBks = new Set(bookings[barber]?.[dateStr] || []);

    const salonOpen = !!(h && !h.is_closed && h.open_time && h.close_time);
    const openMin = salonOpen ? toMin(h!.open_time) : -1;
    const closeMin = salonOpen ? toMin(h!.close_time) : -1;
    const working = !!(s && s.is_working);
    const wsMin = working ? toMin(s!.start_time) : -1;
    const weMin = working ? toMin(s!.end_time) : -1;

    return TIME_SLOTS.map((t) => {
      const tm = toMin(t);
      const booked = dayBks.has(t);
      if (booked) return { time: t, auto: false, booked: true };

      // Manual exception wins if present
      if (dayExc.has(t)) {
        return { time: t, auto: false, exception: dayExc.get(t) };
      }

      // Auto (rule-driven): open only if salon open AND stylist working AND within both ranges AND not off
      const open =
        !isOff &&
        salonOpen &&
        working &&
        tm >= openMin &&
        tm < closeMin &&
        tm >= wsMin &&
        tm < weMin;

      return { time: t, auto: true, exception: open };
    });
  };

  const daySummary = (barber: string, dateStr: string) => {
    const slots = computeDay(barber, dateStr);
    const open = slots.filter((s) => !s.booked && s.exception).length;
    const booked = slots.filter((s) => s.booked).length;
    const closed = slots.filter((s) => !s.booked && !s.exception).length;
    return { open, booked, closed };
  };

  const selectedDate = weekDates[selected];
  const selectedSlots = useMemo(
    () => computeDay(selectedBarber, selectedDate),
    [selectedBarber, selectedDate, salonHours, schedules, daysOff, exceptions, bookings]
  );
  const openCount = selectedSlots.filter((s) => !s.booked && s.exception).length;

  const toggleSlot = async (time: string) => {
    const s = selectedSlots.find((x) => x.time === time);
    if (!s || s.booked) return;

    const token = await getAuthToken();
    if (!token) return;

    setSaving(true);
    // current effective open state = exception (if present) else auto
    const curOpen = s.exception ?? s.auto;
    const newOpen = !curOpen;

    try {
      await api(token, "PUT", "/api/availability/", {
        barber: selectedBarber,
        slot_date: selectedDate,
        slot_time: time,
        is_available: newOpen,
      });
      // reload exceptions for this barber/date
      const res = await fetch(`/api/availability/?start=${selectedDate}&end=${selectedDate}`);
      if (res.ok) {
        const rows: AvailRow[] = await res.json();
        const m = new Map<string, boolean>();
        rows
          .filter((r) => r.barber === selectedBarber)
          .forEach((r) => m.set(r.slot_time, r.is_available));
        setExceptions((prev) => {
          const b = { ...prev };
          b[selectedBarber] = { ...(b[selectedBarber] || {}), [selectedDate]: m };
          return b;
        });
      }
      setMessage("Enregistré");
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
    setSaving(false);
  };

  const setWholeDay = async (open: boolean) => {
    const token = await getAuthToken();
    if (!token) return;
    setSaving(true);
    const slots = TIME_SLOTS.map((t) => ({
      barber: selectedBarber,
      slot_date: selectedDate,
      slot_time: t,
      is_available: open,
    }));
    try {
      await api(token, "POST", "/api/availability/", { slots });
      const res = await fetch(`/api/availability/?start=${selectedDate}&end=${selectedDate}`);
      if (res.ok) {
        const rows: AvailRow[] = await res.json();
        const m = new Map<string, boolean>();
        rows
          .filter((r) => r.barber === selectedBarber)
          .forEach((r) => m.set(r.slot_time, r.is_available));
        setExceptions((prev) => {
          const b = { ...prev };
          b[selectedBarber] = { ...(b[selectedBarber] || {}), [selectedDate]: m };
          return b;
        });
      }
      setMessage(open ? "Journée ouverte" : "Journée fermée");
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
    setSaving(false);
  };

  const resetDay = async () => {
    const token = await getAuthToken();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch("/api/availability/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slot_date: selectedDate, barber: selectedBarber }),
      });
      if (!res.ok) throw new Error("FAIL");
      setExceptions((prev) => {
        const b = { ...prev };
        if (b[selectedBarber]) delete b[selectedBarber][selectedDate];
        return b;
      });
      setMessage("Réinitialisé (auto)");
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
    setSaving(false);
  };

  // Bulk: apply rules to the whole week (write auto-open slots as available to the public site)
  const applyWeekRules = async () => {
    if (!confirm("Appliquer les règles (horaires + planning) à toute la semaine ?")) return;
    const token = await getAuthToken();
    if (!token) return;
    setSaving(true);
    const slots: any[] = [];
    weekDates.forEach((dateStr) => {
      BARBERS.forEach((barber) => {
        computeDay(barber, dateStr)
          .filter((s) => !s.booked && s.exception)
          .forEach((s) =>
            slots.push({ barber, slot_date: dateStr, slot_time: s.time, is_available: true })
          );
      });
    });
    if (slots.length === 0) {
      alert("Aucune ouverture générée — vérifiez les horaires du salon et le planning des coiffeurs.");
      setSaving(false);
      return;
    }
    try {
      await api(token, "POST", "/api/availability/", { slots });
      // reload exceptions
      const res = await fetch(`/api/availability/?start=${weekStart}&end=${addDays(weekStart, 6)}`);
      if (res.ok) {
        const rows: AvailRow[] = await res.json();
        const exMap: Record<string, Record<string, Map<string, boolean>>> = {};
        rows.forEach((r) => {
          exMap[r.barber] = exMap[r.barber] || {};
          exMap[r.barber][r.slot_date] = exMap[r.barber][r.slot_date] || new Map();
          exMap[r.barber][r.slot_date].set(r.slot_time, r.is_available);
        });
        setExceptions(exMap);
      }
      setMessage("Règles appliquées à la semaine");
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
    setSaving(false);
  };

  const isPast = weekStart < mondayOf(todayStr);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart((w) => addDays(w, -7))} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-muted transition-colors hover:bg-surface-2 hover:text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="text-center">
              <p className="font-serif text-sm font-semibold text-white">
                {weekDates[0].split("-").reverse().join("/")} – {weekDates[6].split("-").reverse().join("/")}
              </p>
              <p className="text-[11px] text-muted">Semaine du {weekDates[0]}</p>
            </div>
            <button onClick={() => setWeekStart((w) => addDays(w, 7))} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-muted transition-colors hover:bg-surface-2 hover:text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setWeekStart(mondayOf(todayStr))} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-white">
              Aujourd'hui
            </button>
            <button onClick={applyWeekRules} disabled={saving || loading}
              className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50"
              title="Calcule les ouvertures selon les horaires + planning et l'applique aux clients">
              Â» Appliquer les rÃ¨gles
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-white/50 bg-white/20"></span> Ouvert (rÃ¨gle)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-white/10 bg-surface-2"></span> FermÃ©</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-white/30"></span> Plusieurs crÃ©neaux</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-white/40 bg-white/60"></span> RÃ©servÃ©</span>
      </div>

      {/* Weekly matrix */}
      <div className="overflow-x-auto rounded-2xl border border-white/8">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="w-44 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">Coiffeur</th>
              {DOW_LABELS.map((d, i) => {
                const active = i === selected && !loading;
                const ds = weekDates[i];
                return (
                  <th key={d} className={`px-2 py-2.5 text-center ${active ? "bg-surface-2 text-white" : "text-muted"} ${ds === todayStr ? "text-gold" : ""}`}>
                    <button onClick={() => setSelected(i)} className="mx-auto block">
                      <span className="block text-[10px] font-medium uppercase tracking-wide">{d}</span>
                      <span className="mt-0.5 block font-serif text-sm font-semibold">
                        {ds === todayStr ? "Auj." : ds.split("-")[2]}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {BARBERS.map((barber) => (
              <tr key={barber} className="border-b border-white/8 last:border-0">
                <td className="px-4 py-2 font-medium text-white/85">{barber}</td>
                {weekDates.map((ds, i) => {
                  const sum = daySummary(barber, ds);
                  const isSel = i === selected && barber === selectedBarber;
                  let chip;
                  let cls = "bg-surface text-muted";
                  if (sum.open === 0 && sum.booked === 0) {
                    chip = "FermÃ©";
                  } else if (sum.booked === 0 && sum.closed === 0) {
                    chip = `${sum.open}h`;
                    cls = "bg-white text-black";
                  } else if (sum.closed === 0) {
                    chip = `${sum.open}h · ${sum.booked} r`;
                    cls = "bg-white/80 text-black";
                  } else if (sum.open > 0 && sum.closed > 0) {
                    chip = `${sum.open}h · ${sum.booked} r · ${sum.closed} f`;
                    cls = "bg-white/15 text-white border border-dashed border-white/25";
                  } else if (sum.booked > 0) {
                    chip = `${sum.booked} r`;
                    cls = "bg-white text-black";
                  }
                  return (
                    <td key={ds} className="px-2 py-2 text-center">
                      <button
                        disabled={busyCell}
                        onClick={() => { setSelected(i); setSelectedBarber(barber); }}
                        className={`inline-flex w-full items-center justify-center rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors ${cls} ${isSel ? "ring-2 ring-white/60" : ""} ${isPast && ds < todayStr ? "opacity-40" : ""}`}
                      >
                        {chip}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Day editor */}
      <div className="rounded-2xl border border-white/8 bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-serif text-base font-semibold text-white">
              {selectedBarber}
            </p>
            <p className="text-xs capitalize text-muted">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {openCount} crÃ©neau{x(openCount)} ouverts
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setWholeDay(true)} disabled={saving}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50">
              Ouvrir tout
            </button>
            <button onClick={() => setWholeDay(false)} disabled={saving}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50">
              Fermer tout
            </button>
            <button onClick={resetDay} disabled={saving}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-white disabled:opacity-50">
              RÃ©initialiser
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {selectedSlots.map((s) => {
            let cls = "border-white/10 bg-surface-2 text-muted hover:bg-surface";
            let title = "Fermé (hors horaires / jour off)";
            if (s.booked) {
              cls = "border-white/25 bg-white/60 text-black cursor-not-allowed";
              title = "Réservé";
            } else if (s.exception) {
              cls = "border-white/40 bg-white text-black hover:bg-white/80";
              title = "Ouvert — cliquer pour fermer";
            }
            return (
              <button
                key={s.time}
                onClick={() => toggleSlot(s.time)}
                disabled={saving || s.booked || busyCell}
                title={title}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-60 ${s.booked ? "cursor-not-allowed" : "cursor-pointer"} ${cls}`}
              >
                {s.time}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Les crÃ©neaux blancs sont calculÃ©s automatiquement selon les horaires du salon et le planning du coiffeur.
          Cliquez pour crÃ©er une exception manuelle (ou la retirer).
        </p>
      </div>

      {message && <p className="text-xs text-emerald-400">{message}</p>}
      {loading && <p className="text-center py-10 text-sm text-muted">Chargement...</p>}
      {saving && (
        <div className="fixed bottom-4 right-4 rounded-xl border border-white/10 bg-surface-2 px-4 py-2 text-sm text-white/80 shadow-xl z-50">
          Enregistrement...
        </div>
      )}
    </div>
  );
}

function x(n: number): string {
  return n > 1 ? "x" : "";
}
