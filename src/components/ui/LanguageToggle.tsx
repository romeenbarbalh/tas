import { useEffect, useState } from "react";

interface Props {
  locale: "fr" | "en";
}

export default function LanguageToggle({ locale }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="hidden sm:flex h-10 w-20 items-center justify-center gap-2 rounded-lg bg-bg-elevated border border-border text-sm font-medium text-text-muted transition-colors"
        aria-label="Language"
        disabled
      >
        <span className="text-text-dim">FR</span>
        <span className="text-gold">EN</span>
      </button>
    );
  }

  const toggleLocale = () => {
    const newLocale = locale === "fr" ? "en" : "fr";
    const path = window.location.pathname;
    const newPath = newLocale === "en"
      ? (path === "/" ? "/en/" : `/en${path}`)
      : path.replace(/^\/en/, "") || "/";
    window.location.href = newPath;
  };

  return (
    <button
      onClick={toggleLocale}
      className="hidden sm:flex h-10 w-20 items-center justify-center gap-1 rounded-lg bg-bg-elevated border border-border transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      aria-label={locale === "fr" ? "Switch to English" : "Passer au français"}
      aria-pressed={locale === "en"}
    >
      <span
        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
          locale === "fr"
            ? "bg-gold text-bg shadow-sm shadow-gold/20"
            : "text-text-muted hover:text-text"
        }`}
      >
        FR
      </span>
      <span
        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
          locale === "en"
            ? "bg-gold text-bg shadow-sm shadow-gold/20"
            : "text-text-muted hover:text-text"
        }`}
      >
        EN
      </span>
    </button>
  );
}