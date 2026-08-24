import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

interface GalleryItem {
  id: string;
  file_url: string;
  file_type: "image" | "video";
  alt_fr: string;
  alt_en: string;
  category: string;
}

interface StaticImage {
  id: number;
  src: string;
  alt: { fr: string; en: string };
  category: string;
}

interface Props {
  locale: "fr" | "en";
  staticImages: StaticImage[];
}

const MOBILE_PAGE_SIZE = 4;

export default function GallerySection({ locale, staticImages }: Props) {
  const [items, setItems] = useState<(GalleryItem | StaticImage)[]>(staticImages);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentDot, setCurrentDot] = useState(0);

  useEffect(() => {
    supabase
      .from("gallery_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setItems(data);
        }
      });
  }, []);

  const pages: (GalleryItem | StaticImage)[][] = [];
  for (let p = 0; p < items.length; p += MOBILE_PAGE_SIZE) {
    pages.push(items.slice(p, p + MOBILE_PAGE_SIZE));
  }

  const getSrc = (item: GalleryItem | StaticImage) =>
    "file_url" in item ? item.file_url : (item as StaticImage).src;
  const getAlt = (item: GalleryItem | StaticImage) =>
    "alt_fr" in item ? (locale === "fr" ? (item as GalleryItem).alt_fr : (item as GalleryItem).alt_en) : (item as StaticImage).alt[locale];
  const isVideo = (item: GalleryItem | StaticImage) =>
    "file_type" in item ? (item as GalleryItem).file_type === "video" : false;

  // Dots scroll tracking
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const handler = () => {
      const pageWidth = scroll.children[0]?.clientWidth || 1;
      const newCurrent = Math.round(scroll.scrollLeft / pageWidth);
      if (newCurrent !== currentDot && newCurrent >= 0 && newCurrent < pages.length) {
        setCurrentDot(newCurrent);
      }
    };
    scroll.addEventListener("scroll", handler, { passive: true });
    return () => scroll.removeEventListener("scroll", handler);
  }, [items, currentDot, pages.length]);

  return (
    <section id="gallery" className="section bg-bg-elevated/30" aria-labelledby="gallery-title">
      <div className="container">
        <header className="text-center max-w-2xl mx-auto mb-4 md:mb-12">
          <h2 id="gallery-title" className="heading-lg mb-1 md:mb-4">
            {locale === "fr" ? "Notre Galerie" : "Our Gallery"}
          </h2>
          <p className="text-body hidden md:block">
            {locale === "fr" ? "Découvrez nos réalisations" : "Discover our work"}
          </p>
        </header>

        {/* Desktop: grid */}
        <div className="hidden md:grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4" role="list">
          {items.map((item, idx) => (
            <figure
              key={getSrc(item)}
              className="relative aspect-[4/5] rounded-xl overflow-hidden group card cursor-zoom-in"
              role="listitem"
              onClick={() => setLightboxIdx(idx)}
            >
              {isVideo(item) ? (
                <video
                  src={getSrc(item)}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                  onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                />
              ) : (
                <img
                  src={getSrc(item)}
                  alt={getAlt(item)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              )}
              <figcaption className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-sm font-medium text-text w-full text-center">{getAlt(item)}</span>
              </figcaption>
              <div className="absolute top-3 right-3 p-2 rounded-full bg-bg/90 backdrop-blur-sm border border-border text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              </div>
            </figure>
          ))}
        </div>

        {/* Mobile: carousel 2x2 */}
        <div className="md:hidden relative">
          <div
            ref={scrollRef}
            className="overflow-x-auto snap-x snap-mandatory flex gap-2.5 pb-2 -mx-1 px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {pages.map((page, pIdx) => (
              <div key={pIdx} className="snap-start shrink-0 w-[88%] last:w-full">
                <div className="grid grid-cols-2 gap-2">
                  {page.map((item) => (
                    <figure
                      key={getSrc(item)}
                      className="relative aspect-[4/5] rounded-lg overflow-hidden group cursor-zoom-in"
                      onClick={() => setLightboxIdx(items.indexOf(item))}
                    >
                      {isVideo(item) ? (
                        <video
                          src={getSrc(item)}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={getSrc(item)}
                          alt={getAlt(item)}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      )}
                      <figcaption className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                        <span className="text-[10px] font-medium text-text w-full text-center">{getAlt(item)}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {pages.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {pages.map((_, pIdx) => (
                <span
                  key={pIdx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    pIdx === currentDot ? "bg-gold w-4" : "bg-border w-1.5"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightboxIdx !== null && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
            onClick={() => setLightboxIdx(null)}
          >
            <button
              className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white transition-colors"
              onClick={() => setLightboxIdx(null)}
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            {lightboxIdx > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
            )}
            {lightboxIdx < items.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            )}
            <figure className="max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
              {isVideo(items[lightboxIdx]) ? (
                <video
                  src={getSrc(items[lightboxIdx])}
                  controls
                  autoPlay
                  className="max-w-full max-h-[85vh] mx-auto rounded-lg"
                />
              ) : (
                <img
                  src={getSrc(items[lightboxIdx])}
                  alt={getAlt(items[lightboxIdx])}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl mx-auto"
                />
              )}
              <figcaption className="text-center mt-4 text-white/60 text-sm">{getAlt(items[lightboxIdx])}</figcaption>
            </figure>
          </div>
        )}
      </div>
    </section>
  );
}
