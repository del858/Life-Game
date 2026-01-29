// Основной класс приложения
class LifeGame {
    constructor() {
        this.version = 2;
        this.dataKey = 'lifeGameData';
        this.init();
    }

    init() {
        this.loadData();
        this.initUI();
        this.initEventListeners();
        this.checkDailyReset();
        this.updateUI();
    }

    // Загрузка данных
    loadData() {
        const saved = localStorage.getItem(this.dataKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.version === this.version) {
                    this.data = data;
                } else {
                    // Миграция данных при обновлении версии
                    this.data = this.migrateData(data);
                }
            } catch (e) {
                console.error('Ошибка загрузки данных:', e);
                this.createDefaultData();
            }
        } else {
            this.createDefaultData();
        }
    }

    // Создание данных по умолчанию
    createDefaultData() {
        this.data = {
            version: this.version,
            user: {
                level: 1,
                xp: 0,
                totalXP: 0,
                xpToNextLevel: 100,
                coins: 0,
                streak: 0,
                maxStreak: 0,
                lastActive: new Date().toISOString().split('T')[0],
                theme: 'dark'
            },
            categories: [
                { id: 'work', name: 'Работа', color: '#6a11cb' },
                { id: 'health', name: 'Здоровье', color: '#00ff88' },
                { id: 'learning', name: 'Обучение', color: '#4dccff' },
                { id: 'personal', name: 'Личное', color: '#ffcc00' }
            ],
            projects: [],
            habits: [],
            achievements: [
                {
                    id: 1,
                    title: 'Первый шаг',
                    description: 'Выполнил первую задачу',
                    icon: '🥇',
                    earned: false,
                    type: 'productivity'
                },
                {
                    id: 2,
                    title: 'Неделя без пропусков',
                    description: '7 дней подряд с активностью',
                    icon: '🔥',
                    earned: false,
                    type: 'productivity'
                },
                {
                    id: 3,
                    title: 'ЗОЖник',
                    description: 'Выполнял все привычки здоровья неделю',
                    icon: '💪',
                    earned: false,
                    type: 'habits'
                }
            ],
            shop: {
                items: [],
                purchased: []
            },
            stats: {
                totalDays: 1,
                completedProjects: 0,
                totalTasksCompleted: 0,
                weeklyReport: {}
            }
        };
        this.saveData();
    }

    // Сохранение данных
    saveData() {
        localStorage.setItem(this.dataKey, JSON.stringify(this.data));
        // Автоматический бэкап
        this.createBackup();
    }

    // Создание бэкапа
    createBackup() {
        const backupKey = `lifeGameBackup_${new Date().toISOString().split('T')[0]}`;
        localStorage.setItem(backupKey, JSON.stringify(this.data));
        
        // Храним только 7 последних бэкапов
        const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('lifeGameBackup_'))
            .sort()
            .reverse();
        
        if (backupKeys.length > 7) {
            for (let i = 7; i < backupKeys.length; i++) {
                localStorage.removeItem(backupKeys[i]);
            }
        }
    }

    // Инициализация UI
    initUI() {
        // Установка темы
        document.body.className = `${this.data.user.theme}-theme`;
        
        // Заполнение категорий в фильтрах
        this.populateCategories();
        
        // Инициализация графиков
        this.initCharts();
    }

    // Наполнение категорий
    populateCategories() {
        const categorySelects = document.querySelectorAll('select[id*="category"]');
        categorySelects.forEach(select => {
            select.innerHTML = '<option value="all">Все категории</option>' +
                this.data.categories.map(cat => 
                    `<option value="${cat.id}">${cat.name}</option>`
                ).join('');
        });
    }

    // Проверка ежедневного сброса
    checkDailyReset() {
        const today = new Date().toISOString().split('T')[0];
        
        if (this.data.user.lastActive !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (this.data.user.lastActive === yesterdayStr) {
                this.data.user.streak++;
                if (this.data.user.streak > this.data.user.maxStreak) {
                    this.data.user.maxStreak = this.data.user.streak;
                }
            } else {
                this.data.user.streak = 1;
            }
            
            this.data.user.lastActive = today;
            this.data.stats.totalDays++;
            this.saveData();
        }
    }

    // Добавление XP
    addXP(amount, source) {
        this.data.user.xp += amount;
        this.data.user.totalXP += amount;
        
        // Проверка уровня
        while (this.data.user.xp >= this.data.user.xpToNextLevel) {
            this.data.user.xp -= this.data.user.xpToNextLevel;
            this.data.user.level++;
            this.data.user.xpToNextLevel = this.data.user.level * 100;
            
            // Награда за уровень
            this.data.user.coins += this.data.user.level * 10;
            this.showNotification(`🎉 Достигнут уровень ${this.data.user.level}! +${this.data.user.level * 10} монет`);
        }
        
        // Добавление монет
        const coinsEarned = Math.floor(amount / 10);
        this.data.user.coins += coinsEarned;
        
        this.saveData();
        this.updateUI();
        
        // Проверка ачивок
        this.checkAchievements();
        
        this.showNotification(`+${amount} XP получено!`);
    }

    // Показать уведомление
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#00b09b' : '#ff416c'};
            color: white;
            border-radius: 10px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.getElementById('notification-area').appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Добавляем стили анимации
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Обновление UI
    updateUI() {
        // Обновляем пользовательскую информацию
        document.getElementById('level').textContent = this.data.user.level;
        document.getElementById('current-xp').textContent = this.data.user.xp;
        document.getElementById('needed-xp').textContent = this.data.user.xpToNextLevel;
        document.getElementById('coins').textContent = this.data.user.coins;
        document.getElementById('shop-coins').textContent = this.data.user.coins;
        document.getElementById('streak').textContent = `${this.data.user.streak} дней`;
        
        // Обновляем прогресс-бар XP
        const xpPercent = (this.data.user.xp / this.data.user.xpToNextLevel) * 100;
        document.getElementById('xp-progress').style.width = `${xpPercent}%`;
        
        // Рендерим проекты
        this.renderProjects();
        
        // Рендерим привычки
        this.renderHabits();
        
        // Рендерим ачивки
        this.renderAchievements();
        
        // Обновляем статистику
        this.updateStats();
    }

    // Рендеринг проектов
    renderProjects() {
        const projectsGrid = document.getElementById('projects-grid');
        if (!projectsGrid) return;
        
        const categoryFilter = document.getElementById('project-category-filter')?.value || 'all';
        const statusFilter = document.getElementById('project-status-filter')?.value || 'all';
        const sortBy = document.getElementById('project-sort')?.value || 'deadline';
        
        let projects = [...this.data.projects];
        
        // Фильтрация
        if (categoryFilter !== 'all') {
            projects = projects.filter(p => p.category === categoryFilter);
        }
        
        if (statusFilter === 'active') {
            projects = projects.filter(p => !p.completed && !this.isProjectOverdue(p));
        } else if (statusFilter === 'completed') {
            projects = projects.filter(p => p.completed);
        } else if (statusFilter === 'overdue') {
            projects = projects.filter(p => this.isProjectOverdue(p) && !p.completed);
        }
        
        // Сортировка
        projects.sort((a, b) => {
            if (sortBy === 'deadline') {
                return new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31');
            } else if (sortBy === 'progress') {
                return this.getProjectProgress(b) - this.getProjectProgress(a);
            } else if (sortBy === 'newest') {
                return new Date(b.created) - new Date(a.created);
            }
            return 0;
        });
        
        // Рендеринг
        projectsGrid.innerHTML = projects.map(project => {
            const progress = this.getProjectProgress(project);
            const isOverdue = this.isProjectOverdue(project);
            const isSoon = this.isDeadlineSoon(project.deadline);
            const category = this.data.categories.find(c => c.id === project.category);
            
            return `
                <div class="project-card ${project.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                    <div class="project-header">
                        <div>
                            <h3 class="project-title">${project.title}</h3>
                            <span class="project-category" style="background: ${category?.color || '#666'}22; color: ${category?.color || '#666'}">
                                ${category?.name || 'Без категории'}
                            </span>
                        </div>
                        <button class="btn-secondary" onclick="game.toggleProjectDetails(${project.id})">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                    
                    ${project.description ? `<p class="project-description">${project.description}</p>` : ''}
                    
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%; background: ${category?.color || '#666'}"></div>
                        </div>
                        <div class="progress-text">
                            <span>Прогресс</span>
                            <span>${progress}%</span>
                        </div>
                    </div>
                    
                    <div class="project-deadline">
                        <i class="far fa-calendar"></i>
                        ${project.deadline ? 
                            `До ${new Date(project.deadline).toLocaleDateString('ru-RU')}` : 
                            'Без дедлайна'
                        }
                        ${isOverdue ? '<span class="deadline-overdue">Просрочено</span>' : ''}
                        ${isSoon && !isOverdue && !project.completed ? '<span class="deadline-soon">Скоро дедлайн</span>' : ''}
                    </div>
                    
                    <div class="project-actions">
                        <button class="btn-primary" onclick="game.toggleTaskComplete(${project.id})">
                            <i class="fas fa-check"></i> Отметить задачу
                        </button>
                        <button class="btn-success" onclick="game.completeProject(${project.id})" ${project.completed ? 'disabled' : ''}>
                            <i class="fas fa-flag-checkered"></i> Завершить
                        </button>
                        <button class="btn-danger" onclick="game.deleteProject(${project.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    
                    <div class="project-tasks" id="tasks-${project.id}" style="display: none; margin-top: 20px;">
                        <h4>Задачи:</h4>
                        <ul class="tasks-list">
                            ${project.tasks?.map((task, index) => `
                                <li class="task-item ${task.completed ? 'completed' : ''}">
                                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                                           onchange="game.toggleTask(${project.id}, ${index})">
                                    <span>${task.title} (+${task.xp || 10} XP)</span>
                                    ${task.subtasks ? `
                                        <ul class="subtasks">
                                            ${task.subtasks.map(subtask => `
                                                <li class="${subtask.completed ? 'completed' : ''}">
                                                    <input type="checkbox" ${subtask.completed ? 'checked' : ''}>
                                                    <span>${subtask.title}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : ''}
                                </li>
                            `).join('') || '<li>Нет задач</li>'}
                        </ul>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Получение прогресса проекта
    getProjectProgress(project) {
        if (!project.tasks || project.tasks.length === 0) return 0;
        
        const totalTasks = this.countAllTasks(project.tasks);
        const completedTasks = this.countCompletedTasks(project.tasks);
        
        return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }

    // Подсчет всех задач (включая подзадачи)
    countAllTasks(tasks) {
        let count = 0;
        tasks.forEach(task => {
            count++;
            if (task.subtasks) {
                count += task.subtasks.length;
            }
        });
        return count;
    }

    // Подсчет выполненных задач
    countCompletedTasks(tasks) {
        let count = 0;
        tasks.forEach(task => {
            if (task.completed) count++;
            if (task.subtasks) {
                task.subtasks.forEach(subtask => {
                    if (subtask.completed) count++;
                });
            }
        });
        return count;
    }

    // Проверка просроченности проекта
    isProjectOverdue(project) {
        if (project.completed || !project.deadline) return false;
        const today = new Date();
        const deadline = new Date(project.deadline);
        return deadline < today;
    }

    // Проверка скорого дедлайна (за неделю)
    isDeadlineSoon(deadline) {
        if (!deadline) return false;
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const weekInMs = 7 * 24 * 60 * 60 * 1000;
        return deadlineDate - today < weekInMs && deadlineDate >= today;
    }

    // Переключение видимости задач проекта
    toggleProjectDetails(projectId) {
        const tasksDiv = document.getElementById(`tasks-${projectId}`);
        if (tasksDiv) {
            tasksDiv.style.display = tasksDiv.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Отметка задачи
    toggleTask(projectId, taskIndex) {
        const project = this.data.projects.find(p => p.id === projectId);
        if (!project || !project.tasks[taskIndex]) return;
        
        const task = project.tasks[taskIndex];
        task.completed = !task.completed;
        
        // Начисляем XP за задачу
        if (task.completed) {
            const xp = task.xp || 10;
            this.addXP(xp, `Задача: ${task.title}`);
            this.data.stats.totalTasksCompleted++;
        }
        
        // Проверяем, завершен ли проект
        const progress = this.getProjectProgress(project);
        if (progress === 100 && !project.completed) {
            project.completed = true;
            this.addXP(project.tasks.length * 20, `Проект: ${project.title}`);
            this.data.stats.completedProjects++;
            this.showNotification(`🎉 Проект "${project.title}" завершен!`);
        }
        
        this.saveData();
        this.updateUI();
    }

    // Завершение проекта
    completeProject(projectId) {
        const project = this.data.projects.find(p => p.id === projectId);
        if (project) {
            project.completed = true;
            // Начисляем бонусные XP за завершение
            this.addXP(project.tasks.length * 30, `Завершение проекта: ${project.title}`);
            this.data.stats.completedProjects++;
            this.saveData();
            this.updateUI();
            this.showNotification(`Проект "${project.title}" завершен!`);
        }
    }

    // Удаление проекта
    deleteProject(projectId) {
        if (confirm('Удалить проект? Это действие нельзя отменить.')) {
            this.data.projects = this.data.projects.filter(p => p.id !== projectId);
            this.saveData();
            this.updateUI();
        }
    }

    // Инициализация событий
    initEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.closest('.nav-btn').dataset.section;
                this.showSection(section);
            });
        });

        // Новая кнопка проекта
        document.getElementById('new-project-btn')?.addEventListener('click', () => {
            this.showProjectModal();
        });

        // Новая кнопка привычки
        document.getElementById('new-habit-btn')?.addEventListener('click', () => {
            this.showHabitModal();
        });

        // Переключение темы
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Экспорт данных
        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            this.exportData();
        });

        // Импорт данных
        document.getElementById('import-data-btn')?.addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file')?.addEventListener('change', (e) => {
            this.importData(e);
        });

        // Сброс данных
        document.getElementById('reset-data-btn')?.addEventListener('click', () => {
            if (confirm('ВНИМАНИЕ! Это удалит ВСЕ данные. Продолжить?')) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    // Показать секцию
    showSection(sectionName) {
        // Скрыть все секции
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Деактивировать все кнопки навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Показать выбранную секцию
        document.getElementById(`${sectionName}-section`)?.classList.add('active');
        
        // Активировать соответствующую кнопку
        document.querySelector(`.nav-btn[data-section="${sectionName}"]`)?.classList.add('active');
    }

    // Переключение темы
    toggleTheme() {
        this.data.user.theme = this.data.user.theme === 'dark' ? 'light' : 'dark';
        document.body.className = `${this.data.user.theme}-theme`;
        this.saveData();
    }

    // Экспорт данных
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `life-game-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Данные экспортированы!');
    }

    // Импорт данных
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.version && importedData.version === this.version) {
                    if (confirm('Заменить текущие данные импортированными?')) {
                        this.data = importedData;
                        this.saveData();
                        location.reload();
                    }
                } else {
                    alert('Неверная версия файла или поврежденные данные.');
                }
            } catch (error) {
                alert('Ошибка при чтении файла.');
            }
        };
        reader.readAsText(file);
        
        // Сброс input
        event.target.value = '';
    }

    // Проверка ачивок
    checkAchievements() {
        let newAchievements = [];
        
        // Проверяем ачивки продуктивности
        if (this.data.stats.totalTasksCompleted >= 100) {
            const ach = this.data.achievements.find(a => a.id === 1);
            if (ach && !ach.earned) {
                ach.earned = true;
                ach.earnedAt = new Date().toISOString();
                newAchievements.push(ach);
            }
        }
        
        if (this.data.user.streak >= 7) {
            const ach = this.data.achievements.find(a => a.id === 2);
            if (ach && !ach.earned) {
                ach.earned = true;
                ach.earnedAt = new Date().toISOString();
                newAchievements.push(ach);
            }
        }
        
        // Показываем уведомления о новых ачивках
        newAchievements.forEach(ach => {
            this.showNotification(`🏆 Получена ачивка: ${ach.title}!`, 'success');
        });
        
        if (newAchievements.length > 0) {
            this.saveData();
            this.renderAchievements();
        }
    }

    // Рендеринг ачивок
    renderAchievements() {
        const grid = document.getElementById('achievements-grid');
        if (!grid) return;
        
        const achieved = this.data.achievements.filter(a => a.earned).length;
        const total = this.data.achievements.length;
        
        document.getElementById('achieved-count').textContent = achieved;
        document.getElementById('total-achievements').textContent = total;
        
        grid.innerHTML = this.data.achievements.map(ach => `
            <div class="achievement-card ${ach.earned ? 'earned' : 'locked'}">
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-info">
                    <h4>${ach.title}</h4>
                    <p>${ach.description}</p>
                </div>
                <div class="achievement-status">
                    ${ach.earned ? 
                        `<span class="earned-date">${new Date(ach.earnedAt).toLocaleDateString('ru-RU')}</span>` :
                        '<span class="locked-label">Заблокировано</span>'
                    }
                </div>
            </div>
        `).join('');
    }

    // Инициализация графиков
    initCharts() {
        const ctx = document.getElementById('level-chart');
        if (ctx) {
            // Здесь будет код для Chart.js
            // Пока оставляем заглушку
        }
    }

    // Обновление статистики
    updateStats() {
        const progressList = document.getElementById('projects-progress');
        if (!progressList) return;
        
        const activeProjects = this.data.projects.filter(p => !p.completed);
        
        progressList.innerHTML = activeProjects.map(project => {
            const progress = this.getProjectProgress(project);
            const category = this.data.categories.find(c => c.id === project.category);
            
            return `
                <div class="project-progress-item">
                    <div class="progress-header">
                        <span>${project.title}</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%; background: ${category?.color || '#666'}"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Показ модального окна проекта
    showProjectModal() {
        const modal = document.getElementById('project-modal');
        modal.style.display = 'block';
        
        // Заполняем категории
        const categorySelect = document.getElementById('project-category');
        categorySelect.innerHTML = this.data.categories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
        
        // Устанавливаем минимальную дату завтра
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('project-deadline').min = tomorrow.toISOString().split('T')[0];
        
        // Обработчик формы
        const form = document.getElementById('project-form');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.createProject();
        };
        
        // Кнопка добавления задачи
        document.getElementById('add-task-btn').onclick = () => {
            this.addTaskInput();
        };
        
        // Кнопка отмены
        document.getElementById('cancel-project-btn').onclick = () => {
            modal.style.display = 'none';
            form.reset();
        };
    }

    // Создание проекта
    createProject() {
        const title = document.getElementById('project-title').value;
        const description = document.getElementById('project-description').value;
        const category = document.getElementById('project-category').value;
        const deadline = document.getElementById('project-deadline').value;
        
        // Собираем задачи
        const taskElements = document.querySelectorAll('.task-item');
        const tasks = Array.from(taskElements).map((taskEl, index) => {
            const titleInput = taskEl.querySelector('.task-title');
            const xpInput = taskEl.querySelector('.task-xp');
            return {
                id: index + 1,
                title: titleInput.value,
                xp: parseInt(xpInput.value) || 10,
                completed: false
            };
        });
        
        const newProject = {
            id: Date.now(),
            title,
            description,
            category,
            deadline,
            created: new Date().toISOString(),
            completed: false,
            tasks
        };
        
        this.data.projects.push(newProject);
        this.saveData();
        this.updateUI();
        
        // Закрываем модалку и сбрасываем форму
        document.getElementById('project-modal').style.display = 'none';
        document.getElementById('project-form').reset();
        
        this.showNotification(`Проект "${title}" создан!`);
    }

    // Добавление поля задачи
    addTaskInput() {
        const container = document.getElementById('tasks-container');
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        taskDiv.innerHTML = `
            <input type="text" class="task-title" placeholder="Название задачи" required>
            <input type="number" class="task-xp" placeholder="XP" min="1" value="10">
            <button type="button" class="remove-task-btn"><i class="fas fa-times"></i></button>
        `;
        
        taskDiv.querySelector('.remove-task-btn').onclick = () => {
            taskDiv.remove();
        };
        
        container.appendChild(taskDiv);
    }
}

// Инициализация приложения
window.game = new LifeGame();

// Глобальные функции для использования в HTML
window.toggleTaskComplete = (projectId) => {
    game.toggleTaskComplete(projectId);
};

window.toggleTask = (projectId, taskIndex) => {
    game.toggleTask(projectId, taskIndex);
};

window.completeProject = (projectId) => {
    game.completeProject(projectId);
};

window.deleteProject = (projectId) => {
    game.deleteProject(projectId);
};

window.toggleProjectDetails = (projectId) => {
    game.toggleProjectDetails(projectId);
};
