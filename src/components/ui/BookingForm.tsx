import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";

interface Service {
  id: string;
  category: string;
  name: { fr: string; en: string };
  priceEur: string;
  priceDzd: string;
  duration: { fr: string; en: string };
}

interface TeamMember {
  id: string;
  name: string;
  role: { fr: string; en: string };
  specialty: { fr: string; en: string };
  services: string[];
}

interface Props {
  locale: "fr" | "en";
  services: Service[];
  team: TeamMember[];
}

const T: Record<string, Record<string, string>> = {
  fr: {
    services: "Services",
    barber: "Coiffeur",
    date: "Date",
    time: "Heure",
    name: "Nom",
    phone: "Téléphone",
    notes: "Notes",
    submit: "Confirmer",
    submitting: "Envoi...",
    success: "Réservation envoyée ! Nous vous contacterons pour confirmer.",
    error: "Erreur. Réessayez.",
    required: "Requis",
    invalidPhone: "Numéro invalide",
    selectServices: "Choisir des services",
    selectBarber: "Choisir un coiffeur",
    selectTime: "Choisir une heure",
    noSlots: "Aucun créneau",
    notesPh: "Optionnel",
    total: "Total",
    selected: "sélectionné",
    noServices: "Aucun service choisi",
  },
  en: {
    services: "Services",
    barber: "Barber",
    date: "Date",
    time: "Time",
    name: "Name",
    phone: "Phone",
    notes: "Notes",
    submit: "Confirm",
    submitting: "Sending...",
    success: "Sent!",
    error: "Error. Try again.",
    required: "Required",
    invalidPhone: "Invalid number",
    selectServices: "Select services",
    selectBarber: "Select barber",
    selectTime: "Select time",
    noSlots: "No slots",
    notesPh: "Optional",
    total: "Total",
    selected: "selected",
    noServices: "No services chosen",
  },
};

const CATEGORIES = [
  { id: "men", label: { fr: "Homme", en: "Men" } },
  { id: "women", label: { fr: "Femme", en: "Women" } },
  { id: "braids", label: { fr: "Tresses", en: "Braids" } },
];

function parsePrice(raw: string): { min: number; max: number } {
  const nums = raw.replace(/[^\d\-]/g, "").split("-").map(Number).filter(Boolean);
  if (nums.length >= 2) return { min: nums[0], max: nums[1] };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: 0, max: 0 };
}

const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let h = 9; h < 20; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  slots.push("20:00");
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

/* ─── Single Select ─── */
interface Opt {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
}

function Select({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled,
  error,
  id,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Opt[];
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setHighlight(-1); }, [open]);

  const selected = options.find((o) => o.value === value);

  const handleKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && highlight >= 0) {
        const avail = options.filter((o) => !o.disabled);
        if (avail[highlight]) { onChange(avail[highlight].value); setOpen(false); }
      } else {
        setOpen(!open);
      }
    }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) { setOpen(true); return; } setHighlight((h) => (h + 1) >= options.length ? 0 : h + 1); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h <= 0 ? options.length - 1 : h - 1)); }
  };

  let itemIdx = -1;
  const groups = [...new Set(options.filter((o) => o.group).map((o) => o.group))];

  const renderItems = (opts: Opt[]) =>
    opts.map((o) => {
      itemIdx++;
      const idx = itemIdx;
      return (
        <button
          key={o.value}
          type="button"
          role="option"
          aria-selected={o.value === value}
          disabled={o.disabled}
          onClick={() => { onChange(o.value); setOpen(false); }}
          onMouseEnter={() => setHighlight(idx)}
          className={[
            "w-full text-left px-3.5 py-2 text-sm transition-colors duration-100",
            o.value === value ? "bg-gold/8 text-gold font-medium" : highlight === idx ? "bg-bg-elevated" : "text-text hover:bg-bg-elevated/60",
            o.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
        >
          {o.label}
        </button>
      );
    });

  return (
    <div ref={ref} className="relative">
      <label htmlFor={id} className="block text-xs font-medium text-text-muted mb-1 tracking-wide uppercase">{label}</label>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm text-left transition-all duration-200 outline-none",
          disabled ? "bg-bg-elevated/50 border-border-light text-text-dim cursor-not-allowed" : "bg-white border-border hover:border-gold/40 focus:border-gold focus:ring-2 focus:ring-gold/15 cursor-pointer",
          error ? "border-error focus:border-error focus:ring-error/15" : "",
        ].join(" ")}
      >
        <span className={!selected ? "text-text-dim" : ""}>{selected ? selected.label : placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 ml-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className={[
        "absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-white shadow-xl shadow-black/8 overflow-hidden transition-all duration-200 ease-out origin-top",
        open ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-0 pointer-events-none",
      ].join(" ")} role="listbox">
        <div className="max-h-56 overflow-y-auto py-1 overscroll-contain">
          {groups.length > 0
            ? groups.map((g) => (
                <div key={g}>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-text-dim">{g}</div>
                  {renderItems(options.filter((o) => o.group === g))}
                </div>
              ))
            : renderItems(options)}
          {options.length === 0 && <div className="px-3.5 py-3 text-sm text-text-dim text-center">—</div>}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}

/* ─── Multi-Select (Services with checkboxes) ─── */
interface MsOpt {
  value: string;
  label: string;
  price: string;
  priceMin: number;
  priceMax: number;
  group?: string;
}

function MultiSelect({
  label,
  options,
  selected,
  onToggle,
  placeholder,
  error,
  id,
  tl,
}: {
  label: string;
  options: MsOpt[];
  selected: string[];
  onToggle: (v: string) => void;
  placeholder: string;
  error?: string;
  id?: string;
  tl: (k: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const groups = [...new Set(options.filter((o) => o.group).map((o) => o.group))];
  let itemIdx = -1;

  const renderItem = (o: MsOpt) => {
    itemIdx++;
    const checked = selected.includes(o.value);
    return (
      <button
        key={o.value}
        type="button"
        role="option"
        aria-selected={checked}
        onClick={() => onToggle(o.value)}
        className={[
          "w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors duration-100 cursor-pointer",
          checked ? "bg-gold/8" : "hover:bg-bg-elevated/60",
        ].join(" ")}
      >
        {/* Checkbox */}
        <span className={[
          "shrink-0 w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all duration-200",
          checked ? "bg-gold border-gold" : "border-border-light",
        ].join(" ")}>
          {checked && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="animate-in">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span className={`flex-1 text-left ${checked ? "text-text font-medium" : "text-text"}`}>{o.label}</span>
        <span className="text-xs text-gold font-medium whitespace-nowrap">{o.price}</span>
      </button>
    );
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-text-muted mb-1 tracking-wide uppercase">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm text-left transition-all duration-200 outline-none",
          "bg-white border-border hover:border-gold/40 focus:border-gold focus:ring-2 focus:ring-gold/15 cursor-pointer",
          error ? "border-error focus:border-error focus:ring-error/15" : "",
        ].join(" ")}
      >
        <span className={selected.length === 0 ? "text-text-dim" : ""}>
          {selected.length === 0 ? placeholder : `${selected.length} ${tl("selected")}`}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 ml-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className={[
        "absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-white shadow-xl shadow-black/8 overflow-hidden transition-all duration-200 ease-out origin-top",
        open ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-0 pointer-events-none",
      ].join(" ")} role="listbox" aria-multiselectable>
        <div className="max-h-64 overflow-y-auto py-1 overscroll-contain">
          {groups.length > 0
            ? groups.map((g) => (
                <div key={g}>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-text-dim">{g}</div>
                  {options.filter((o) => o.group === g).map(renderItem)}
                </div>
              ))
            : options.map(renderItem)}
          {options.length === 0 && <div className="px-3.5 py-3 text-sm text-text-dim text-center">—</div>}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}

/* ─── Main Form ─── */
export default function BookingForm({ locale, services, team }: Props) {
  const tl = (k: string) => T[locale][k] || k;

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState({ barberId: "", date: "", time: "", name: "", phone: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [filteredBarbers, setFilteredBarbers] = useState<TeamMember[]>(team);
  const [availableSlots, setAvailableSlots] = useState<string[]>(TIME_SLOTS);

  // Listen for pre-select from ServiceCard
  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      const id = e.detail;
      if (id && !selectedServices.includes(id)) {
        setSelectedServices((prev) => [...prev, id]);
      }
    };
    window.addEventListener("arc:select-service", handler as EventListener);
    return () => window.removeEventListener("arc:select-service", handler as EventListener);
  }, [selectedServices]);

  // Filter barbers based on selected services
  useEffect(() => {
    if (selectedServices.length > 0) {
      const bars = team.filter((m) => selectedServices.some((sid) => m.services.includes(sid)));
      setFilteredBarbers(bars.length > 0 ? bars : team);
      if (formData.barberId && !bars.some((b) => b.id === formData.barberId)) {
        setFormData((p) => ({ ...p, barberId: "", time: "" }));
      }
    } else {
      setFilteredBarbers(team);
    }
  }, [selectedServices, team]);

  useEffect(() => {
    if (formData.date && formData.barberId) {
      // Fetch taken slots from Supabase for this date + barber
      supabase
        .from("bookings")
        .select("booking_time")
        .eq("booking_date", formData.date)
        .eq("barber", team.find((t) => t.id === formData.barberId)?.name || "")
        .in("status", ["pending", "confirmed"])
        .then(({ data }) => {
          const taken = (data || []).map((r) => r.booking_time);
          setAvailableSlots(TIME_SLOTS.filter((s) => !taken.includes(s)));
          if (formData.time && taken.includes(formData.time)) setFormData((p) => ({ ...p, time: "" }));
        });
    } else {
      setAvailableSlots(TIME_SLOTS);
    }
  }, [formData.date, formData.barberId]);

  const toggleService = useCallback((id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const removeService = useCallback((id: string) => {
    setSelectedServices((prev) => prev.filter((s) => s !== id));
  }, []);

  const selectedServiceObjects = services.filter((s) => selectedServices.includes(s.id));

  const total = selectedServiceObjects.reduce(
    (acc, s) => {
      const p = parsePrice(s.priceEur);
      return { min: acc.min + p.min, max: acc.max + p.max };
    },
    { min: 0, max: 0 }
  );

  const totalDisplay = total.min === total.max
    ? `${total.min}€`
    : `${total.min}–${total.max}€`;

  const validate = (name: string, value: string): string => {
    if (!value.trim()) return tl("required");
    if (name === "phone" && !/^[\d\s+()-]{8,}$/.test(value)) return tl("invalidPhone");
    return "";
  };

  const set = (field: string, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: validate(field, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (selectedServices.length === 0) errs.services = tl("required");
    (["barberId", "date", "time", "name", "phone"] as const).forEach((f) => {
      const err = validate(f, formData[f]);
      if (err) errs[f] = err;
    });
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setStatus("submitting");

    const barberName = team.find((t) => t.id === formData.barberId)?.name || "";
    const serviceNames = selectedServiceObjects.map((s) => s.name[locale]);

    const { error: dbError } = await supabase.from("bookings").insert({
      client_name: formData.name,
      client_phone: formData.phone,
      client_email: "",
      services: serviceNames,
      total_price: total.min,
      booking_date: formData.date,
      booking_time: formData.time,
      barber: barberName,
      notes: formData.notes || null,
      status: "pending",
    });

    if (dbError) {
      console.error("Booking save error:", dbError);
      setStatus("error");
      return;
    }

    setStatus("success");
    setSelectedServices([]);
    setFormData({ barberId: "", date: "", time: "", name: "", phone: "", notes: "" });
    setFilteredBarbers(team);
    setAvailableSlots(TIME_SLOTS);
    setTimeout(() => setStatus("idle"), 3000);
  };

  const serviceOptions: MsOpt[] = CATEGORIES.flatMap((cat) =>
    services
      .filter((s) => s.category === cat.id)
      .map((s) => ({
        value: s.id,
        label: s.name[locale],
        price: s.priceEur,
        priceMin: parsePrice(s.priceEur).min,
        priceMax: parsePrice(s.priceEur).max,
        group: cat.label[locale],
      }))
  );

  const barberOptions: Opt[] = filteredBarbers.map((b) => ({
    value: b.id,
    label: `${b.name} — ${b.role[locale]}`,
  }));

  const timeOptions: Opt[] = availableSlots.map((s) => ({ value: s, label: s }));
  const minDate = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {status === "success" && (
        <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium text-center animate-in">
          {tl("success")}
        </div>
      )}
      {status === "error" && (
        <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium text-center animate-in">
          {tl("error")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
        {/* Multi-select services */}
        <div className="md:col-span-2">
          <MultiSelect
            id="services"
            label={tl("services")}
            options={serviceOptions}
            selected={selectedServices}
            onToggle={toggleService}
            placeholder={tl("selectServices")}
            error={errors.services}
            tl={tl}
          />
        </div>

        {/* Selected services chips + total */}
        {selectedServices.length > 0 && (
          <div className="md:col-span-2 animate-in">
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedServiceObjects.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-gold/8 border border-gold/15 text-sm text-text"
                >
                  <span className="font-medium">{s.name[locale]}</span>
                  <span className="text-gold text-xs">{s.priceEur}</span>
                  <button
                    type="button"
                    onClick={() => removeService(s.id)}
                    className="shrink-0 ml-0.5 w-5 h-5 rounded-full flex items-center justify-center text-text-dim hover:bg-gold/15 hover:text-gold transition-colors"
                    aria-label={`Remove ${s.name[locale]}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-bg-elevated/60 border border-border-light">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">{tl("total")}</span>
              <span className="text-sm font-bold text-gold">{totalDisplay}</span>
            </div>
          </div>
        )}

        <Select
          id="barberId"
          label={tl("barber")}
          value={formData.barberId}
          placeholder={selectedServices.length > 0 ? tl("selectBarber") : tl("selectServices")}
          options={barberOptions}
          onChange={(v) => set("barberId", v)}
          disabled={selectedServices.length === 0}
          error={errors.barberId}
        />

        <div>
          <label htmlFor="date" className="block text-xs font-medium text-text-muted mb-1 tracking-wide uppercase">{tl("date")}</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={(e) => set("date", e.target.value)}
            min={minDate}
            disabled={!formData.barberId}
            className={[
              "w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none",
              !formData.barberId ? "bg-bg-elevated/50 border-border-light text-text-dim cursor-not-allowed" : "bg-white border-border hover:border-gold/40 focus:border-gold focus:ring-2 focus:ring-gold/15",
              errors.date ? "border-error focus:border-error focus:ring-error/15" : "",
            ].join(" ")}
          />
          {errors.date && <p className="mt-1 text-xs text-error">{errors.date}</p>}
        </div>

        <Select
          id="time"
          label={tl("time")}
          value={formData.time}
          placeholder={tl("selectTime")}
          options={timeOptions}
          onChange={(v) => set("time", v)}
          disabled={!formData.date}
          error={errors.time}
        />

        <div>
          <label htmlFor="name" className="block text-xs font-medium text-text-muted mb-1 tracking-wide uppercase">{tl("name")}</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            className={[
              "w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none bg-white border-border hover:border-gold/40 focus:border-gold focus:ring-2 focus:ring-gold/15",
              errors.name ? "border-error focus:border-error focus:ring-error/15" : "",
            ].join(" ")}
          />
          {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-medium text-text-muted mb-1 tracking-wide uppercase">{tl("phone")}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={(e) => set("phone", e.target.value)}
            autoComplete="tel"
            className={[
              "w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none bg-white border-border hover:border-gold/40 focus:border-gold focus:ring-2 focus:ring-gold/15",
              errors.phone ? "border-error focus:border-error focus:ring-error/15" : "",
            ].join(" ")}
          />
          {errors.phone && <p className="mt-1 text-xs text-error">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-xs font-medium text-text-muted mb-1 tracking-wide uppercase">{tl("notes")}</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={tl("notesPh")}
          rows={2}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm resize-none bg-white hover:border-gold/40 focus:border-gold focus:ring-2 focus:ring-gold/15 outline-none transition-all duration-200"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full py-3 rounded-xl bg-gold text-bg text-sm font-semibold transition-all duration-200 hover:bg-gold-light active:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? tl("submitting") : tl("submit")}
      </button>

      <p className="text-center text-[11px] text-text-dim">
        {locale === "fr"
          ? "En soumettant, vous acceptez d'être contacté pour confirmer."
          : "By submitting, you agree to be contacted to confirm."}
      </p>
    </form>
  );
}
