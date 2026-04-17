// ----- Работа с задачами (localStorage) -----
let todos = [];

function loadTodos() {
    const stored = localStorage.getItem('todos');
    if (stored) {
        todos = JSON.parse(stored);
    } else {
        todos = [];
    }
    renderTodos();
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    if (todos.length === 0) {
        list.innerHTML = '<li class="text-grey">✨ Пока нет задач. Добавьте первую!</li>';
        return;
    }

    list.innerHTML = todos.map((todo, index) => `
        <li class="todo-item">
            <input type="checkbox" data-index="${index}" ${todo.completed ? 'checked' : ''}>
            <span data-index="${index}" class="${todo.completed ? 'completed' : ''}">${escapeHtml(todo.text)}</span>
            <button class="delete-btn" data-index="${index}">🗑</button>
        </li>
    `).join('');

    // Вешаем обработчики
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index);
            todos[idx].completed = e.target.checked;
            saveTodos();
            renderTodos();
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.index);
            todos.splice(idx, 1);
            saveTodos();
            renderTodos();
        });
    });

    document.querySelectorAll('.todo-item span').forEach(span => {
        span.addEventListener('click', (e) => {
            const idx = parseInt(span.dataset.index);
            todos[idx].completed = !todos[idx].completed;
            saveTodos();
            renderTodos();
        });
    });
}

function addTodo(text) {
    if (!text.trim()) return;
    todos.push({
        text: text.trim(),
        completed: false,
        createdAt: Date.now()
    });
    saveTodos();
    renderTodos();
}

// Простая защита от XSS
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ----- Обработка формы -----
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            addTodo(text);
            input.value = '';
        }
    });
}

// ----- Отображение статуса сети -----
function updateOfflineStatus() {
    const statusDiv = document.getElementById('offline-status');
    if (!navigator.onLine) {
        statusDiv.innerHTML = '📡 Офлайн‑режим (данные локальны)';
        statusDiv.style.background = '#e67e22';
    } else {
        statusDiv.innerHTML = '🟢 Онлайн';
        statusDiv.style.background = '#2ecc71';
    }
}

window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);

// ----- Регистрация Service Worker -----
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ SW зарегистрирован, scope:', registration.scope);

            // Проверяем обновления
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 Найдено обновление SW');
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('📦 Новый SW готов, обновите страницу');
                    }
                });
            });
        } catch (err) {
            console.error('❌ Ошибка регистрации SW:', err);
        }
    });
}

// Первоначальная загрузка
loadTodos();
updateOfflineStatus();