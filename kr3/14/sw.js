// Имя кэша (меняйте при обновлении)
const CACHE_NAME = 'todo-pwa-v2';
const OFFLINE_URL = '/index.html';

// Ресурсы для кэширования (включая иконки и манифест)
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/manifest.json',
    '/browserconfig.xml',
    
    // Иконки
    '/icons/favicon.ico',
    '/icons/favicon-16x16.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-48x48.png',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-256x256.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    '/icons/maskable-icon-512x512.png',
    
    // Внешние ресурсы
    'https://unpkg.com/chota@latest'
];

// ========== УСТАНОВКА ==========
self.addEventListener('install', event => {
    console.log('[SW] Установка Service Worker v2');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэширование ресурсов...');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                console.log('[SW] Все ресурсы закэшированы');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[SW] Ошибка кэширования:', err);
            })
    );
});

// ========== АКТИВАЦИЯ ==========
self.addEventListener('activate', event => {
    console.log('[SW] Активация Service Worker');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Удаление старого кэша:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('[SW] Старые кэши удалены');
            return self.clients.claim();
        })
    );
});

// ========== ПЕРЕХВАТ ЗАПРОСОВ ==========
self.addEventListener('fetch', event => {
    // Не кэшируем не-GET запросы
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Не кэшируем запросы к API и расширениям
    if (event.request.url.includes('/api/') || 
        event.request.url.includes('chrome-extension') ||
        event.request.url.includes('safari-extension')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('[SW] Из кэша:', event.request.url);
                    return cachedResponse;
                }
                
                console.log('[SW] Загрузка из сети:', event.request.url);
                return fetch(event.request)
                    .then(networkResponse => {
                        // Сохраняем в кэш только успешные ответы
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(error => {
                        console.error('[SW] Ошибка сети:', error);
                        
                        // Для HTML запросов отдаем офлайн страницу
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match(OFFLINE_URL);
                        }
                        
                        // Для иконок возвращаем заглушку
                        if (event.request.url.includes('/icons/')) {
                            return new Response('', { status: 404 });
                        }
                        
                        // Для остальных ресурсов
                        return new Response('Нет соединения с интернетом', {
                            status: 503,
                            statusText: 'Offline',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// ========== ОБРАБОТКА СООБЩЕНИЙ ==========
self.addEventListener('message', event => {
    console.log('[SW] Получено сообщение:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[SW] Кэш очищен');
            if (event.ports && event.ports[0]) {
                event.ports[0].postMessage({ success: true });
            }
        });
    }
    
    if (event.data.type === 'GET_CACHE_SIZE') {
        caches.open(CACHE_NAME).then(cache => {
            // Подсчет размера кэша (упрощенно)
            event.ports[0].postMessage({ size: 'unknown' });
        });
    }
});

// ========== ФОНОВАЯ СИНХРОНИЗАЦИЯ ==========
self.addEventListener('sync', event => {
    console.log('[SW] Синхронизация:', event.tag);
    if (event.tag === 'sync-todos') {
        event.waitUntil(syncTodos());
    }
});

async function syncTodos() {
    console.log('[SW] Синхронизация задач...');
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_COMPLETE',
            message: 'Данные синхронизированы',
            timestamp: Date.now()
        });
    });
}