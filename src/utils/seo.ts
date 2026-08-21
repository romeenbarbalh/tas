import { salon } from "./constants";

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  locale?: "fr" | "en";
}

export function generateSEO(props: SEOProps = {}) {
  const locale = props.locale ?? "fr";
  const baseUrl = "https://thearkstudio.be";
  const url = props.url ? `${baseUrl}${props.url}` : baseUrl;
  const title = props.title
    ? `${props.title} | ${salon.name}`
    : `${salon.name} - ${locale === "fr" ? "Salon coiffure barbier Verviers" : "Hair salon barber Verviers"}`;
  const description = props.description ?? salon.description[locale];
  const image = props.image ? `${baseUrl}${props.image}` : `${baseUrl}/images/og-default.jpg`;

  return {
    title,
    description,
    canonical: url,
    openGraph: {
      title,
      description,
      url,
      siteName: salon.name,
      type: props.type ?? "website",
      locale: locale === "fr" ? "fr_BE" : "en_US",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: salon.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    jsonLd: generateLocalBusinessJSONLD(locale),
  };
}

function generateLocalBusinessJSONLD(locale: "fr" | "en") {
  const t = (key: string) => (locale === "fr" ? salon.description.fr : salon.description.en);

  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: salon.name,
    description: t(""),
    url: "https://thearkstudio.be",
    telephone: salon.phone,
    email: salon.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rue de la station 23",
      addressLocality: "Verviers",
      postalCode: "4800",
      addressCountry: "BE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: salon.coordinates.lat,
      longitude: salon.coordinates.lng,
    },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "10:00", closes: "20:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "", closes: "", validFrom: "2024-01-01", validThrough: "2024-12-31" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "10:00", closes: "20:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "10:00", closes: "20:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "10:00", closes: "21:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "21:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "13:00", closes: "20:00" },
    ],
    priceRange: "€€",
    currenciesAccepted: "EUR",
    paymentAccepted: "Cash, Credit Card, Mobile Payment",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: salon.rating.overall,
      reviewCount: salon.rating.count,
      bestRating: "5",
      worstRating: "1",
    },
    review: [
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Sarah M." },
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
        datePublished: "2024-01-15",
        reviewBody: locale === "fr" ? "Équipe incroyable, ambiance au top !" : "Amazing team, great vibes!",
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Ahmed K." },
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
        datePublished: "2024-01-10",
        reviewBody: locale === "fr" ? "Meilleur barbier de Verviers." : "Best barber in Verviers.",
      },
    ],
    sameAs: [
      salon.instagram,
      salon.instagramWomen,
    ],
  };
}