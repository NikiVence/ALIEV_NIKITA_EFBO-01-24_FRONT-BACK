const CACHE_NAME = 'todo-reminders-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/manifest.json',
    'https://cdn.socket.io/4.5.4/socket.io.min.js'
];

// ========== УСТАНОВКА (кэшируем всё!) ==========
self.addEventListener('install', event => {
    console.log('[SW] Установка, кэшируем ресурсы...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэшируем статику');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Кэширование завершено');
                return self.skipWaiting();
            })
    );
});

// ========== АКТИВАЦИЯ (чистим старые кэши) ==========
self.addEventListener('activate', event => {
    console.log('[SW] Активация, чистим старые кэши...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Удаляем старый кэш:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('[SW] Готово, берём управление');
            return self.clients.claim();
        })
    );
});

// ========== ПЕРЕХВАТ ЗАПРОСОВ (Cache First) ==========
self.addEventListener('fetch', event => {
    // Не кэшируем запросы к API и push-эндпоинты
    if (event.request.url.includes('/subscribe') ||
        event.request.url.includes('/unsubscribe') ||
        event.request.url.includes('/snooze') ||
        event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('[SW] Из кэша:', event.request.url);
                    return cachedResponse;
                }
                
                console.log('[SW] Из сети:', event.request.url);
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
                    .catch(() => {
                        // Если запрос страницы и нет сети - отдаём офлайн страницу
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        return new Response('Нет соединения', { status: 503 });
                    });
            })
    );
});

// ========== PUSH УВЕДОМЛЕНИЯ ==========
self.addEventListener('push', (event) => {
    console.log('[SW] Получен push');
    
    let data = {
        title: '⏰ Напоминание',
        body: '',
        reminderId: null,
        timestamp: Date.now()
    };

    if (event.data) {
        try {
            const parsed = event.data.json();
            data = { ...data, ...parsed };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        timestamp: data.timestamp,
        data: {
            reminderId: data.reminderId,
            url: '/',
            timestamp: data.timestamp
        },
        requireInteraction: true,
        silent: false
    };

    if (data.reminderId) {
        options.actions = [
            { action: 'snooze', title: '⏰ Отложить на 5 минут' },
            { action: 'close', title: '✖ Закрыть' }
        ];
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ========== ОБРАБОТКА КЛИКА ПО УВЕДОМЛЕНИЮ ==========
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Клик по уведомлению:', event.action);
    
    const notification = event.notification;
    const action = event.action;
    const reminderId = notification.data?.reminderId;
    notification.close();

    if (action === 'snooze' && reminderId) {
        event.waitUntil(
            fetch(`http://localhost:3001/snooze?reminderId=${reminderId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => {
                if (response.ok) {
                    return self.registration.showNotification('⏰ Отложено', {
                        body: 'Напоминание через 5 минут',
                        icon: '/icons/icon-192x192.png'
                    });
                }
            })
            .catch(err => console.error('Ошибка:', err))
        );
    } else if (action !== 'close') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(windowClients => {
                    for (let client of windowClients) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

// ========== ОБРАБОТКА СООБЩЕНИЙ ==========
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker загружен!');