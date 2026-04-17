const CACHE_NAME = 'todo-pwa-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',  // если создадите отдельный CSS
    'https://unpkg.com/chota@latest'
];

// Установка – кэшируем статику
self.addEventListener('install', event => {
    console.log('[SW] Установка');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэшируем ресурсы');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting()) // активируем сразу
    );
});

// Активация – чистим старые кэши
self.addEventListener('activate', event => {
    console.log('[SW] Активация');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Удаляем старый кэш:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim()) // сразу начинаем управлять
    );
});

// Перехват fetch – сначала кэш, потом сеть (стратегия Cache First)
self.addEventListener('fetch', event => {
    // Не кэшируем запросы к API или аналитике (опционально)
    if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Нашли в кэше – отдаём
                    return cachedResponse;
                }
                // Иначе идём в сеть
                return fetch(event.request)
                    .then(networkResponse => {
                        // Кэшируем новый ответ для будущих офлайн-запросов
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Если нет сети и нет кэша – можно отдать fallback
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        return new Response('Нет соединения', { status: 404 });
                    });
            })
    );
});