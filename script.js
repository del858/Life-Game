class LifeGameTracker {
    constructor() {
        this.dataKey = 'lifeGameData';
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.render();
        this.checkDailyReset();
    }

    loadData() {
        const saved = localStorage.getItem(this.dataKey);
        if (saved) {
            const data = JSON.parse(saved);
            
            // Проверка, сегодняшние ли это данные
            const today = new Date().toDateString();
            if (data.lastReset !== today) {
                // Сохраняем историю, но сбрасываем дневные счетчики
                data.dailyXP = 0;
                data.lastActions = [];
                data.lastReset = today;
                
                // Проверяем streak (если вчера что-то делал)
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (data.lastActiveDate === yesterday.toDateString()) {
                    data.streak++;
                } else if (data.lastActiveDate !== today) {
                    data.streak = 1;
                }
                data.lastActiveDate = today;
            }
            
            this.data = data;
        } else {
            this.data = {
                totalXP: 0,
                dailyXP: 0,
                level: 1,
                streak: 0,
                categories: {
                    code: 0,
                    youtube: 0,
                    photo: 0,
                    edit: 0,
                    study: 0,
                    health: 0,
                    other: 0
                },
                lastActions: [],
                lastReset: new Date().toDateString(),
                lastActiveDate: new Date().toDateString()
            };
        }
        this.calculateLevel();
    }

    saveData() {
        localStorage.setItem(this.dataKey, JSON.stringify(this.data));
    }

    calculateLevel() {
        // Простая формула: каждый уровень требует на 100 XP больше
        let xpNeeded = 100;
        let level = 1;
        let xp = this.data.totalXP;
        
        while (xp >= xpNeeded) {
            xp -= xpNeeded;
            level++;
            xpNeeded += 100; // Увеличиваем сложность
        }
        
        this.data.level = level;
        this.data.xpToNextLevel = xpNeeded;
        this.data.currentLevelXP = xp;
    }

    addXP(amount, category, description = '') {
        const action = {
            timestamp: new Date().toLocaleTimeString(),
            category,
            amount,
            description: description || this.getCategoryName(category)
        };

        this.data.totalXP += amount;
        this.data.dailyXP += amount;
        this.data.categories[category] = (this.data.categories[category] || 0) + amount;
        this.data.lastActions.unshift(action);
        
        // Ограничиваем историю последними 10 действиями
        if (this.data.lastActions.length > 10) {
            this.data.lastActions.pop();
        }

        this.calculateLevel();
        this.saveData();
        this.render();
        
        // Визуальная обратная связь
        this.showXPGained(amount);
    }

    getCategoryName(category) {
        const names = {
            code: 'Кодинг',
            youtube: 'YouTube',
            photo: 'Фотография',
            edit: 'Монтаж',
            study: 'Учёба',
            health: 'Здоровье',
            other: 'Другое'
        };
        return names[category] || 'Другое';
    }

    showXPGained(amount) {
        // Создаем всплывающее уведомление
        const notification = document.createElement('div');
        notification.textContent = `+${amount} XP!`;
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #00ff88, #4dccff);
            color: #000;
            padding: 10px 20px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1.5rem;
            z-index: 1000;
            animation: fadeOut 1.5s ease forwards;
        `;
        
        // Добавляем анимацию в стили
        if (!document.querySelector('#animations')) {
            const style = document.createElement('style');
            style.id = 'animations';
            style.textContent = `
                @keyframes fadeOut {
                    0% { opacity: 1; top: 20%; }
                    70% { opacity: 1; top: 15%; }
                    100% { opacity: 0; top: 10%; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 1500);
    }

    setupEventListeners() {
        // Быстрые кнопки
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const xp = parseInt(btn.dataset.xp);
                const category = btn.dataset.category;
                this.addXP(xp, category);
            });
        });

        // Кастомный ввод
        document.getElementById('add-custom-btn').addEventListener('click', () => {
            const task = document.getElementById('custom-task').value;
            const xp = parseInt(document.getElementById('custom-xp').value);
            const category = document.getElementById('custom-category').value;
            
            if (task && xp && xp > 0) {
                this.addXP(xp, category, task);
                // Сбрасываем поля
                document.getElementById('custom-task').value = '';
                document.getElementById('custom-xp').value = '';
            } else {
                alert('Заполни все поля корректно!');
            }
        });

        // Экспорт данных
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        // Сброс дня
        document.getElementById('reset-btn').addEventListener('click', () => {
            if (confirm('Сбросить дневные данные? История сохранится.')) {
                this.data.dailyXP = 0;
                this.data.lastActions = [];
                this.saveData();
                this.render();
            }
        });

        // Быстрые клавиши (для ПК)
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch(e.key) {
                    case '1': this.addXP(50, 'code'); break;
                    case '2': this.addXP(30, 'youtube'); break;
                    case '3': this.addXP(40, 'photo'); break;
                }
            }
        });
    }

    render() {
        // Обновляем статистику
        document.getElementById('level').textContent = this.data.level;
        document.getElementById('xp').textContent = this.data.dailyXP;
        document.getElementById('streak').textContent = this.data.streak;

        // Обновляем прогресс по категориям
        Object.keys(this.data.categories).forEach(category => {
            const element = document.getElementById(`${category}-stat`);
            if (element) {
                const xp = this.data.categories[category];
                const progressFill = element.querySelector('.progress-fill');
                const xpText = element.querySelector('.category-xp');
                
                // Простая визуализация (максимум 500 XP = 100%)
                const percentage = Math.min((xp / 500) * 100, 100);
                progressFill.style.width = `${percentage}%`;
                xpText.textContent = `${xp} XP`;
            }
        });

        // Обновляем историю
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        this.data.lastActions.forEach(action => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${action.timestamp}</strong><br>
                ${action.description}: +${action.amount} XP
            `;
            historyList.appendChild(li);
        });
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `life-game-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('Данные экспортированы!');
    }

    checkDailyReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilReset = tomorrow - now;
        setTimeout(() => {
            this.loadData(); // Перезагрузит данные с обнулением дневных
            this.render();
            // Устанавливаем следующий сброс
            setTimeout(() => this.checkDailyReset(), 1000);
        }, timeUntilReset);
    }
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.game = new LifeGameTracker();
    
    // Добавляем на главный экран (для мобильных)
    if ('standalone' in navigator || window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Приложение установлено');
    }
});
class GoogleSheetsSync {
    constructor(sheetId) {
        this.sheetId = sheetId;
        this.scriptUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    }

    async saveToSheets(data) {
        // Нужно создать Google Apps Script
        const response = await fetch(this.scriptUrl, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    }

    async loadFromSheets() {
        const response = await fetch(this.scriptUrl);
        return response.json();
    }
}
// Метод для полного сброса
resetAllData() {
    if (confirm('💀 ЭТО УДАЛИТ ВСЕ ДАННЫЕ! Уровни, XP, историю. Продолжить?')) {
        // Вариант 1: Полный сброс
        localStorage.removeItem('lifeGameData');
        
        // Вариант 2: Сброс только статистики, но сохранение настроек
        // const settings = this.data.settings || {};
        // this.data = { settings, level: 1, totalXP: 0, dailyXP: 0 };
        // this.saveData();
        
        alert('✅ Все данные сброшены! Начинаем с чистого листа.');
        location.reload();
    }
}

// И добавь кнопку в HTML:
// <button onclick="game.resetAllData()">🔄 Сбросить всё</button>
