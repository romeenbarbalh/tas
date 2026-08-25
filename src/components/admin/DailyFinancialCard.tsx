import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "../../lib/supabase";

interface Booking {
  id: string;
  client_name: string;
  services: string[];
  total_price: number;
  booking_date: string;
  status: "pending" | "confirmed" | "cancelled";
}

interface FinancialData {
  caTTC: number;
  tvaTotal: number;
  caHT: number;
  panierMoyen: number;
  nbBookings: number;
  caPrestationsTTC: number;
  caPrestationsHT: number;
  tvaPrestations: number;
  caProduitsTTC: number;
  caProduitsHT: number;
  tvaProduits: number;
  caDiversTTC: number;
  caDiversHT: number;
  tvaDivers: number;
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calculateData(bookings: Booking[]): FinancialData {
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const totalTTC = confirmed.reduce((s, b) => s + (b.total_price || 0), 0);
  const nb = confirmed.length;

  const tvaPrestationsRate = 0.06;
  const tvaProduitsRate = 0.21;

  let caPrestationsTTC = 0;
  let caProduitsTTC = 0;
  let caDiversTTC = 0;

  for (const b of confirmed) {
    const price = b.total_price || 0;
    const svcs = b.services || [];
    const hasProduct = svcs.some((s) => /produit|product|shampo|shampoo|soin|wax|gel|spray|huile|oil/i.test(s));
    const hasDivers = svcs.some((s) => /divers|autre|other|misc/i.test(s));

    if (hasDivers) {
      caDiversTTC += price;
    } else if (hasProduct) {
      caProduitsTTC += price;
    } else {
      caPrestationsTTC += price;
    }
  }

  const caPrestationsHT = caPrestationsTTC / (1 + tvaPrestationsRate);
  const tvaPrestations = caPrestationsTTC - caPrestationsHT;

  const caProduitsHT = caProduitsTTC / (1 + tvaProduitsRate);
  const tvaProduits = caProduitsTTC - caProduitsHT;

  const caDiversHT = caDiversTTC;
  const tvaDivers = 0;

  const tvaTotal = tvaPrestations + tvaProduits + tvaDivers;
  const caHT = caPrestationsHT + caProduitsHT + caDiversHT;
  const panierMoyen = nb > 0 ? totalTTC / nb : 0;

  return {
    caTTC: totalTTC,
    tvaTotal,
    caHT,
    panierMoyen,
    nbBookings: nb,
    caPrestationsTTC,
    caPrestationsHT,
    tvaPrestations,
    caProduitsTTC,
    caProduitsHT,
    tvaProduits,
    caDiversTTC,
    caDiversHT,
    tvaDivers,
  };
}

function generateCSV(data: FinancialData, dateStr: string): string {
  const rows = [
    ["Résumé financier", dateStr],
    [""],
    ["Indicateur", "Montant TTC (€)", "TVA (€)", "Montant HT (€)"],
    ["Chiffre d'affaires TTC", fmt(data.caTTC), fmt(data.tvaTotal), fmt(data.caHT)],
    ["Panier moyen", fmt(data.panierMoyen), "", ""],
    ["Nombre de réservations", String(data.nbBookings), "", ""],
    [""],
    ["Détail", "TTC (€)", "TVA (€)", "HT (€)"],
    ["CA Prestations (TVA 6%)", fmt(data.caPrestationsTTC), fmt(data.tvaPrestations), fmt(data.caPrestationsHT)],
    ["CA Produits (TVA 21%)", fmt(data.caProduitsTTC), fmt(data.tvaProduits), fmt(data.caProduitsHT)],
    ["CA Divers", fmt(data.caDiversTTC), fmt(data.tvaDivers), fmt(data.caDiversHT)],
  ];
  return rows.map((r) => r.join(";")).join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DailyFinancialCard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (date: Date) => {
    setLoading(true);
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      return;
    }
    const dateStr = toISODate(date);
    const { data: bookings } = await client
      .from("bookings")
      .select("*")
      .eq("booking_date", dateStr);

    if (bookings && bookings.length > 0) {
      setData(calculateData(bookings as Booking[]));
    } else {
      setData({
        caTTC: 0, tvaTotal: 0, caHT: 0, panierMoyen: 0, nbBookings: 0,
        caPrestationsTTC: 0, caPrestationsHT: 0, tvaPrestations: 0,
        caProduitsTTC: 0, caProduitsHT: 0, tvaProduits: 0,
        caDiversTTC: 0, caDiversHT: 0, tvaDivers: 0,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const today = () => setSelectedDate(new Date());

  const handleExport = () => {
    if (!data) return;
    const dateStr = toISODate(selectedDate);
    const csv = generateCSV(data, dateStr);
    downloadCSV(csv, `resume-financier-${dateStr}.csv`);
  };

  const isToday = toISODate(selectedDate) === toISODate(new Date());
  const dateLabel = selectedDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 pt-6 pb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Résumé</h2>
          <p className="text-sm text-zinc-400 mt-0.5 capitalize">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevDay}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            aria-label="Jour précédent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          {!isToday && (
            <button
              onClick={today}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              Aujourd'hui
            </button>
          )}
          <button
            onClick={nextDay}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            aria-label="Jour suivant"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-6 pb-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-zinc-800 rounded-lg w-1/3" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-zinc-800 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : !data ? (
        <div className="px-6 pb-6 text-sm text-zinc-500 text-center py-8">
          Supabase non configuré
        </div>
      ) : (
        <>
          {/* Main KPIs */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPI label="Chiffre d'affaires TTC" value={`${fmt(data.caTTC)} €`} color="text-emerald-400" />
              <KPI label="TVA" value={`${fmt(data.tvaTotal)} €`} color="text-amber-400" />
              <KPI label="Chiffre d'affaires HT" value={`${fmt(data.caHT)} €`} color="text-blue-400" />
              <KPI label="Panier moyen" value={`${fmt(data.panierMoyen)} €`} color="text-zinc-200" sub={`${data.nbBookings} réservation${data.nbBookings !== 1 ? "s" : ""}`} />
            </div>
          </div>

          {/* Breakdown */}
          <div className="px-6 pb-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Détail par catégorie</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <BreakdownRow
                label="Prestations"
                tva="6%"
                ttc={data.caPrestationsTTC}
                ht={data.caPrestationsHT}
                tvaAmt={data.tvaPrestations}
                accent="border-emerald-500/30"
              />
              <BreakdownRow
                label="Produits"
                tva="21%"
                ttc={data.caProduitsTTC}
                ht={data.caProduitsHT}
                tvaAmt={data.tvaProduits}
                accent="border-blue-500/30"
              />
              <BreakdownRow
                label="Divers"
                tva="—"
                ttc={data.caDiversTTC}
                ht={data.caDiversHT}
                tvaAmt={data.tvaDivers}
                accent="border-zinc-600"
              />
            </div>
          </div>

          {/* Export */}
          <div className="px-6 pb-6">
            <button
              onClick={handleExport}
              className="w-full py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium text-sm rounded-xl hover:bg-zinc-700 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exporter les données comptables
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function KPI({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3.5">
      <p className="text-[11px] text-zinc-500 mb-1 leading-tight">{label}</p>
      <p className={`text-lg font-bold ${color} leading-tight`}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function BreakdownRow({
  label, tva, ttc, ht, tvaAmt, accent,
}: {
  label: string; tva: string; ttc: number; ht: number; tvaAmt: number; accent: string;
}) {
  return (
    <div className={`bg-zinc-800/50 border-l-2 ${accent} rounded-xl p-3.5 space-y-1.5`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        <span className="text-[10px] font-medium text-zinc-500 bg-zinc-700/50 px-1.5 py-0.5 rounded">TVA {tva}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-zinc-500">TTC</p>
          <p className="text-zinc-200 font-medium">{fmt(ttc)} €</p>
        </div>
        <div>
          <p className="text-zinc-500">TVA</p>
          <p className="text-amber-400 font-medium">{fmt(tvaAmt)} €</p>
        </div>
        <div>
          <p className="text-zinc-500">HT</p>
          <p className="text-zinc-200 font-medium">{fmt(ht)} €</p>
        </div>
      </div>
    </div>
  );
}
