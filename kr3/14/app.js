// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let todos = [];

// DOM элементы
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const statsDiv = document.getElementById('stats');
const progressBar = document.getElementById('progress-bar');
const clearCompletedBtn = document.getElementById('clear-completed');

// ========== ЗАГРУЗКА ЗАДАЧ ==========
function loadTodos() {
    const stored = localStorage.getItem('todos');
    if (stored) {
        todos = JSON.parse(stored);
    } else {
        // Примеры задач для демонстрации
        todos = [
            { text: '✨ Нажмите на задачу, чтобы отметить', completed: false, createdAt: Date.now() },
            { text: '🗑 Нажмите на корзину, чтобы удалить', completed: false, createdAt: Date.now() + 1000 },
            { text: '✏️ Двойной клик для редактирования', completed: false, createdAt: Date.now() + 2000 },
            { text: '📱 Установите приложение на рабочий стол', completed: false, createdAt: Date.now() + 3000 }
        ];
        saveTodos();
    }
    renderTodos();
}

// ========== СОХРАНЕНИЕ ЗАДАЧ ==========
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    updateStats();
    updateProgressBar();
}

// ========== ОБНОВЛЕНИЕ СТАТИСТИКИ ==========
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const remaining = total - completed;
    
    if (statsDiv) {
        statsDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span>📊 Всего: ${total}</span>
                <span>✅ Выполнено: ${completed}</span>
                <span>⏳ Осталось: ${remaining}</span>
            </div>
        `;
    }
    
    // Показываем/скрываем кнопку очистки
    if (clearCompletedBtn) {
        clearCompletedBtn.style.display = completed > 0 ? 'block' : 'none';
    }
}

// ========== ОБНОВЛЕНИЕ ПРОГРЕСС-БАРА ==========
function updateProgressBar() {
    if (!progressBar) return;
    
    const total = todos.length;
    if (total === 0) {
        progressBar.style.width = '0%';
        return;
    }
    
    const completed = todos.filter(t => t.completed).length;
    const percentage = (completed / total) * 100;
    progressBar.style.width = `${percentage}%`;
}

// ========== ОТОБРАЖЕНИЕ ЗАДАЧ ==========
function renderTodos() {
    if (!list) return;

    if (todos.length === 0) {
        list.innerHTML = '<div class="empty-state">✨ Пока нет задач. Добавьте первую!</div>';
        updateStats();
        updateProgressBar();
        return;
    }

    list.innerHTML = todos.map((todo, index) => `
        <li class="todo-item" data-index="${index}">
            <input type="checkbox" class="todo-checkbox" data-index="${index}" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text ${todo.completed ? 'completed' : ''}" data-index="${index}">${escapeHtml(todo.text)}</span>
            <button class="delete-btn" data-index="${index}">🗑 Удалить</button>
        </li>
    `).join('');

    attachEventListeners();
    updateStats();
    updateProgressBar();
}

// ========== ЗАЩИТА ОТ XSS ==========
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========== НАЗНАЧЕНИЕ ОБРАБОТЧИКОВ ==========
function attachEventListeners() {
    // Чекбоксы
    document.querySelectorAll('.todo-checkbox').forEach(cb => {
        cb.removeEventListener('change', handleCheckboxChange);
        cb.addEventListener('change', handleCheckboxChange);
    });

    // Текст задачи
    document.querySelectorAll('.todo-text').forEach(span => {
        span.removeEventListener('click', handleTextClick);
        span.addEventListener('click', handleTextClick);
        
        span.removeEventListener('dblclick', handleTextDoubleClick);
        span.addEventListener('dblclick', handleTextDoubleClick);
    });

    // Кнопки удаления
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteClick);
        btn.addEventListener('click', handleDeleteClick);
    });
}

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
function handleCheckboxChange(e) {
    const idx = parseInt(e.target.dataset.index);
    if (!isNaN(idx) && todos[idx]) {
        todos[idx].completed = e.target.checked;
        saveTodos();
        renderTodos();
    }
}

function handleTextClick(e) {
    const idx = parseInt(e.target.dataset.index);
    if (!isNaN(idx) && todos[idx]) {
        todos[idx].completed = !todos[idx].completed;
        saveTodos();
        renderTodos();
    }
}

function handleTextDoubleClick(e) {
    const idx = parseInt(e.target.dataset.index);
    if (!isNaN(idx) && todos[idx]) {
        const newText = prompt('Редактировать задачу:', todos[idx].text);
        if (newText && newText.trim()) {
            todos[idx].text = newText.trim();
            saveTodos();
            renderTodos();
        }
    }
}

function handleDeleteClick(e) {
    e.stopPropagation();
    const idx = parseInt(e.target.dataset.index);
    if (!isNaN(idx) && confirm('Удалить задачу?')) {
        todos.splice(idx, 1);
        saveTodos();
        renderTodos();
    }
}

// ========== ДОБАВЛЕНИЕ ЗАДАЧИ ==========
function addTodo(text) {
    if (!text || !text.trim()) {
        alert('Введите текст задачи!');
        return false;
    }
    
    todos.push({
        text: text.trim(),
        completed: false,
        createdAt: Date.now()
    });
    saveTodos();
    renderTodos();
    return true;
}

// ========== ОЧИСТКА ВЫПОЛНЕННЫХ ==========
function clearCompleted() {
    const completedCount = todos.filter(t => t.completed).length;
    if (completedCount === 0) return;
    
    if (confirm(`Удалить ${completedCount} выполненных задач?`)) {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        renderTodos();
    }
}

// ========== ОБРАБОТКА ФОРМЫ ==========
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value;
        if (addTodo(text)) {
            input.value = '';
            input.focus();
        }
    });
}

// ========== ОБРАБОТЧИК ОЧИСТКИ ==========
if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', clearCompleted);
}

// ========== СТАТУС СЕТИ ==========
function updateOfflineStatus() {
    const statusDiv = document.getElementById('offline-status');
    if (!statusDiv) return;
    
    if (!navigator.onLine) {
        statusDiv.innerHTML = '📡 Офлайн-режим (данные сохраняются локально)';
        statusDiv.style.background = '#e67e22';
        statusDiv.style.opacity = '1';
    } else {
        statusDiv.innerHTML = '🟢 Онлайн';
        statusDiv.style.background = '#2ecc71';
    }
}

window.addEventListener('online', () => {
    updateOfflineStatus();
    const statusDiv = document.getElementById('offline-status');
    statusDiv.style.opacity = '0.7';
    setTimeout(() => {
        statusDiv.style.opacity = '1';
    }, 1000);
});

window.addEventListener('offline', () => {
    updateOfflineStatus();
});

// ========== УВЕДОМЛЕНИЕ ОБ УСТАНОВКЕ ==========
function showInstallNotification() {
    const notification = document.getElementById('install-notification');
    const closeBtn = document.getElementById('close-notification');
    
    if (notification && !localStorage.getItem('install-notification-shown')) {
        setTimeout(() => {
            notification.style.display = 'block';
            localStorage.setItem('install-notification-shown', 'true');
        }, 3000);
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.style.display = 'none';
            });
        }
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
loadTodos();
updateOfflineStatus();
showInstallNotification();

// Сохраняем при закрытии
window.addEventListener('beforeunload', () => {
    saveTodos();
});

// Экспорт для отладки
window.debug = { todos, saveTodos, loadTodos };
console.log('🚀 Приложение запущено! Версия 2.0.0 с PWA поддержкой');