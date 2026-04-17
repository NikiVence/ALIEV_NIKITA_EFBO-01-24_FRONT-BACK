// VAPID ключ (ваш публичный ключ)
const VAPID_PUBLIC_KEY = 'BD-DWndTT9oHO18T0L2IhPfkVmvaPkneb305JrTVhu6jA1P5zeGAVLsqryUJWXOcfTT-swjGcaCFMUohIiY7Nro';

let socket = null;
let todos = [];

// Подключение WebSocket
function initSocket() {
    socket = io('http://localhost:3001');
    
    socket.on('connect', () => {
        console.log('✅ WebSocket подключен');
        document.getElementById('status').innerHTML = '🟢 WebSocket подключен';
        document.getElementById('status').style.background = '#2ecc71';
    });
    
    socket.on('disconnect', () => {
        console.log('❌ WebSocket отключен');
        document.getElementById('status').innerHTML = '🔴 WebSocket отключен';
        document.getElementById('status').style.background = '#e74c3c';
    });
    
    socket.on('taskAdded', (task) => {
        console.log('📨 Новая задача от сервера:', task);
        showNotification('📋 Новая задача от другого пользователя!', task.text);
        loadTodos(); // Обновляем список
    });
}

function showNotification(title, body) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #667eea, #764ba2);
        color: white; padding: 15px; border-radius: 10px; z-index: 1000;
        animation: slideIn 0.3s ease-out; max-width: 300px;
    `;
    notif.innerHTML = `<strong>${title}</strong><br>${body}`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// Конвертация VAPID ключа
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

// Подписка на push
async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Push не поддерживается');
        return false;
    }
    
    try {
        if (Notification.permission === 'denied') {
            alert('Уведомления запрещены');
            return false;
        }
        
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Нужно разрешить уведомления');
                return false;
            }
        }
        
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        
        const response = await fetch('http://localhost:3001/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        
        if (response.ok) {
            console.log('✅ Подписка на push сохранена');
            return true;
        }
    } catch (err) {
        console.error('Ошибка:', err);
    }
    return false;
}

// Отписка от push
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
            console.log('✅ Отписка выполнена');
            return true;
        }
    } catch (err) {
        console.error('Ошибка отписки:', err);
    }
    return false;
}

// Работа с задачами
function loadTodos() {
    const stored = localStorage.getItem('todos');
    todos = stored ? JSON.parse(stored) : [];
    renderTodos();
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    if (!list) return;
    
    if (todos.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #999;">✨ Нет задач. Добавьте первую!</li>';
        return;
    }
    
    list.innerHTML = todos.map((todo, index) => `
        <li style="background: #f9f9f9; margin-bottom: 10px; padding: 10px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="${todo.completed ? 'text-decoration: line-through; color: #999;' : ''}">${escapeHtml(todo.text)}</span>
            <button class="delete-btn" data-index="${index}" style="background: #e74c3c; padding: 5px 10px;">🗑</button>
        </li>
    `).join('');
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.index);
            todos.splice(idx, 1);
            saveTodos();
            renderTodos();
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

async function addTodo(text) {
    const newTodo = { text: text.trim(), completed: false, timestamp: Date.now() };
    todos.push(newTodo);
    saveTodos();
    renderTodos();
    
    if (socket && socket.connected) {
        socket.emit('newTask', { text: text.trim(), timestamp: Date.now() });
    }
}

// Инициализация
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value.trim()) {
            addTodo(input.value);
            input.value = '';
        }
    });
}

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ SW зарегистрирован');
            
            // Кнопки уведомлений
            const enableBtn = document.getElementById('enable-push');
            const disableBtn = document.getElementById('disable-push');
            
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                enableBtn.style.display = 'none';
                disableBtn.style.display = 'inline-block';
            }
            
            enableBtn.addEventListener('click', async () => {
                const success = await subscribeToPush();
                if (success) {
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                    alert('✅ Уведомления включены!');
                }
            });
            
            disableBtn.addEventListener('click', async () => {
                await unsubscribeFromPush();
                disableBtn.style.display = 'none';
                enableBtn.style.display = 'inline-block';
                alert('🔕 Уведомления отключены');
            });
        } catch (err) {
            console.error('Ошибка SW:', err);
        }
    });
}

initSocket();
loadTodos();
