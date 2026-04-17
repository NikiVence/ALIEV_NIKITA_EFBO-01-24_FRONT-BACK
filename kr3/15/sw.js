// ========== КОНСТАНТЫ ==========
const CACHE_NAME = 'app-shell-v2';
const DYNAMIC_CACHE = 'dynamic-content-v2';
const OFFLINE_URL = '/';

// Статические ресурсы (App Shell)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/manifest.json',
    '/offline.html',
    'https://unpkg.com/chota@latest'
];

// ========== УСТАНОВКА ==========
self.addEventListener('install', event => {
    console.log('[SW] Установка Service Worker');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэширование App Shell...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] App Shell закэширован');
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
                keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
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

// ========== СТРАТЕГИИ КЭШИРОВАНИЯ ==========
// 1. Cache First (для статики) - сначала кэш, потом сеть
// 2. Network First (для контента) - сначала сеть, потом кэш

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Пропускаем запросы к другим источникам (кроме CDN)
    if (url.origin !== location.origin && !url.origin.includes('unpkg.com')) {
        return;
    }
    
    // Пропускаем не-GET запросы
    if (event.request.method !== 'GET') {
        return;
    }
    
    // ========== ДИНАМИЧЕСКИЙ КОНТЕНТ (Network First) ==========
    if (url.pathname.startsWith('/content/')) {
        event.respondWith(networkFirstStrategy(event.request));
        return;
    }
    
    // ========== СТАТИЧЕСКИЕ РЕСУРСЫ (Cache First) ==========
    event.respondWith(cacheFirstStrategy(event.request));
});

// Стратегия: Сначала кэш, потом сеть (для статики)
async function cacheFirstStrategy(request) {
    try {
        // Пытаемся найти в кэше
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[SW] Cache First - из кэша:', request.url);
            return cachedResponse;
        }
        
        // Если нет в кэше - идем в сеть
        console.log('[SW] Cache First - загрузка из сети:', request.url);
        const networkResponse = await fetch(request);
        
        // Сохраняем в кэш
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Ошибка Cache First:', error);
        
        // Если запрос страницы и нет сети - отдаем офлайн страницу
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match(OFFLINE_URL);
        }
        
        return new Response('Сетевая ошибка', { status: 503 });
    }
}

// Стратегия: Сначала сеть, потом кэш (для динамического контента)
async function networkFirstStrategy(request) {
    try {
        // Пытаемся загрузить из сети
        console.log('[SW] Network First - загрузка из сети:', request.url);
        const networkResponse = await fetch(request);
        
        // Сохраняем в динамический кэш
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            console.log('[SW] Network First - сохранено в кэш:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        // Если сеть недоступна - берем из кэша
        console.log('[SW] Network First - сеть недоступна, ищем в кэше:', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Network First - найдено в кэше:', request.url);
            return cachedResponse;
        }
        
        // Если нет в кэше - отдаем fallback страницу
        if (request.headers.get('accept').includes('text/html')) {
            console.log('[SW] Network First - отдаем офлайн страницу');
            return caches.match('/content/home.html') || caches.match(OFFLINE_URL);
        }
        
        return new Response('Контент недоступен офлайн', { status: 404 });
    }
}

// ========== ФОНОВАЯ СИНХРОНИЗАЦИЯ ==========
self.addEventListener('sync', event => {
    console.log('[SW] Синхронизация:', event.tag);
    if (event.tag === 'sync-todos') {
        event.waitUntil(syncTodos());
    }
});

async function syncTodos() {
    console.log('[SW] Синхронизация задач с сервером...');
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_COMPLETE',
            message: 'Данные синхронизированы',
            timestamp: Date.now()
        });
    });
}

// ========== PUSH УВЕДОМЛЕНИЯ ==========
self.addEventListener('push', event => {
    console.log('[SW] Push уведомление:', event);
    const options = {
        body: event.data ? event.data.text() : 'Напоминание о задачах',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'open',
                title: 'Открыть приложение'
            },
            {
                action: 'close',
                title: 'Закрыть'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('✅ Todo PWA', options)
    );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// ========== ОБРАБОТКА СООБЩЕНИЙ ==========
self.addEventListener('message', event => {
    console.log('[SW] Получено сообщение:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME);
        caches.delete(DYNAMIC_CACHE);
        event.ports[0].postMessage({ success: true });
    }
    
    if (event.data.type === 'GET_CACHE_INFO') {
        Promise.all([
            caches.has(CACHE_NAME),
            caches.has(DYNAMIC_CACHE)
        ]).then(([appShellExists, dynamicExists]) => {
            event.ports[0].postMessage({
                appShell: appShellExists,
                dynamic: dynamicExists,
                version: '2.0.0'
            });
        });
    }
});

console.log('[SW] Service Worker готов к работе!');