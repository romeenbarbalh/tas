const res = await fetch("http://localhost:4321/src/components/sections/Hero.astro?astro&type=script&index=0&lang.ts");
const text = await res.text();
console.log("status:", res.status);
console.log("has intro_1.mp4:", text.includes("intro_1.mp4"));
console.log("has getBoundingClientRect scrub:", text.includes("getBoundingClientRect"));
console.log("has poster fallback:", text.includes("hero-poster"));
console.log("has reduced motion:", text.includes("prefers-reduced-motion"));
console.log("--- first 300 chars ---");
console.log(text.slice(0, 300));
