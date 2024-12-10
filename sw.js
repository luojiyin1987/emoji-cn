const CACHE_NAME = 'emoji-cn-v2'; // 更新缓存版本
const urlsToCache = [
  './',
  './index.html',
  './static/css/style.css',
  './static/js/main.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  // 立即激活新的 Service Worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
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
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 克隆响应，因为响应流只能被读取一次
        const responseClone = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });
          
        return response;
      })
      .catch(() => {
        // 如果网络请求失败，尝试从缓存中获取
        return caches.match(event.request);
      })
  );
});
