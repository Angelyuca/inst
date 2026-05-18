const CACHE_NAME = "pwa-link-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./img/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Handle only same-origin GET requests via cache strategy.
  // Do not intercept cross-origin/API POST calls (e.g. push registration).
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => caches.match("./index.html"));
    })
  );
});

self.addEventListener("push", (event) => {
  if (!(self.Notification && self.Notification.permission === "granted")) {
    return;
  }

  const defaultPayload = {
    title: "Нове повідомлення",
    message: "Відкрийте застосунок, щоб переглянути деталі.",
    link: "./"
  };

  let payload = defaultPayload;
  if (event.data) {
    try {
      payload = { ...defaultPayload, ...event.data.json() };
    } catch (_error) {
      payload = { ...defaultPayload, message: event.data.text() };
    }
  }

  const options = {
    body: payload.message || payload.body || "",
    icon: payload.icon || "./img/logo.png",
    badge: payload.badge || "./img/logo.png",
    image: payload.image || "",
    requireInteraction: true,
    actions: [],
    data: {
      link: payload.link || payload.url || "./"
    }
  };

  if (payload.actions?.button_1) {
    options.actions.push({
      action: "button_1",
      title: payload.actions.button_1.text
    });
    options.data.button_1 = payload.actions.button_1.link;
  }
  if (payload.actions?.button_2) {
    options.actions.push({
      action: "button_2",
      title: payload.actions.button_2.text
    });
    options.data.button_2 = payload.actions.button_2.link;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let link = event.notification.data?.link || "./";
  if (event.action === "button_1") {
    link = event.notification.data?.button_1 || link;
  } else if (event.action === "button_2") {
    link = event.notification.data?.button_2 || link;
  }

  const parsedUrl = new URL(link, self.location.origin);
  if (!parsedUrl.searchParams.has("standalone")) {
    parsedUrl.searchParams.set("standalone", "true");
  }
  const url = parsedUrl.toString();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && "navigate" in client) {
          return client.focus().then(() => client.navigate(url));
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
      return Promise.resolve();
    })
  );
});
