// Probe the video via range request to estimate duration
const res = await fetch("http://localhost:4321/videos/intro_1.mp4", {
  headers: { Range: "bytes=0-100000" },
});
console.log("status:", res.status);
console.log("content-type:", res.headers.get("content-type"));
console.log("content-range:", res.headers.get("content-range"));
console.log("content-length:", res.headers.get("content-length"));
const buf = await res.arrayBuffer();
console.log("got bytes:", buf.byteLength);
