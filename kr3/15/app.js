// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let todos = [];
let currentPage = 'home';

// DOM элементы
const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const contactBtn = document.getElementById('contact-btn');

// ========== НАВИГАЦИЯ (App Shell) ==========
function setActiveButton(activeId) {
    [homeBtn, aboutBtn, contactBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
}

async function loadContent(page) {
    currentPage = page;
    
    // Показываем загрузчик
    if (contentDiv) {
        contentDiv.innerHTML = '<div class="container"><div class="loader">Загрузка контента</div></div>';
    }
    
    try {
        const response = await fetch(`/content/${page}.html`);
        if (!response.ok) throw new Error('Страница не найдена');
        
        const html = await response.text();
        contentDiv.innerHTML = html;
        
        // Инициализируем соответствующую логику для каждой страницы
        if (page === 'home') {
            initHomePage();
        } else if (page === 'about') {
            initAboutPage();
        } else if (page === 'contact') {
            initContactPage();
        }
    } catch (err) {
        console.error('Ошибка загрузки:', err);
        contentDiv.innerHTML = `
            <div class="container">
                <div class="about-card" style="text-align: center;">
                    <h2>⚠️ Ошибка загрузки</h2>
                    <p>Не удалось загрузить страницу. Проверьте соединение.</p>
                    <button onclick="location.reload()">🔄 Обновить</button>
                </div>
            </div>
        `;
    }
}

// ========== ДОМАШНЯЯ СТРАНИЦА (Задачи) ==========
function initHomePage() {
    // Находим элементы после загрузки HTML
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const list = document.getElementById('todo-list');
    const clearCompletedBtn = document.getElementById('clear-completed');
    
    // Функция загрузки задач
    function loadTodos() {
        const stored = localStorage.getItem('todos');
        if (stored) {
            todos = JSON.parse(stored);
        } else {
            todos = [
                { text: '✨ Нажмите на задачу, чтобы отметить', completed: false, createdAt: Date.now() },
                { text: '🗑 Нажмите на корзину, чтобы удалить', completed: false, createdAt: Date.now() + 1000 },
                { text: '✏️ Двойной клик для редактирования', completed: false, createdAt: Date.now() + 2000 },
                { text: '📱 Приложение работает офлайн!', completed: false, createdAt: Date.now() + 3000 }
            ];
            saveTodos();
        }
        renderTodos();
    }
    
    // Сохранение задач
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
        updateStats();
        updateProgressBar();
    }
    
    // Обновление статистики
    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const remaining = total - completed;
        
        const statsDiv = document.getElementById('stats');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="stat-item">
                    <div class="stat-value">${total}</div>
                    <div class="stat-label">Всего задач</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${completed}</div>
                    <div class="stat-label">Выполнено</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${remaining}</div>
                    <div class="stat-label">Осталось</div>
                </div>
            `;
        }
        
        if (clearCompletedBtn) {
            clearCompletedBtn.style.display = completed > 0 ? 'block' : 'none';
        }
    }
    
    // Обновление прогресс-бара
    function updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
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
    
    // Рендер списка
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
        
        // Добавляем обработчики
        attachEventListeners();
        updateStats();
        updateProgressBar();
    }
    
    // Защита от XSS
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    // Обработчики событий
    function attachEventListeners() {
        // Чекбоксы
        document.querySelectorAll('.todo-checkbox').forEach(cb => {
            cb.removeEventListener('change', handleCheckboxChange);
            cb.addEventListener('change', handleCheckboxChange);
        });
        
        // Текст
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
    
    // Добавление задачи
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
    
    // Очистка выполненных
    function clearCompleted() {
        const completedCount = todos.filter(t => t.completed).length;
        if (completedCount === 0) return;
        
        if (confirm(`Удалить ${completedCount} выполненных задач?`)) {
            todos = todos.filter(t => !t.completed);
            saveTodos();
            renderTodos();
        }
    }
    
    // Обработка формы
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
    
    if (clearCompletedBtn) {
        clearCompletedBtn.addEventListener('click', clearCompleted);
    }
    
    // Загружаем задачи
    loadTodos();
}

// ========== СТРАНИЦА "О НАС" ==========
function initAboutPage() {
    console.log('Страница "О нас" загружена');
    // Дополнительная логика для страницы о нас
}

// ========== СТРАНИЦА "КОНТАКТЫ" ==========
function initContactPage() {
    console.log('Страница "Контакты" загружена');
    // Дополнительная логика для страницы контактов
}

// ========== ОБРАБОТЧИКИ НАВИГАЦИИ ==========
if (homeBtn) {
    homeBtn.addEventListener('click', () => {
        setActiveButton('home-btn');
        loadContent('home');
    });
}

if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
        setActiveButton('about-btn');
        loadContent('about');
    });
}

if (contactBtn) {
    contactBtn.addEventListener('click', () => {
        setActiveButton('contact-btn');
        loadContent('contact');
    });
}

// ========== СТАТУС СЕТИ ==========
function updateOfflineStatus() {
    const statusDiv = document.getElementById('offline-status');
    if (!statusDiv) return;
    
    if (!navigator.onLine) {
        statusDiv.innerHTML = '📡 Офлайн-режим (данные сохраняются локально)';
        statusDiv.style.background = '#e67e22';
    } else {
        statusDiv.innerHTML = '🟢 Онлайн';
        statusDiv.style.background = '#2ecc71';
    }
}

window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);

// ========== УСТАНОВКА PWA ==========
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', () => {
            installBtn.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('PWA установлено');
                }
                deferredPrompt = null;
            });
        });
    }
});

// ========== РЕГИСТРАЦИЯ SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker зарегистрирован:', registration.scope);
            
            // Проверка обновлений
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('🔄 Доступно обновление!');
                        showUpdateNotification();
                    }
                });
            });
        } catch (err) {
            console.error('❌ Ошибка регистрации SW:', err);
        }
    });
}

// Уведомление об обновлении
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: #3498db;
        color: white;
        padding: 15px;
        border-radius: 10px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
        🔄 Доступно обновление! 
        <button onclick="location.reload()" style="background: white; color: #3498db; border: none; padding: 5px 10px; margin-left: 10px; border-radius: 5px;">
            Обновить
        </button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// ========== ЗАГРУЗКА СТАРТОВОЙ СТРАНИЦЫ ==========
loadContent('home');
updateOfflineStatus();

// Сохранение при закрытии
window.addEventListener('beforeunload', () => {
    if (todos.length) {
        localStorage.setItem('todos', JSON.stringify(todos));
    }
});

console.log('🚀 PWA приложение запущено! Версия 2.0.0 с App Shell');