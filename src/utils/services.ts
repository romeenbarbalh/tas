export interface Service {
  id: string;
  category: string;
  name: { fr: string; en: string };
  priceEur: string;
  priceDzd: string;
  duration: { fr: string; en: string };
  description: { fr: string; en: string };
  sort_order?: number;
}

export const CATEGORIES = [
  { id: "men", label: { fr: "Homme / Barbier", en: "Men / Barber" } },
  { id: "women", label: { fr: "Femme / Coiffure", en: "Women / Styling" } },
  { id: "braids", label: { fr: "Tresses / Braids", en: "Braids / Tresses" } },
] as const;

export async function fetchServices(): Promise<Service[]> {
  try {
    const res = await fetch("/api/services/", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`services fetch failed: ${res.status}`);
    const json = await res.json();
    if (json && Array.isArray(json.services)) {
      return json.services as Service[];
    }
    return [];
  } catch {
    return [];
  }
}
