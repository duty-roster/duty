// 주야간 근무표 — 오프라인 캐시
const CACHE = "duty-app-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
const XLSX_URL = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(async (c) => {
    await c.addAll(SHELL);
    try { await c.add(new Request(XLSX_URL, { mode: "no-cors" })); } catch (err) {}
  }));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // 페이지는 새 버전을 먼저 시도하고, 인터넷이 없으면 저장된 것으로
  if (req.mode === "navigate") {
    e.respondWith(fetch(req, { cache: "no-store" }).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put("./index.html", copy));
      return res;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  // 그 외(아이콘, 엑셀 라이브러리)는 저장된 것 먼저
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
    return res;
  })));
});
