export const salon = {
  name: "The Ark Studio",
  tagline: {
    fr: "Votre style, notre signature",
    en: "Your style, our signature",
  },
  description: {
    fr: "Salon moderne et multi-services, accueillant hommes, femmes et enfants dans une atmosphère chaleureuse et élégante. Une équipe experte propose des services personnalisés pour chaque type de cheveux et chaque besoin.",
    en: "Modern multi-service salon welcoming men, women, and children in a warm and elegant atmosphere. An expert team offers personalized services for every hair type and need.",
  },
  address: "Rue de la station 23, 4800 Verviers, Belgium",
  phone: "+32 4 XX XX XX XX",
  email: "contact@thearkstudio.be",
  instagram: "https://www.instagram.com/thearkstudio__/",
  instagramWomen: "https://instagram.com/thearkwomen",
  coordinates: { lat: 50.5906, lng: 5.8628 },
  rating: {
    overall: 4.7,
    count: 28,
    breakdown: {
      welcome: 4.8,
      cleanliness: 4.7,
      atmosphere: 4.7,
      quality: 4.7,
    },
  },
  hours: {
    mon: { open: "10:00", close: "20:00", closed: false },
    tue: { open: "", close: "", closed: true },
    wed: { open: "10:00", close: "20:00", closed: false },
    thu: { open: "10:00", close: "20:00", closed: false },
    fri: { open: "10:00", close: "21:00", closed: false },
    sat: { open: "10:00", close: "21:00", closed: false },
    sun: { open: "13:00", close: "20:00", closed: false },
  },
  values: [
    { title: "Expertise", desc: { fr: "Équipe formée aux dernières techniques", en: "Team trained in latest techniques" } },
    { title: "Ambiance", desc: { fr: "Espace chaleureux et soigné", en: "Warm and curated space" } },
    { title: "Inclusif", desc: { fr: "Hommes, femmes, enfants bienvenus", en: "Men, women, children welcome" } },
    { title: "Qualité", desc: { fr: "Produits pros, résultats durables", en: "Pro products, lasting results" } },
  ],
};

export const team = [
  {
    id: "hairbydm",
    name: "Hairbydm",
    role: {
      fr: "Spécialiste tresses & tissages",
      en: "Braids & weaves specialist",
    },
    specialty: {
      fr: "Nattes, Locks, Knotless Braids...",
      en: "Cornrows, Locks, Knotless Braids...",
    },
    services: ["knotless-braids-hairbydm"],
    instagram: "https://instagram.com/hairbydm",
    image: "/images/team/hairbydm.svg",
  },
  {
    id: "kenny-cutz",
    name: "Kenny Cutz",
    role: {
      fr: "Barbier — Coupes homme & enfant",
      en: "Barber — Men's & kids cuts",
    },
    specialty: {
      fr: "Coupes précises 4K",
      en: "Precision 4K cuts",
    },
    services: ["coupe-adulte", "coupe-enfant", "coupe-adulte-barbe"],
    instagram: "https://instagram.com/kennycutz",
    image: "/images/team/kenny-cutz.svg",
  },
  {
    id: "crespo",
    name: "Crespo",
    role: {
      fr: "Barbier — Coupes homme & enfant",
      en: "Barber — Men's & kids cuts",
    },
    specialty: {
      fr: "Coupes précises",
      en: "Precision cuts",
    },
    services: ["coupe-adulte", "coupe-enfant", "coupe-adulte-barbe"],
    instagram: "https://instagram.com/crespo",
    image: "/images/team/crespo.svg",
  },
  {
    id: "gnk",
    name: "Gnk",
    role: {
      fr: "Barbier — Coupes homme & enfant",
      en: "Barber — Men's & kids cuts",
    },
    specialty: {
      fr: "Coupes précises",
      en: "Precision cuts",
    },
    services: ["coupe-adulte", "coupe-enfant", "coupe-adulte-barbe"],
    instagram: "https://instagram.com/gnk",
    image: "/images/team/gnk.svg",
  },
  {
    id: "house-barber",
    name: "House.Barber4840",
    role: {
      fr: "Barbier — Tous âges",
      en: "Barber — All ages",
    },
    specialty: {
      fr: "Coupes précises pour tous les âges",
      en: "Precision cuts for all ages",
    },
    services: ["coupe-adulte", "coupe-enfant", "coupe-adulte-barbe", "contour-barbe"],
    instagram: "https://instagram.com/house.barber4840",
    image: "/images/team/house-barber.svg",
  },
  {
    id: "nbcutz",
    name: "NBCutz4K",
    role: {
      fr: "Barbier — Haute précision",
      en: "Barber — High precision",
    },
    specialty: {
      fr: "Qualité 4K, détails parfaits",
      en: "4K quality, perfect details",
    },
    services: ["coupe-adulte", "coupe-enfant", "coupe-adulte-barbe", "contour-barbe"],
    instagram: "https://instagram.com/nbcutz4k",
    image: "/images/team/nbcutz.svg",
  },
  {
    id: "pretty-little-hair",
    name: "Pretty Little Hair",
    role: {
      fr: "Coiffeuse — Espace femmes",
      en: "Stylist — Women's section",
    },
    specialty: {
      fr: "Services féminins complets",
      en: "Complete women's services",
    },
    services: ["placage-brushing", "french-curls", "island-twist", "fulani-braids", "soft-locs", "cornrows", "barrel-twist", "retwist", "knotless-braids", "depart-locks-peigne", "depart-locks-crochet"],
    instagram: "https://instagram.com/thearkwomen",
    image: "/images/team/pretty-little-hair.svg",
  },
];

export const services = [
  // Homme / Barbier
  {
    id: "contour-barbe",
    category: "men",
    name: { fr: "Contour / Taille de barbe", en: "Beard trim / shaping" },
    priceEur: "10€",
    priceDzd: "20 DA",
    duration: { fr: "10–20 min", en: "10–20 min" },
    description: { fr: "Taille et mise en forme de la barbe", en: "Beard trimming and shaping" },
  },
  {
    id: "coupe-enfant",
    category: "men",
    name: { fr: "Coupe enfant", en: "Kids cut" },
    priceEur: "10€",
    priceDzd: "35 DA",
    duration: { fr: "30 min", en: "30 min" },
    description: { fr: "Coupe pour enfants (garçons)", en: "Haircut for kids (boys)" },
  },
  {
    id: "coupe-adulte",
    category: "men",
    name: { fr: "Coupe adulte", en: "Men's cut" },
    priceEur: "15€",
    priceDzd: "40–45 DA",
    duration: { fr: "30–45 min", en: "30–45 min" },
    description: { fr: "Coupe homme complète", en: "Complete men's haircut" },
  },
  {
    id: "coupe-adulte-barbe",
    category: "men",
    name: { fr: "Coupe adulte + Barbe", en: "Men's cut + beard" },
    priceEur: "20€",
    priceDzd: "40–45 DA",
    duration: { fr: "45–60 min", en: "45–60 min" },
    description: { fr: "Coupe + taille de barbe", en: "Haircut + beard trim" },
  },

  // Femme / Coiffure
  {
    id: "placage-brushing",
    category: "women",
    name: { fr: "Placage / Brushing", en: "Blowout / straightening" },
    priceEur: "25€",
    priceDzd: "1h",
    duration: { fr: "1h", en: "1h" },
    description: { fr: "Lissage et mise en forme", en: "Straightening and styling" },
  },

  // Tresses / Braids
  {
    id: "knotless-braids-jumbo",
    category: "braids",
    name: { fr: "Knotless Braids (Jumbo)", en: "Knotless Braids (Jumbo)" },
    priceEur: "70€",
    priceDzd: "3h30",
    duration: { fr: "3h30", en: "3h30" },
    description: { fr: "Tresses sans nœuds, grosses mèches", en: "Knotless braids, jumbo size" },
  },
  {
    id: "knotless-twist-jumbo",
    category: "braids",
    name: { fr: "Knotless Twist (Jumbo)", en: "Knotless Twist (Jumbo)" },
    priceEur: "70€",
    priceDzd: "3h30",
    duration: { fr: "3h30", en: "3h30" },
    description: { fr: "Twists sans nœuds, grosses mèches", en: "Knotless twists, jumbo size" },
  },
  {
    id: "island-twist-large",
    category: "braids",
    name: { fr: "Island Twist (Large)", en: "Island Twist (Large)" },
    priceEur: "80€",
    priceDzd: "4h30",
    duration: { fr: "4h30", en: "4h30" },
    description: { fr: "Twists style îles, grosses mèches", en: "Island style twists, large" },
  },
  {
    id: "fulani-braids-classic",
    category: "braids",
    name: { fr: "Fulani Braids (Classic)", en: "Fulani Braids (Classic)" },
    priceEur: "80€",
    priceDzd: "5h",
    duration: { fr: "5h", en: "5h" },
    description: { fr: "Tresses peul traditionnelles", en: "Traditional Fulani braids" },
  },
  {
    id: "soft-locs-classic",
    category: "braids",
    name: { fr: "Soft Locs (Classic)", en: "Soft Locs (Classic)" },
    priceEur: "75€+",
    priceDzd: "5h",
    duration: { fr: "5h", en: "5h" },
    description: { fr: "Locs doux, départ classique", en: "Soft locs, classic start" },
  },
  {
    id: "cornrows",
    category: "braids",
    name: { fr: "Cornrows", en: "Cornrows" },
    priceEur: "60€+",
    priceDzd: "3h",
    duration: { fr: "3h", en: "3h" },
    description: { fr: "Tresses plaquées", en: "Flat braids" },
  },
  {
    id: "french-curls-large",
    category: "braids",
    name: { fr: "French Curls (Large)", en: "French Curls (Large)" },
    priceEur: "75€",
    priceDzd: "5h",
    duration: { fr: "5h", en: "5h" },
    description: { fr: "Boucles françaises, grosses mèches", en: "French curls, large size" },
  },
  {
    id: "barrel-twist",
    category: "braids",
    name: { fr: "Barrel Twist / Vanilles", en: "Barrel Twist" },
    priceEur: "50€",
    priceDzd: "1h30",
    duration: { fr: "1h30", en: "1h30" },
    description: { fr: "Twists en baril / vanilles", en: "Barrel twists" },
  },
  {
    id: "retwist-simple",
    category: "braids",
    name: { fr: "Retwist simple", en: "Simple retwist" },
    priceEur: "50€+",
    priceDzd: "45 min",
    duration: { fr: "45 min", en: "45 min" },
    description: { fr: "Resserrage des racines", en: "Root tightening" },
  },
  {
    id: "knotless-braids-hairbydm",
    category: "braids",
    name: { fr: "Knotless Braids (Hairbydm)", en: "Knotless Braids (Hairbydm)" },
    priceEur: "80€",
    priceDzd: "4h",
    duration: { fr: "4h", en: "4h" },
    description: { fr: "Spécialité Hairbydm", en: "Hairbydm specialty" },
  },
  {
    id: "depart-locks-peigne",
    category: "braids",
    name: { fr: "Départ Locks au peigne", en: "Comb coils locs start" },
    priceEur: "110€",
    priceDzd: "2h30",
    duration: { fr: "2h30", en: "2h30" },
    description: { fr: "Début de locks au peigne", en: "Comb coils starter locs" },
  },
  {
    id: "depart-locks-crochet",
    category: "braids",
    name: { fr: "Départ Locks crochet instantané", en: "Instant crochet locs start" },
    priceEur: "180€",
    priceDzd: "4h",
    duration: { fr: "4h", en: "4h" },
    description: { fr: "Locks instantanés au crochet", en: "Instant crochet locs" },
  },
];

export const categories = [
  { id: "men", label: { fr: "Homme / Barbier", en: "Men / Barber" }, icon: "scissors" },
  { id: "women", label: { fr: "Femme / Coiffure", en: "Women / Styling" }, icon: "sparkles" },
  { id: "braids", label: { fr: "Tresses / Braids", en: "Braids / Tresses" }, icon: "braid" },
];

export const reviews = [
  {
    id: 1,
    author: "Sarah M.",
    rating: 5,
    date: "2024-01-15",
    text: {
      fr: "Équipe incroyable, ambiance au top ! Mes knotless braids sont parfaites, merci Hairbydm 💖",
      en: "Amazing team, great vibes! My knotless braids are perfect, thanks Hairbydm 💖",
    },
  },
  {
    id: 2,
    author: "Ahmed K.",
    rating: 5,
    date: "2024-01-10",
    text: {
      fr: "Meilleur barbier de Verviers. Kenny est précis, rapide et sympa. Je recommande 100%",
      en: "Best barber in Verviers. Kenny is precise, fast and friendly. 100% recommend",
    },
  },
  {
    id: 3,
    author: "Fatima Z.",
    rating: 5,
    date: "2024-01-05",
    text: {
      fr: "Accueil chaleureux, salon propre, coiffeuses au top pour l'espace femmes. Mes fulani braids sont magnifiques ✨",
      en: "Warm welcome, clean salon, amazing stylists for women's section. My fulani braids are gorgeous ✨",
    },
  },
];

export const galleryImages = [
  { id: 1, src: "/images/gallery/1.svg", alt: { fr: "Coupe homme précise", en: "Precision men's cut" }, category: "men" },
  { id: 2, src: "/images/gallery/2.svg", alt: { fr: "Knotless braids jumbo", en: "Jumbo knotless braids" }, category: "braids" },
  { id: 3, src: "/images/gallery/3.svg", alt: { fr: "Coupe enfant", en: "Kids cut" }, category: "men" },
  { id: 4, src: "/images/gallery/4.svg", alt: { fr: "Fulani braids classic", en: "Classic fulani braids" }, category: "braids" },
  { id: 5, src: "/images/gallery/5.svg", alt: { fr: "Barbe taillée", en: "Beard trim" }, category: "men" },
  { id: 6, src: "/images/gallery/6.svg", alt: { fr: "Soft locs", en: "Soft locs" }, category: "braids" },
  { id: 7, src: "/images/gallery/7.svg", alt: { fr: "Brushing femme", en: "Women's blowout" }, category: "women" },
  { id: 8, src: "/images/gallery/8.svg", alt: { fr: "Island twist", en: "Island twist" }, category: "braids" },
];