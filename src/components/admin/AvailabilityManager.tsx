import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

const BARBERS = [
  "Hairbydm",
  "Kenny Cutz",
  "Crespo",
  "Gnk",
  "House.Barber4840",
  "NBCutz4K",
  "Pretty Little Hair",
];

const HOURS = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00",
];

interface Slot {
  barber: string;
  slot_date: string;
  slot_time: string;
  is_available: boolean;
}

interface Booking {
  booking_time: string;
  barber: string;
}

export default function AvailabilityManager() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;

    // Load availability
    const res = await fetch(`/api/availability?date=${d}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSlots(await res.json());

    // Load bookings for this date
    const { data } = await supabase
      .from("bookings")
      .select("booking_time, barber")
      .eq("booking_date", d)
      .in("status", ["pending", "confirmed"]);
    setBookings((data as Booking[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const isBooked = (barber: string, time: string) =>
    bookings.some((b) => b.barber === barber && b.booking_time === time);

  const getSlot = (barber: string, time: string) =>
    slots.find((s) => s.barber === barber && s.slot_time === time);

  const toggleSlot = async (barber: string, time: string) => {
    if (isBooked(barber, time)) return;
    const existing = getSlot(barber, time);
    const newVal = existing ? !existing.is_available : true;

    // Optimistic update
    const prevSlots = [...slots];
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.barber === barber && s.slot_time === time);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], is_available: newVal };
        return next;
      }
      return [...prev, { barber, slot_date: date, slot_time: time, is_available: newVal }];
    });

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { setSlots(prevSlots); return; }

      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ barber, slot_date: date, slot_time: time, is_available: newVal }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Availability save error:", err);
        setSlots(prevSlots);
        alert("Erreur: " + (err.error || "Impossible de sauvegarder"));
        return;
      }
      // Re-fetch to confirm
      load(date);
    } catch (e) {
      console.error("Availability fetch error:", e);
      setSlots(prevSlots);
      alert("Erreur de connexion. Réessayez.");
    }
  };

  const toggleRow = async (barber: string, available: boolean) => {
    setSaving(true);
    const newSlots = HOURS.map((h) => ({ barber, slot_date: date, slot_time: h, is_available: available }));

    // Optimistic
    const prevSlots = [...slots];
    setSlots((prev) => {
      const filtered = prev.filter((s) => s.barber !== barber);
      return [...filtered, ...newSlots];
    });

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { setSlots(prevSlots); setSaving(false); return; }

      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slots: newSlots }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Availability row save error:", err);
        setSlots(prevSlots);
        alert("Erreur: " + (err.error || "Impossible de sauvegarder"));
      } else {
        load(date);
      }
    } catch (e) {
      console.error("Availability row fetch error:", e);
      setSlots(prevSlots);
    }
    setSaving(false);
  };

  const toggleAll = async (available: boolean) => {
    setSaving(true);
    const allSlots = BARBERS.flatMap((b) =>
      HOURS.map((h) => ({ barber: b, slot_date: date, slot_time: h, is_available: available }))
    );

    const prevSlots = [...slots];
    setSlots(allSlots);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { setSlots(prevSlots); setSaving(false); return; }

      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slots: allSlots }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Availability bulk save error:", err);
        setSlots(prevSlots);
        alert("Erreur: " + (err.error || "Impossible de sauvegarder"));
      } else {
        load(date);
      }
    } catch (e) {
      console.error("Availability bulk fetch error:", e);
      setSlots(prevSlots);
    }
    setSaving(false);
  };

  const resetAll = async () => {
    setSaving(true);
    const prevSlots = [...slots];
    setSlots([]);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { setSlots(prevSlots); setSaving(false); return; }

      const res = await fetch("/api/availability", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slot_date: date }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Availability reset error:", err);
        setSlots(prevSlots);
        alert("Erreur: " + (err.error || "Impossible de réinitialiser"));
      }
    } catch (e) {
      console.error("Availability reset error:", e);
      setSlots(prevSlots);
    }
    setSaving(false);
  };

  const copyDay = async (targetDate: string) => {
    setSaving(true);
    const copySlots = slots.map((s) => ({
      ...s,
      slot_date: targetDate,
    }));

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) { setSaving(false); return; }

    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slots: copySlots }),
    });
    setCopyOpen(false);
    setSaving(false);
  };

  const goTo = (delta: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  };

  const dayName = new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const [weekMode, setWeekMode] = useState(false);
  const [weekStart, setWeekStart] = useState(date);

  // Copy whole week from current day
  const copyWeek = async () => {
    setSaving(true);
    const baseDate = new Date(date + "T00:00:00");
    const allCopies = [];

    for (let i = 0; i < 7; i++) {
      const target = new Date(baseDate);
      target.setDate(target.getDate() + i);
      const td = `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,"0")}-${String(target.getDate()).padStart(2,"0")}`;

      const daySlots = slots.map((s) => ({
        ...s,
        slot_date: td,
      }));
      allCopies.push(...daySlots);
    }

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) { setSaving(false); return; }

    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slots: allCopies }),
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => goTo(-1)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-sm font-medium text-white capitalize min-w-[180px] text-center">{dayName}</span>
          <button onClick={() => goTo(1)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ml-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white cursor-pointer"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => toggleAll(true)} disabled={saving}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
            Tout ouvrir
          </button>
          <button onClick={() => toggleAll(false)} disabled={saving}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50">
            Tout fermer
          </button>
          <button onClick={resetAll} disabled={saving}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-600/20 text-zinc-400 hover:bg-zinc-600/30 hover:text-zinc-300 transition-colors disabled:opacity-50">
            Tout Non défini
          </button>
          <div className="relative">
            <button onClick={() => setCopyOpen(!copyOpen)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors">
              Copier ce jour ▾
            </button>
            {copyOpen && (
              <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-20 overflow-hidden min-w-[200px]">
                <button onClick={() => { const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() + 1); copyDay(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                  → Demain
                </button>
                <button onClick={() => { const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() + 7); copyDay(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                  → Dans 7 jours
                </button>
                <button onClick={copyWeek}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors border-t border-zinc-700">
                  → Copier la semaine complète
                </button>
                <button onClick={() => setCopyOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-700 transition-colors border-t border-zinc-700">
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50"></span> Disponible</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50"></span> Fermé</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-600/30 border border-zinc-600/50"></span> Non défini</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50"></span> Réservé</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Chargement...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-zinc-500 px-2 py-2 min-w-[140px]">Coiffeur</th>
                {HOURS.map((h) => (
                  <th key={h} className="text-center text-[10px] font-medium text-zinc-500 px-0.5 py-2 min-w-[44px]">{h}</th>
                ))}
                <th className="text-center text-xs font-medium text-zinc-500 px-2 py-2 min-w-[60px]">Row</th>
              </tr>
            </thead>
            <tbody>
              {BARBERS.map((barber) => (
                <tr key={barber} className="border-t border-zinc-800/50">
                  <td className="px-2 py-1.5 text-xs font-medium text-zinc-300 whitespace-nowrap">{barber}</td>
                  {HOURS.map((h) => {
                    const slot = getSlot(barber, h);
                    const booked = isBooked(barber, h);
                    let bg = "bg-zinc-800/40 hover:bg-zinc-700/60"; // default (undefined)
                    let border = "border-zinc-700/30";
                    if (booked) {
                      bg = "bg-amber-500/20";
                      border = "border-amber-500/40";
                    } else if (slot?.is_available) {
                      bg = "bg-emerald-500/20 hover:bg-emerald-500/30";
                      border = "border-emerald-500/40";
                    } else if (slot && !slot.is_available) {
                      bg = "bg-red-500/15 hover:bg-red-500/25";
                      border = "border-red-500/30";
                    }
                    return (
                      <td key={h} className="px-0.5 py-1">
                        <button
                          onClick={() => toggleSlot(barber, h)}
                          disabled={booked}
                          title={booked ? "Réservé" : slot?.is_available ? "Disponible — cliquer pour fermer" : "Fermé — cliquer pour ouvrir"}
                          className={`w-full h-8 rounded border transition-all duration-100 ${bg} ${border} ${booked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-1 py-1">
                    <div className="flex gap-0.5 justify-center">
                      <button onClick={() => toggleRow(barber, true)} disabled={saving}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                        title="Tout ouvrir pour ce coiffeur">✓</button>
                      <button onClick={() => toggleRow(barber, false)} disabled={saving}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                        title="Tout fermer pour ce coiffeur">✗</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {saving && (
        <div className="fixed bottom-4 right-4 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-300 shadow-xl z-50">
          Sauvegarde...
        </div>
      )}
    </div>
  );
}
