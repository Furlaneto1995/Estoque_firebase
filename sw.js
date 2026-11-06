/* =========================================================
   SERVICE WORKER — Estoque / Conferência
   Estratégia: rede primeiro (ignorando cache HTTP) para
   HTML/JS/CSS, então o app sempre pega a versão nova sozinho.
   Offline: cai para o cache.
   ========================================================= */

const CACHE_VERSION = "estoque-v3";
const CACHE_NAME = CACHE_VERSION;

const ARQUIVOS_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

/* ---------------- INSTALL ---------------- */
self.addEventListener("install", function (event) {
  self.skipWaiting(); // não espera a aba fechar

  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // addAll falha inteiro se UM arquivo der 404 — aqui cada um é independente
      return Promise.all(
        ARQUIVOS_CACHE.map(function (arq) {
          return cache.add(arq).catch(function () { /* ignora falha */ });
        })
      );
    })
  );
});

/* ---------------- ACTIVATE ---------------- */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (key) { return key !== CACHE_NAME; })
              .map(function (key) { return caches.delete(key); })
        );
      })
      .then(function () { return self.clients.claim(); })
      .then(function () {
        // avisa as abas abertas que o SW novo assumiu
        return self.clients.matchAll({ type: "window" }).then(function (clientes) {
          clientes.forEach(function (c) {
            c.postMessage({ tipo: "SW_ATUALIZADO", versao: CACHE_VERSION });
          });
        });
      })
  );
});

/* ---------------- ESTRATÉGIAS ---------------- */

// Rede primeiro, sem usar cache HTTP. Se falhar, usa o cache.
async function redePrimeiro(req) {
  try {
    const resposta = await fetch(req, { cache: "no-store" });
    if (resposta && resposta.ok) {
      const copia = resposta.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copia); }).catch(function () {});
    }
    return resposta;
  } catch (e) {
    const emCache = await caches.match(req);
    if (emCache) return emCache;

    if (req.mode === "navigate") {
      const index = await caches.match("./index.html");
      if (index) return index;
    }
    return new Response(
      "<h1>Sem conexão</h1><p>Abra o app uma vez com internet para liberar o modo offline.</p>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

// Cache primeiro (ícones, imagens).
async function cachePrimeiro(req) {
  const emCache = await caches.match(req);
  if (emCache) return emCache;
  try {
    const resposta = await fetch(req);
    if (resposta && resposta.ok) {
      const copia = resposta.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copia); }).catch(function () {});
    }
    return resposta;
  } catch (e) {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

/* ---------------- FETCH ---------------- */
self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Não mexe em Firebase, CDNs, APIs — deixa o navegador cuidar
  if (url.origin !== self.location.origin) return;

  const precisaAtualizar =
    req.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname.endsWith("/") ||
    /\.(html|js|css|json|webmanifest)$/i.test(url.pathname) ||
    /\.(html|js|css|json|webmanifest)$/i.test(url.search);

  event.respondWith(precisaAtualizar ? redePrimeiro(req) : cachePrimeiro(req));
});

/* ---------------- MENSAGEM (forçar atualização) ---------------- */
self.addEventListener("message", function (event) {
  if (event.data === "PULAR_ESPERA" || (event.data && event.data.tipo === "PULAR_ESPERA")) {
    self.skipWaiting();
  }
});
