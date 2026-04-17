const VAPID_PUBLIC_KEY = 'BD-DWndTT9oHO18T0L2IhPfkVmvaPkneb305JrTVhu6jA1P5zeGAVLsqryUJWXOcfTT-swjGcaCFMUohIiY7Nro';

let socket = null;
let todos = [];

function initSocket() {
    socket = io('http://localhost:3001');
    socket.on('connect', () => {
        console.log('✅ WebSocket подключен');
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.innerHTML = '🟢 WebSocket подключен';
            statusDiv.style.background = '#2ecc71';
        }
    });
    socket.on('disconnect', () => {
        console.log('❌ WebSocket отключен');
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.innerHTML = '🔴 WebSocket отключен';
            statusDiv.style.background = '#e74c3c';
        }
    });
    socket.on('taskAdded', (task) => {
        console.log('📨 Новая задача от сервера:', task);
        showFloatingNotification('📋 Новая задача', task.text);
        loadTodos();
    });
    socket.on('reminderScheduled', (data) => {
        console.log('⏰ Напоминание запланировано:', data);
        showFloatingNotification('⏰ Напоминание запланировано', `"${data.text}" на ${new Date(data.reminderTime).toLocaleString()}`);
    });
}

function showFloatingNotification(title, body, isError = false) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isError ? '#e74c3c' : 'linear-gradient(135deg, #667eea, #764ba2)'};
        color: white;
        padding: 15px;
        border-radius: 10px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    notif.innerHTML = `<strong>${title}</strong><br>${body}`;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Ваш браузер не поддерживает push-уведомления');
        return false;
    }

    try {
        if (Notification.permission === 'denied') {
            alert('Уведомления запрещены. Разрешите их в настройках браузера.');
            return false;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Необходимо разрешить уведомления');
                return false;
            }
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        const response = await fetch('http://localhost:3001/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });

        if (response.ok) {
            showFloatingNotification('✅ Уведомления включены', 'Вы будете получать push-уведомления о напоминаниях');
            return true;
        }
    } catch (err) {
        console.error('Ошибка подписки:', err);
        showFloatingNotification('❌ Ошибка', 'Не удалось подписаться на уведомления', true);
    }
    return false;
}

async function unsubscribeFromPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await fetch('http://localhost:3001/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            await subscription.unsubscribe();
            showFloatingNotification('🔕 Уведомления отключены', 'Вы больше не будете получать push-уведомления');
            return true;
        }
    } catch (err) {
        console.error('Ошибка отписки:', err);
    }
    return false;
}

function loadTodos() {
    const stored = localStorage.getItem('todos');
    todos = stored ? JSON.parse(stored) : [];
    renderTodos();
}

function renderTodos() {
    const list = document.getElementById('notes-list');
    if (!list) return;

    if (todos.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #999; padding: 20px;">✨ Нет заметок. Добавьте первую!</li>';
        return;
    }

    list.innerHTML = todos.map((todo, index) => {
        let reminderHtml = '';
        let borderColor = '#667eea';
        if (todo.reminder) {
            const reminderDate = new Date(todo.reminder);
            const isExpired = todo.reminder < Date.now();
            borderColor = '#2ecc71';
            reminderHtml = `<div style="font-size: 12px; margin-top: 5px; color: #444;">⏰ Напоминание: ${reminderDate.toLocaleString()}${isExpired ? ' (просрочено)' : ''}</div>`;
        }
        return `
            <li class="todo-item" data-index="${index}" style="background: #f9f9f9; margin-bottom: 10px; padding: 12px; border-radius: 10px; border-left: 4px solid ${borderColor};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <span style="font-weight: 500; ${todo.completed ? 'text-decoration: line-through; color: #999;' : ''}">${escapeHtml(todo.text)}</span>
                        ${reminderHtml}
                    </div>
                    <button class="delete-btn" data-index="${index}" style="background: #e74c3c; color: white; border: none; border-radius: 8px; padding: 5px 10px; cursor: pointer;">🗑</button>
                </div>
            </li>
        `;
    }).join('');

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index, 10);
            if (!isNaN(idx) && confirm('Удалить заметку?')) {
                if (todos[idx].reminder && socket && socket.connected) {
                    socket.emit('cancelReminder', { id: todos[idx].id });
                }
                todos.splice(idx, 1);
                saveTodos();
                renderTodos();
            }
        });
    });
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function addNote(text, reminderTimestamp = null) {
    const newNote = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        reminder: reminderTimestamp,
        createdAt: Date.now()
    };

    todos.push(newNote);
    saveTodos();
    renderTodos();

    if (socket && socket.connected) {
        if (reminderTimestamp) {
            socket.emit('newReminder', {
                id: newNote.id,
                text: text.trim(),
                reminderTime: reminderTimestamp
            });
            showFloatingNotification('⏰ Напоминание запланировано', `"${text.trim()}" на ${new Date(reminderTimestamp).toLocaleString()}`);
        } else {
            socket.emit('newTask', { text: text.trim(), timestamp: Date.now() });
        }
    }
    return true;
}

function initForms() {
    const noteForm = document.getElementById('note-form');
    const noteInput = document.getElementById('note-input');
    if (noteForm) {
        noteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = noteInput.value.trim();
            if (text) {
                addNote(text);
                noteInput.value = '';
                noteInput.focus();
            }
        });
    }

    const reminderForm = document.getElementById('reminder-form');
    const reminderText = document.getElementById('reminder-text');
    const reminderTime = document.getElementById('reminder-time');
    if (reminderForm) {
        reminderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = reminderText.value.trim();
            const datetime = reminderTime.value;
            if (text && datetime) {
                const timestamp = new Date(datetime).getTime();
                if (timestamp > Date.now()) {
                    addNote(text, timestamp);
                    reminderText.value = '';
                    reminderTime.value = '';
                } else {
                    alert('⚠️ Дата напоминания должна быть в будущем!');
                }
            } else {
                alert('⚠️ Заполните все поля!');
            }
        });
    }
}

async function initPushButtons() {
    const enableBtn = document.getElementById('enable-push');
    const disableBtn = document.getElementById('disable-push');
    if (!enableBtn || !disableBtn) return;

    if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            enableBtn.style.display = 'none';
            disableBtn.style.display = 'inline-block';
        } else {
            enableBtn.style.display = 'inline-block';
            disableBtn.style.display = 'none';
        }
    }

    enableBtn.addEventListener('click', async () => {
        const success = await subscribeToPush();
        if (success) {
            enableBtn.style.display = 'none';
            disableBtn.style.display = 'inline-block';
        }
    });

    disableBtn.addEventListener('click', async () => {
        await unsubscribeFromPush();
        disableBtn.style.display = 'none';
        enableBtn.style.display = 'inline-block';
    });
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker зарегистрирован');
            if (registration.active) {
                await initPushButtons();
            } else {
                registration.addEventListener('activate', () => {
                    initPushButtons();
                });
            }
        } catch (err) {
            console.error('❌ Ошибка регистрации SW:', err);
        }
    });
}

initSocket();
initForms();
loadTodos();

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
`;
document.head.appendChild(style);
