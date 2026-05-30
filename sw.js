const CACHE_NAME = 'emoji-cn-v6'; // 更新缓存版本
const STATIC_CACHE_URLS = [
  './',
  './index.html',
  './static/css/style.css',
  './static/js/main.js',
  './static/js/emoji-data.js',
  './manifest.json',
  './static/icons/icon-192x192.png',
  './static/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  // 立即激活新的 Service Worker
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  // 立即接管所有页面
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // 清除旧版本缓存
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const isStaticAsset = STATIC_CACHE_URLS.some(
    cacheUrl => url.pathname.endsWith(cacheUrl.replace('./', '/')) ||
                 event.request.url.includes(cacheUrl.replace('./', ''))
  );

  if (isStaticAsset) {
    // 静态资源：Cache First，回退到网络
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
  } else {
    // 其他请求：Network First，回退到缓存
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});
