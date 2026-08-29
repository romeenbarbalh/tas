-- =============================================
-- The Ark Studio — Services table
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'men',
  name_fr TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  price_eur TEXT NOT NULL DEFAULT '',
  price_dzd TEXT NOT NULL DEFAULT '',
  duration_fr TEXT NOT NULL DEFAULT '',
  duration_en TEXT NOT NULL DEFAULT '',
  description_fr TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Public can read services (the website shows them)
CREATE POLICY "Public read services"
  ON services FOR SELECT
  TO anon
  USING (true);

-- Authenticated (admin) can do everything
CREATE POLICY "Authenticated full access on services"
  ON services FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_services_category ON services (category, sort_order);

-- Seed the 17 current services
INSERT INTO services (id, category, name_fr, name_en, price_eur, price_dzd, duration_fr, duration_en, description_fr, description_en, sort_order) VALUES
('contour-barbe', 'men', 'Contour / Taille de barbe', 'Beard trim / shaping', '10€', '20 DA', '10–20 min', '10–20 min', 'Taille et mise en forme de la barbe', 'Beard trimming and shaping', 1),
('coupe-enfant', 'men', 'Coupe enfant', 'Kids cut', '10€', '35 DA', '30 min', '30 min', 'Coupe pour enfants (garçons)', 'Haircut for kids (boys)', 2),
('coupe-adulte', 'men', 'Coupe adulte', 'Men''s cut', '15€', '40–45 DA', '30–45 min', '30–45 min', 'Coupe homme complète', 'Complete men''s haircut', 3),
('coupe-adulte-barbe', 'men', 'Coupe adulte + Barbe', 'Men''s cut + beard', '20€', '40–45 DA', '45–60 min', '45–60 min', 'Coupe + taille de barbe', 'Haircut + beard trim', 4),
('placage-brushing', 'women', 'Placage / Brushing', 'Blowout / straightening', '25€', '1h', '1h', '1h', 'Lissage et mise en forme', 'Straightening and styling', 1),
('knotless-braids-jumbo', 'braids', 'Knotless Braids (Jumbo)', 'Knotless Braids (Jumbo)', '70€', '3h30', '3h30', '3h30', 'Tresses sans nœuds, grosses mèches', 'Knotless braids, jumbo size', 1),
('knotless-twist-jumbo', 'braids', 'Knotless Twist (Jumbo)', 'Knotless Twist (Jumbo)', '70€', '3h30', '3h30', '3h30', 'Twists sans nœuds, grosses mèches', 'Knotless twists, jumbo size', 2),
('island-twist-large', 'braids', 'Island Twist (Large)', 'Island Twist (Large)', '80€', '4h30', '4h30', '4h30', 'Twists style îles, grosses mèches', 'Island style twists, large', 3),
('fulani-braids-classic', 'braids', 'Fulani Braids (Classic)', 'Fulani Braids (Classic)', '80€', '5h', '5h', '5h', 'Tresses peul traditionnelles', 'Traditional Fulani braids', 4),
('soft-locs-classic', 'braids', 'Soft Locs (Classic)', 'Soft Locs (Classic)', '75€+', '5h', '5h', '5h', 'Locs doux, départ classique', 'Soft locs, classic start', 5),
('cornrows', 'braids', 'Cornrows', 'Cornrows', '60€+', '3h', '3h', '3h', 'Tresses plaquées', 'Flat braids', 6),
('french-curls-large', 'braids', 'French Curls (Large)', 'French Curls (Large)', '75€', '5h', '5h', '5h', 'Boucles françaises, grosses mèches', 'French curls, large size', 7),
('barrel-twist', 'braids', 'Barrel Twist / Vanilles', 'Barrel Twist', '50€', '1h30', '1h30', '1h30', 'Twists en baril / vanilles', 'Barrel twists', 8),
('retwist-simple', 'braids', 'Retwist simple', 'Simple retwist', '50€+', '45 min', '45 min', '45 min', 'Resserrage des racines', 'Root tightening', 9),
('knotless-braids-hairbydm', 'braids', 'Knotless Braids (Hairbydm)', 'Knotless Braids (Hairbydm)', '80€', '4h', '4h', '4h', 'Spécialité Hairbydm', 'Hairbydm specialty', 10),
('depart-locks-peigne', 'braids', 'Départ Locks au peigne', 'Comb coils locs start', '110€', '2h30', '2h30', '2h30', 'Début de locks au peigne', 'Comb coils starter locs', 11),
('depart-locks-crochet', 'braids', 'Départ Locks crochet instantané', 'Instant crochet locs start', '180€', '4h', '4h', '4h', 'Locks instantanés au crochet', 'Instant crochet locs', 12)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  price_eur = EXCLUDED.price_eur,
  price_dzd = EXCLUDED.price_dzd,
  duration_fr = EXCLUDED.duration_fr,
  duration_en = EXCLUDED.duration_en,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order;
