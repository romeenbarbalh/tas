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
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Erreur");
  }
  return res.json();
}

interface SlotState { time: string; open: boolean; booked: boolean; }

export default function AvailabilityManager() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayStr));
  const [selBarber, setSelBarber] = useState<string>(BARBERS[0]);
  const [selDate, setSelDate] = useState<string>(todayStr);

  const [salonHours, setSalonHours] = useState<Record<number, SalonHour>>({});
  const [schedules, setSchedules] = useState<Record<string, Record<number, Schedule>>>({});
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [exceptions, setExceptions] = useState<Record<string, Record<string, Map<string, boolean>>>>({});
  const [bookings, setBookings] = useState<Record<string, Record<string, string[]>>>({});
  const [bookingClients, setBookingClients] = useState<Record<string, Record<string, Record<string, string>>>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = await getAuthToken();
      const end = addDays(weekStart, 6);
      let data: any = { hours: [], schedule: [], daysOff: [] };
      try {
        data = await api(token!, "GET", "/api/schedule/");
      } catch { /* empty */ }

      const hMap: Record<number, SalonHour> = {};
      (data.hours || []).forEach((h: SalonHour) => (hMap[h.day_of_week] = h));
      setSalonHours(hMap);

      const sMap: Record<string, Record<number, Schedule>> = {};
      (data.schedule || []).forEach((s: Schedule) => {
        sMap[s.barber] = sMap[s.barber] || {};
        sMap[s.barber][s.day_of_week] = s;
      });
      setSchedules(sMap);

      setDaysOff((data.daysOff || []).filter((o: DayOff) => o.off_date >= weekStart && o.off_date <= end));

      const exMap: Record<string, Record<string, Map<string, boolean>>> = {};
      const bkMap: Record<string, Record<string, string[]>> = {};
      const bkClients: Record<string, Record<string, Record<string, string>>> = {};
      try {
        const rows: AvailRow[] = await api(token!, "GET", `/api/availability/?start=${weekStart}&end=${end}`);
        rows.forEach((r) => {
          exMap[r.barber] = exMap[r.barber] || {};
          exMap[r.barber][r.slot_date] = exMap[r.barber][r.slot_date] || new Map();
          exMap[r.barber][r.slot_date].set(r.slot_time, r.is_available);
        });
      } catch { /* ignore */ }

      const { data: bks, error } = await supabase
        .from("bookings")
        .select("booking_date, booking_time, barber, client_name")
        .gte("booking_date", weekStart)
        .lte("booking_date", end)
        .in("status", ["pending", "confirmed"]);
      if (bks) {
        (bks as any[]).forEach((b: any) => {
          if (!b.barber) return;
          bkMap[b.barber] = bkMap[b.barber] || {};
          bkMap[b.barber][b.booking_date] = bkMap[b.barber][b.booking_date] || [];
          bkMap[b.barber][b.booking_date].push(b.booking_time);
          bkClients[b.barber] = bkClients[b.barber] || {};
          bkClients[b.barber][b.booking_date] = bkClients[b.barber][b.booking_date] || {};
          bkClients[b.barber][b.booking_date][b.booking_time] = b.client_name || "Réservé";
        });
      }
      if (error) console.error(error);

      setExceptions(exMap);
      setBookings(bkMap);
      setBookingClients(bkClients);
      setLoading(false);
    };
    load();
  }, [weekStart]);

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
      const autoOpen =
        !isOff &&
        salonOpen &&
        working &&
        tm >= openMin && tm < closeMin &&
        tm >= wsMin && tm < weMin;
      // manual exception wins, else rule
      const open = booked ? false : (dayExc.has(t) ? dayExc.get(t)! : autoOpen);
      return { time: t, open, booked };
    });
  };

  const dayState = (barber: string, dateStr: string) => {
    const slots = computeDay(barber, dateStr);
    const openCount = slots.filter((s) => s.open && !s.booked).length;
    const booked = slots.filter((s) => s.booked).length;
    if (booked === slots.length) return { kind: "reserved" as const, count: 0, booked };
    if (openCount === slots.length) return { kind: "open" as const, count: openCount, booked };
    if (openCount === 0) return { kind: "closed" as const, count: 0, booked };
    return { kind: "mixed" as const, count: openCount, booked };
  };

  const selectedSlots = useMemo(
    () => computeDay(selBarber, selDate),
    [selBarber, selDate, salonHours, schedules, daysOff, exceptions, bookings]
  );

  const setDayOpen = async (barber: string, dateStr: string, open: boolean) => {
    const token = await getAuthToken();
    if (!token) return;
    setBusy(true);
    setMessage(null);
    try {
      await api(token, "POST", "/api/availability/", {
        slots: TIME_SLOTS.map((t) => ({ barber, slot_date: dateStr, slot_time: t, is_available: open })),
      });
      const m = new Map<string, boolean>();
      TIME_SLOTS.forEach((t) => m.set(t, open));
      setExceptions((prev) => {
        const b = { ...prev };
        b[barber] = { ...(b[barber] || {}), [dateStr]: m };
        return b;
      });
      setMessage({ type: "ok", text: open ? "Journée ouverte" : "Journée fermée" });
    } catch (e: any) {
      setMessage({ type: "err", text: e.message });
    }
    setBusy(false);
  };

  const resetDay = async (barber: string, dateStr: string) => {
    const token = await getAuthToken();
    if (!token) return;
    setBusy(true);
    setMessage(null);
    try {
      await api(token, "DELETE", "/api/availability/", { slot_date: dateStr, barber });
      setExceptions((prev) => {
        const b = { ...prev };
        if (b[barber]) delete b[barber][dateStr];
        return b;
      });
      setMessage({ type: "ok", text: "Rétabli selon les règles" });
    } catch (e: any) {
      setMessage({ type: "err", text: e.message });
    }
    setBusy(false);
  };

  const toggleSlot = async (time: string) => {
    const s = selectedSlots.find((x) => x.time === time);
    if (!s || s.booked) return;
    const token = await getAuthToken();
    if (!token) return;
    setBusy(true);
    setMessage(null);
    try {
      await api(token, "PUT", "/api/availability/", {
        barber: selBarber,
        slot_date: selDate,
        slot_time: time,
        is_available: !s.open,
      });
      try {
        const rows: AvailRow[] = await api(token, "GET", `/api/availability/?start=${selDate}&end=${selDate}`);
        const m = new Map<string, boolean>();
        rows.filter((r) => r.barber === selBarber).forEach((r) => m.set(r.slot_time, r.is_available));
        setExceptions((prev) => {
          const b = { ...prev };
          b[selBarber] = { ...(b[selBarber] || {}), [selDate]: m };
          return b;
        });
      } catch { /* ignore */ }
      setMessage({ type: "ok", text: "Enregistré" });
    } catch (e: any) {
      setMessage({ type: "err", text: e.message });
    }
    setBusy(false);
  };

  const applyWeekRules = async () => {
    if (!confirm("Calculer et appliquer les ouvertures selon les horaires du salon + le planning des coiffeurs ?")) return;
    const token = await getAuthToken();
    if (!token) return;
    setBusy(true);
    setMessage(null);
    const slots: any[] = [];
    weekDates.forEach((dateStr) => {
      BARBERS.forEach((barber) => {
        computeDay(barber, dateStr).forEach((s) => {
          if (!s.booked && s.open) slots.push({ barber, slot_date: dateStr, slot_time: s.time, is_available: true });
        });
      });
    });
    if (slots.length === 0) {
      setMessage({ type: "err", text: "Aucune ouverture calculée — vérifiez les horaires du salon et le planning des coiffeurs." });
      setBusy(false);
      return;
    }
    try {
      await api(token, "POST", "/api/availability/", { slots });
      try {
        const rows: AvailRow[] = await api(token, "GET", `/api/availability/?start=${weekStart}&end=${addDays(weekStart, 6)}`);
        const exMap: Record<string, Record<string, Map<string, boolean>>> = {};
        rows.forEach((r) => {
          exMap[r.barber] = exMap[r.barber] || {};
          exMap[r.barber][r.slot_date] = exMap[r.barber][r.slot_date] || new Map();
          exMap[r.barber][r.slot_date].set(r.slot_time, r.is_available);
        });
        setExceptions(exMap);
      } catch { /* ignore */ }
      setMessage({ type: "ok", text: "Règles appliquées à toute la semaine" });
    } catch (e: any) {
      setMessage({ type: "err", text: e.message });
    }
    setBusy(false);
  };

  const openCount = selectedSlots.filter((s) => s.open && !s.booked).length;
  const isPast = weekStart < mondayOf(todayStr);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart((w) => addDays(w, -7))} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-muted transition-colors hover:bg-surface-2 hover:text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="text-center">
              <p className="font-serif text-sm font-semibold text-white">
                {weekDates[0].split("-").reverse().join("/")} — {weekDates[6].split("-").reverse().join("/")}
              </p>
            </div>
            <button onClick={() => setWeekStart((w) => addDays(w, 7))} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-muted transition-colors hover:bg-surface-2 hover:text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setWeekStart(mondayOf(todayStr))} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-white">
              Aujourd'hui
            </button>
            <button onClick={applyWeekRules} disabled={busy || loading}
              className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50">
              Appliquer les règles
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-white/50 bg-white"></span> Ouvert</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-white/10 bg-surface-2"></span> Fermé</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-white/30 bg-white/15"></span> Mixte</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400/60"></span> Réservé (client)</span>
      </div>

      {/* Weekly matrix */}
      <div className="overflow-x-auto rounded-2xl border border-white/8">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="w-40 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">Coiffeur</th>
              {DOW_LABELS.map((d, i) => {
                const ds = weekDates[i];
                return (
                  <th key={d} className={`px-2 py-2.5 text-center ${ds === todayStr ? "text-gold" : "text-muted"}`}>
                    <span className="block text-[10px] font-medium uppercase tracking-wide">{d}</span>
                    <span className="mt-0.5 block font-serif text-sm font-semibold">
                      {ds === todayStr ? "Auj." : ds.split("-")[2]}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {BARBERS.map((barber) => (
              <tr key={barber} className="border-b border-white/8 last:border-0">
                <td onClick={() => { setSelBarber(barber); }} className="cursor-pointer px-4 py-2 font-medium text-white/85 hover:text-white">{barber}</td>
                {weekDates.map((ds, i) => {
                  const st = dayState(barber, ds);
                  const isSel = barber === selBarber && ds === selDate;
                  const past = isPast && ds < todayStr;
                  let chip: React.ReactNode;
                  let cls = "bg-surface-2 text-muted";
                  if (st.kind === "open") {
                    chip = "Ouvert";
                    cls = "bg-white text-black";
                  } else if (st.kind === "reserved") {
                    chip = "Réservé";
                    cls = "bg-white/60 text-black";
                  } else if (st.kind === "mixed") {
                    chip = `${st.count} / ${TIME_SLOTS.length}`;
                    cls = "bg-white/15 text-white border border-dashed border-white/30";
                  } else {
                    chip = st.booked > 0 ? "Fermé·Réservé" : "Fermé";
                  }
                  return (
                    <td key={ds} className="px-1.5 py-1.5 text-center">
                      <button
                        disabled={busy}
                        onClick={() => { setSelBarber(barber); setSelDate(ds); }}
                        className={`inline-flex w-full min-w-[64px] items-center justify-center rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors ${cls} ${isSel ? "ring-2 ring-white/60" : ""} ${past ? "opacity-40" : ""}`}
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

      {/* Day quick actions (for selected barber+day) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/8 bg-surface px-4 py-3">
        <div className="text-xs text-muted">
          <span className="font-semibold text-white">{selBarber}</span>
          <span className="capitalize"> · {new Date(selDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
          <span className="ml-1">· {openCount} créneau{openCount > 1 ? "x" : ""} ouvert</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setDayOpen(selBarber, selDate, true)} disabled={busy}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50">
            Ouvrir tout le jour
          </button>
          <button onClick={() => setDayOpen(selBarber, selDate, false)} disabled={busy}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50">
            Fermer tout le jour
          </button>
          <button onClick={() => resetDay(selBarber, selDate)} disabled={busy}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-white disabled:opacity-50">
            Rétablir les règles
          </button>
        </div>
      </div>

      {/* Detail minute slots */}
      <div className="rounded-2xl border border-white/8 bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Créneaux détaillés — {selBarber} <span className="capitalize">· {new Date(selDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
          </p>
          <span className="rounded-full border border-white/10 bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted">
            {openCount} ouvert · {selectedSlots.length - openCount} fermé
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {selectedSlots.map((s) => {
            const clientName = bookingClients[selBarber]?.[selDate]?.[s.time];
            let cls = "border-white/10 bg-surface-2 text-muted hover:bg-surface";
            let title = "Fermé — cliquer pour ouvrir";
            let tag: React.ReactNode = null;
            if (s.booked) {
              cls = "border-amber-400/50 bg-amber-400/20 text-amber-100 cursor-not-allowed";
              title = `Réservé — ${clientName || "client"} (${s.time})`;
              tag = (
                <>
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
                  <span className="align-middle">{s.time}</span>
                  <span className="block text-[9px] font-normal opacity-90">{clientName || "Réservé"}</span>
                </>
              );
            } else if (s.open) {
              cls = "border-white/40 bg-white text-black hover:bg-white/80";
              title = "Ouvert — cliquer pour fermer";
            }
            return (
              <button
                key={s.time}
                onClick={() => toggleSlot(s.time)}
                disabled={busy || s.booked}
                title={title}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-80 ${s.booked ? "cursor-not-allowed" : "cursor-pointer"} ${cls}`}
              >
                {tag || s.time}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Cliquez un créneau pour l'ouvrir/fermer. Utilisez « Ouvrir tout le jour » / « Fermer tout le jour » pour un réglage rapide.
        </p>
      </div>

      {message && (
        <p className={`text-xs ${message.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>{message.text}</p>
      )}
      {loading && <p className="text-center py-8 text-sm text-muted">Chargement...</p>}
      {busy && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-white/10 bg-surface-2 px-4 py-2 text-sm text-white/80 shadow-xl">
          Enregistrement...
        </div>
      )}
    </div>
  );
}

