// Hifazat service worker: offline shell, asset caching and the Android share target.
// API calls (another origin) are never cached.
const VERSION = "hifazat-v1";
const SHARE_CACHE = "hifazat-share";
const SHELL = ["/", "/icons/icon-192.png", "/logo.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== SHARE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function handleShare(request) {
  const form = await request.formData();
  const cache = await caches.open(SHARE_CACHE);
  const text = [form.get("title"), form.get("text"), form.get("url")].filter(Boolean).join("\n");
  await cache.put("/__share/text", new Response(text));
  const image = form.get("image");
  if (image && typeof image !== "string" && image.size) {
    await cache.put("/__share/image", new Response(image, { headers: { "Content-Type": image.type || "image/png" } }));
  }
  return Response.redirect("/?shared=1", 303);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(handleShare(request));
    return;
  }
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/logo.svg") {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
  }
});
