const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
    publicKey: 'BD-DWndTT9oHO18T0L2IhPfkVmvaPkneb305JrTVhu6jA1P5zeGAVLsqryUJWXOcfTT-swjGcaCFMUohIiY7Nro',
    privateKey: 'ivDMtwq0yh908L4OJEaZJcWAJokIAZ6fdl_4YSiZQt8'
};

webpush.setVapidDetails('mailto:your-email@example.com', vapidKeys.publicKey, vapidKeys.privateKey);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let subscriptions = [];
const reminders = new Map();

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

function sendPushToAllSubscribers(payload) {
    subscriptions.forEach((sub, index) => {
        webpush.sendNotification(sub, payload)
            .then(() => {
                console.log(`✅ Push отправлен подписке ${index + 1}`);
            })
            .catch(err => {
                console.error(`❌ Ошибка push для подписки ${index + 1}:`, err);
                if (err.statusCode === 410) {
                    subscriptions = subscriptions.filter(s => s !== sub);
                }
            });
    });
}

function scheduleReminder(id, text, reminderTime) {
    const delay = reminderTime - Date.now();
    if (delay <= 0) {
        console.log(`⚠️ Напоминание ${id} просрочено`);
        return false;
    }

    const timeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: '🔔 Напоминание',
            body: text,
            reminderId: id,
            timestamp: Date.now()
        });
        sendPushToAllSubscribers(payload);
        reminders.delete(id);
    }, delay);

    reminders.set(id, { timeoutId, text, reminderTime, createdAt: Date.now() });
    return true;
}

io.on('connection', (socket) => {
    socket.on('newTask', (task) => {
        io.emit('taskAdded', task);
    });

    socket.on('newReminder', (reminder) => {
        const { id, text, reminderTime } = reminder;
        const scheduled = scheduleReminder(id, text, reminderTime);
        if (scheduled) {
            socket.emit('reminderScheduled', { id, text, reminderTime, status: 'scheduled' });
        }
    });

    socket.on('cancelReminder', ({ id }) => {
        if (reminders.has(id)) {
            clearTimeout(reminders.get(id).timeoutId);
            reminders.delete(id);
        }
    });
});

app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) subscriptions.push(subscription);
    res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/snooze', (req, res) => {
    const reminderId = parseInt(req.query.reminderId, 10);
    if (!reminderId || !reminders.has(reminderId)) {
        return res.status(404).json({ error: 'Reminder not found' });
    }

    const reminder = reminders.get(reminderId);
    const snoozeDelay = 5 * 60 * 1000;
    const newReminderTime = Date.now() + snoozeDelay;
    clearTimeout(reminder.timeoutId);

    const newTimeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: '🔔 Напоминание (отложенное)',
            body: reminder.text,
            reminderId,
            timestamp: Date.now(),
            snoozed: true
        });
        sendPushToAllSubscribers(payload);
        reminders.delete(reminderId);
    }, snoozeDelay);

    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: newReminderTime,
        createdAt: Date.now(),
        snoozed: true
    });
    res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    reminders.forEach(reminder => clearTimeout(reminder.timeoutId));
    process.exit(0);
});
