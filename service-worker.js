/* =====================================================================
   CONSISTENCY — service-worker.js
   This file lets the app keep working with no internet connection,
   which is what makes "installed" web apps feel like real apps.

   How it works, in plain terms:
   1. The first time someone visits, "install" fires and we download
      and store every file the app needs into a local cache.
   2. On every later visit (online or offline), "fetch" fires for each
      file the page needs, and we hand back the cached copy instead of
      going to the network.
   3. If you ever change the app's files and re-publish, bump
      CACHE_NAME below (e.g. "consistency-v2") so visitors download the
      new versions instead of seeing the old cached ones forever.
===================================================================== */

const CACHE_NAME = "consistency-v1";

const FILES_TO_CACHE = [
  "./",
  "index.html",
  "style.css",
  "script.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

// Runs once, when the service worker is first registered.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Runs after install — a good place to clear out old, unused caches.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Every request the page makes passes through here.
// Strategy: try the cache first (fast, works offline), and fall back
// to the network only if the file isn't cached yet.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
