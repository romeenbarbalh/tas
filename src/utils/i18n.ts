export type Locale = "fr" | "en";

export const locales: Locale[] = ["fr", "en"];
export const defaultLocale: Locale = "fr";

export const ui = {
  fr: {
    nav: {
      home: "Accueil",
      services: "Services",
      team: "Équipe",
      about: "À propos",
      booking: "Réserver",
      gallery: "Galerie",
      contact: "Contact",
    },
    hero: {
      tagline: "Votre style, notre signature",
      cta: "Réserver mon créneau",
      scroll: "Descendre",
    },
    booking: {
      title: "Réserver",
      subtitle: "Choisissez votre service, coiffeur et créneau",
      service: "Service",
      barber: "Coiffeur / Barbier",
      date: "Date",
      time: "Heure",
      name: "Nom complet",
      phone: "Téléphone",
      notes: "Notes (optionnel)",
      submit: "Confirmer la réservation",
      submitting: "Envoi...",
      success: "Demande envoyée ! Nous vous contactons sous peu.",
      error: "Erreur. Veuillez réessayer.",
      required: "Champ requis",
      invalidPhone: "Numéro invalide",
      selectService: "Sélectionner un service",
      selectBarber: "Sélectionner un coiffeur",
      selectTime: "Choisir d'abord une date",
      noSlots: "Aucun créneau dispo ce jour",
    },
    services: {
      title: "Nos services & tarifs",
      subtitle: "Tarifs en € et durée indicative",
      categories: {
        men: "Homme / Barbier",
        women: "Femme / Coiffure",
        braids: "Tresses / Braids",
      },
      duration: "Durée",
      book: "Réserver",
    },
    team: {
      title: "Notre équipe",
      subtitle: "Experts passionnés, chacun sa spécialité",
      viewProfile: "Voir le profil",
      specialty: "Spécialité",
    },
    about: {
      title: "The Ark Studio",
      subtitle: "Votre salon de référence à Verviers",
      description: "Salon moderne et multi-services, accueillant hommes, femmes et enfants dans une atmosphère chaleureuse et élégante. Une équipe experte propose des services personnalisés pour chaque type de cheveux et chaque besoin.",
      values: [
        { title: "Expertise", desc: "Équipe formée aux dernières techniques" },
        { title: "Ambiance", desc: "Espace chaleureux et soigné" },
        { title: "Inclusif", desc: "Hommes, femmes, enfants bienvenus" },
        { title: "Qualité", desc: "Produits pros, résultats durables" },
      ],
    },
    hours: {
      title: "Horaires d'ouverture",
      closed: "Fermé",
      today: "Aujourd'hui",
    },
    reviews: {
      title: "Avis clients",
      subtitle: "Basé sur 28 avis Google",
      readMore: "Voir tous les avis",
    },
    gallery: {
      title: "Galerie",
      subtitle: "Quelques-unes de nos réalisations",
    },
    footer: {
      address: "Adresse",
      phone: "Téléphone",
      email: "Email",
      follow: "Suivez-nous",
      hours: "Horaires",
      map: "Voir sur Google Maps",
      whatsapp: "WhatsApp",
      copyright: "Tous droits réservés.",
    },
    language: {
      fr: "Français",
      en: "English",
    },
    mobileCTA: {
      book: "Réserver",
      call: "Appeler",
    },
  },
  en: {
    nav: {
      home: "Home",
      services: "Services",
      team: "Team",
      about: "About",
      booking: "Book",
      gallery: "Gallery",
      contact: "Contact",
    },
    hero: {
      tagline: "Your style, our signature",
      cta: "Book my slot",
      scroll: "Scroll down",
    },
    booking: {
      title: "Book",
      subtitle: "Choose your service, stylist and time slot",
      service: "Service",
      barber: "Stylist / Barber",
      date: "Date",
      time: "Time",
      name: "Full name",
      phone: "Phone",
      notes: "Notes (optional)",
      submit: "Confirm booking",
      submitting: "Sending...",
      success: "Request sent! We'll contact you shortly.",
      error: "Error. Please try again.",
      required: "Required field",
      invalidPhone: "Invalid number",
      selectService: "Select a service",
      selectBarber: "Select a stylist",
      selectTime: "Choose a date first",
      noSlots: "No slots available this day",
    },
    services: {
      title: "Our services & prices",
      subtitle: "Prices in € and estimated duration",
      categories: {
        men: "Men / Barber",
        women: "Women / Styling",
        braids: "Braids / Tresses",
      },
      duration: "Duration",
      book: "Book",
    },
    team: {
      title: "Our team",
      subtitle: "Passionate experts, each with their specialty",
      viewProfile: "View profile",
      specialty: "Specialty",
    },
    about: {
      title: "The Ark Studio",
      subtitle: "Your go-to salon in Verviers",
      description: "Modern multi-service salon welcoming men, women, and children in a warm and elegant atmosphere. An expert team offers personalized services for every hair type and need.",
      values: [
        { title: "Expertise", desc: "Team trained in latest techniques" },
        { title: "Ambiance", desc: "Warm and curated space" },
        { title: "Inclusive", desc: "Men, women, children welcome" },
        { title: "Quality", desc: "Pro products, lasting results" },
      ],
    },
    hours: {
      title: "Opening hours",
      closed: "Closed",
      today: "Today",
    },
    reviews: {
      title: "Customer reviews",
      subtitle: "Based on 28 Google reviews",
      readMore: "Read all reviews",
    },
    gallery: {
      title: "Gallery",
      subtitle: "Some of our work",
    },
    footer: {
      address: "Address",
      phone: "Phone",
      email: "Email",
      follow: "Follow us",
      hours: "Hours",
      map: "View on Google Maps",
      whatsapp: "WhatsApp",
      copyright: "All rights reserved.",
    },
    language: {
      fr: "Français",
      en: "English",
    },
    mobileCTA: {
      book: "Book",
      call: "Call",
    },
  },
} as const;

export function t(locale: Locale, key: string): string {
  const keys = key.split(".");
  let value: any = ui[locale];
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  return value ?? key;
}

export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith("/en")) return "en";
  return "fr";
}

export function getLocalizedPath(pathname: string, locale: Locale): string {
  if (locale === "en") {
    return pathname.startsWith("/") ? `/en${pathname}` : `/en/${pathname}`;
  }
  return pathname.replace(/^\/en/, "") || "/";
}