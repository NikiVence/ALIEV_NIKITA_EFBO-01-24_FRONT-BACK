const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// ========== VAPID КЛЮЧИ (ВСТАВЬТЕ ВАШИ!) ==========
const vapidKeys = {
    publicKey: 'BD-DWndTT9oHO18T0L2IhPfkVmvaPkneb305JrTVhu6jA1P5zeGAVLsqryUJWXOcfTT-swjGcaCFMUohIiY7Nro',
    privateKey: 'ivDMtwq0yh908L4OJEaZJcWAJokIAZ6fdl_4YSiZQt8'
};

// Настройка web-push
webpush.setVapidDetails(
    'mailto:your-email@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Хранилище подписок
let subscriptions = [];

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('✅ Клиент подключён:', socket.id);
    
    socket.on('newTask', (task) => {
        console.log('📝 Новая задача:', task.text);
        
        // Рассылаем всем клиентам
        io.emit('taskAdded', task);
        
        // Отправляем push-уведомления
        const payload = JSON.stringify({
            title: '📋 Новая задача',
            body: task.text,
            icon: '/icons/icon-192x192.png'
        });
        
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error('Push error:', err);
                if (err.statusCode === 410) {
                    subscriptions = subscriptions.filter(s => s !== sub);
                }
            });
        });
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Клиент отключён:', socket.id);
    });
});

// Эндпоинты для push-подписок
app.post('/subscribe', (req, res) => {
    subscriptions.push(req.body);
    console.log('📱 Новая подписка. Всего:', subscriptions.length);
    res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    console.log('🗑 Подписка удалена. Осталось:', subscriptions.length);
    res.status(200).json({ message: 'Подписка удалена' });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`
========================================
🚀 СЕРВЕР ЗАПУЩЕН!
========================================
📡 HTTP: http://localhost:${PORT}
🔌 WebSocket: ws://localhost:${PORT}
📱 Push уведомления: активны
========================================
    `);
});