// Основной класс приложения
class LifeGame {
    constructor() {
        this.version = 1;
        this.dataKey = 'lifeGameData';
        this.categories = [
            { id: 'work', name: 'Работа', color: '#007AFF' },
            { id: 'health', name: 'Здоровье', color: '#34C759' },
            { id: 'learning', name: 'Обучение', color: '#AF52DE' },
            { id: 'personal', name: 'Личное', color: '#FF9500' }
        ];
        
        this.achievements = [
            { id: 1, title: 'Первый шаг', description: 'Выполни первую задачу', icon: '🚀', earned: false },
            { id: 2, title: 'Неделя без пропусков', description: '7 дней подряд с активностью', icon: '🔥', earned: false },
            { id: 3, title: 'Проект завершён', description: 'Заверши свой первый проект', icon: '🏆', earned: false },
            { id: 4, title: 'Мастер привычек', description: 'Выполняй все привычки неделю', icon: '💪', earned: false },
            { id: 5, title: 'Уровень 5', description: 'Достигни 5 уровня', icon: '⭐', earned: false }
        ];
        
        this.init();
    }

    // Инициализация приложения
    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupDefaultCategories();
        this.renderProjects();
        this.renderHabits();
        this.renderAchievements();
        this.updateStats();
        this.checkDailyReset();
        this.showToast('Добро пожаловать в Life Game!', 'success');
    }

    // Загрузка данных из localStorage
    loadData() {
        const saved = localStorage.getItem(this.dataKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.data = data;
                
                // Миграция старых данных
                if (!this.data.version) {
                    this.data = this.migrateOldData(data);
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
                lastActive: new Date().toISOString().split('T')[0]
            },
            projects: [],
            habits: [],
            achievements: this.achievements.map(a => ({ ...a })),
            stats: {
                totalDays: 1,
                completedTasks: 0,
                completedProjects: 0,
                totalHabits: 0
            }
        };
        this.saveData();
    }

    // Миграция старых данных
    migrateOldData(oldData) {
        const newData = {
            version: this.version,
            user: oldData.user || {
                level: 1,
                xp: 0,
                totalXP: 0,
                xpToNextLevel: 100,
                coins: 0,
                streak: 0,
                maxStreak: 0,
                lastActive: new Date().toISOString().split('T')[0]
            },
            projects: oldData.projects || [],
            habits: oldData.habits || [],
            achievements: this.achievements.map(a => {
                const oldAch = oldData.achievements?.find(o => o.id === a.id);
                return oldAch ? { ...a, earned: oldAch.earned } : a;
            }),
            stats: oldData.stats || {
                totalDays: 1,
                completedTasks: 0,
                completedProjects: 0,
                totalHabits: 0
            }
        };
        return newData;
    }

    // Сохранение данных
    saveData() {
        localStorage.setItem(this.dataKey, JSON.stringify(this.data));
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.dataset.tab;
                this.showTab(tab);
            });
        });

        // Переключение темы
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Кнопка настроек
        document.getElementById('settings-btn').addEventListener('click', () => {
            document.getElementById('settings-panel').classList.add('active');
            this.renderCategories();
        });

        // Закрытие настроек
        document.querySelector('.close-settings').addEventListener('click', () => {
            document.getElementById('settings-panel').classList.remove('active');
        });

        // Создание проекта
        document.getElementById('new-project-btn').addEventListener('click', () => {
            this.showProjectModal();
        });

        // Создание привычки
        document.getElementById('new-habit-btn').addEventListener('click', () => {
            this.showHabitModal();
        });

        // Фильтры проектов
        document.getElementById('category-filter').addEventListener('change', () => {
            this.renderProjects();
        });
        
        document.getElementById('status-filter').addEventListener('change', () => {
            this.renderProjects();
        });
        
        document.getElementById('sort-by').addEventListener('change', () => {
            this.renderProjects();
        });

        // Добавление категории
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.addCategory();
        });

        // Экспорт данных
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        // Импорт данных
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e);
        });

        // Сброс данных
        document.getElementById('reset-btn').addEventListener('click', () => {
            if (confirm('Вы уверены? Все данные будут удалены.')) {
                localStorage.clear();
                location.reload();
            }
        });

        // Закрытие модальных окон
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
            });
        });

        // Закрытие модальных окон при клике вне
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    // Настройка категорий по умолчанию
    setupDefaultCategories() {
        const categorySelects = document.querySelectorAll('#project-category, #habit-category, #category-filter');
        categorySelects.forEach(select => {
            if (select.id === 'category-filter') {
                select.innerHTML = '<option value="all">Все категории</option>';
            }
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        });
    }

    // Показать вкладку
    showTab(tabName) {
        // Скрыть все вкладки
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Убрать активный класс у всех навигационных элементов
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Показать выбранную вкладку
        document.getElementById(`${tabName}-section`).classList.add('active');

        // Активировать соответствующий навигационный элемент
        document.querySelector(`.nav-item[data-tab="${tabName}"]`).classList.add('active');
    }

    // Переключение темы
    toggleTheme() {
        const body = document.body;
        const themeBtn = document.getElementById('theme-toggle');
        
        if (body.classList.contains('light-theme')) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            this.showToast('Тёмная тема включена');
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            this.showToast('Светлая тема включена');
        }
    }

    // Проверка ежедневного сброса
    checkDailyReset() {
        const today = new Date().toISOString().split('T')[0];
        
        if (this.data.user.lastActive !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            // Проверяем стрик
            if (this.data.user.lastActive === yesterdayStr) {
                this.data.user.streak++;
                if (this.data.user.streak > this.data.user.maxStreak) {
                    this.data.user.maxStreak = this.data.user.streak;
                }
            } else if (this.data.user.lastActive !== today) {
                this.data.user.streak = 1;
            }
            
            this.data.user.lastActive = today;
            this.data.stats.totalDays++;
            
            // Сбрасываем ежедневные привычки
            this.resetDailyHabits();
            
            this.saveData();
            this.updateUI();
        }
    }

    // Сброс ежедневных привычек
    resetDailyHabits() {
        this.data.habits.forEach(habit => {
            if (habit.type === 'daily') {
                habit.completed = false;
            }
        });
    }

    // Добавление XP
    addXP(amount, source) {
        this.data.user.xp += amount;
        this.data.user.totalXP += amount;
        
        // Проверка нового уровня
        while (this.data.user.xp >= this.data.user.xpToNextLevel) {
            this.data.user.xp -= this.data.user.xpToNextLevel;
            this.data.user.level++;
            this.data.user.xpToNextLevel = this.data.user.level * 100;
            
            // Награда за уровень
            this.data.user.coins += this.data.user.level * 10;
            this.showToast(`🎉 Уровень ${this.data.user.level}! +${this.data.user.level * 10} монет`, 'success');
            
            // Проверка ачивки за уровень
            if (this.data.user.level >= 5) {
                this.unlockAchievement(5);
            }
        }
        
        // Добавление монет
        const coinsEarned = Math.floor(amount / 5);
        this.data.user.coins += coinsEarned;
        
        this.saveData();
        this.updateUI();
        
        if (source) {
            this.showToast(`+${amount} XP (${source})`, 'success');
        }
    }

    // Обновление UI
    updateUI() {
        // Обновляем информацию пользователя
        document.getElementById('level').textContent = this.data.user.level;
        document.getElementById('current-xp').textContent = this.data.user.xp;
        document.getElementById('needed-xp').textContent = this.data.user.xpToNextLevel;
        document.getElementById('coins').textContent = this.data.user.coins;
        
        // Обновляем прогресс-бар XP
        const xpPercent = (this.data.user.xp / this.data.user.xpToNextLevel) * 100;
        document.getElementById('xp-progress-fill').style.width = `${xpPercent}%`;
        document.getElementById('xp-text').textContent = `${this.data.user.xp}/${this.data.user.xpToNextLevel} XP`;
        
        this.updateStats();
    }

    // Обновление статистики
    updateStats() {
        document.getElementById('streak').textContent = this.data.user.streak;
        document.getElementById('completed-tasks').textContent = this.data.stats.completedTasks;
        document.getElementById('active-projects').textContent = this.data.projects.filter(p => !p.completed).length;
        document.getElementById('total-coins').textContent = this.data.user.coins;
        
        this.renderProjectProgress();
    }

    // Рендеринг проектов
    renderProjects() {
        const grid = document.getElementById('projects-grid');
        if (!grid) return;
        
        const categoryFilter = document.getElementById('category-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        const sortBy = document.getElementById('sort-by').value;
        
        // Фильтрация
        let projects = this.data.projects.filter(project => {
            if (categoryFilter !== 'all' && project.category !== categoryFilter) {
                return false;
            }
            
            if (statusFilter === 'active' && project.completed) {
                return false;
            }
            
            if (statusFilter === 'completed' && !project.completed) {
                return false;
            }
            
            return true;
        });
        
        // Сортировка
        projects.sort((a, b) => {
            switch (sortBy) {
                case 'progress':
                    return this.getProjectProgress(b) - this.getProjectProgress(a);
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'deadline':
                default:
                    if (!a.deadline && !b.deadline) return 0;
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline) - new Date(b.deadline);
            }
        });
        
        // Рендеринг
        grid.innerHTML = projects.map(project => {
            const progress = this.getProjectProgress(project);
            const category = this.categories.find(c => c.id === project.category);
            const isOverdue = project.deadline && new Date(project.deadline) < new Date() && !project.completed;
            const isSoon = project.deadline && !project.completed && 
                          new Date(project.deadline) > new Date() && 
                          new Date(project.deadline) - new Date() < 7 * 24 * 60 * 60 * 1000;
            
            return `
                <div class="project-card ${isOverdue ? 'overdue' : ''} ${isSoon ? 'soon' : ''}">
                    <div class="project-header">
                        <div>
                            <h3 class="project-title">${project.title}</h3>
                            <span class="project-category" style="background-color: ${category?.color}20; color: ${category?.color}">
                                ${category?.name || 'Без категории'}
                            </span>
                        </div>
                        <div class="project-actions">
                            <button class="btn-icon" onclick="game.toggleProject(${project.id})" title="${project.completed ? 'Возобновить' : 'Завершить'}">
                                <i class="fas fa-${project.completed ? 'redo' : 'check'}"></i>
                            </button>
                            <button class="btn-icon" onclick="game.editProject(${project.id})" title="Редактировать">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="game.deleteProject(${project.id})" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    ${project.description ? `<p class="project-description">${project.description}</p>` : ''}
                    
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%; background-color: ${category?.color || '#007AFF'}"></div>
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
                        ${isOverdue ? '<span class="deadline-overdue"> • Просрочено</span>' : ''}
                        ${isSoon && !isOverdue ? '<span class="deadline-soon"> • Скоро дедлайн</span>' : ''}
                    </div>
                    
                    <div class="project-tasks">
                        <h4>Задачи (${this.getCompletedTasksCount(project)}/${project.tasks.length})</h4>
                        <ul>
                            ${project.tasks.map((task, index) => `
                                <li style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                                           onchange="game.toggleTask(${project.id}, ${index})"
                                           style="cursor: pointer;">
                                    <span style="flex: 1; ${task.completed ? 'text-decoration: line-through; opacity: 0.7;' : ''}">
                                        ${task.title} (+${task.xp} XP)
                                    </span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }).join('');
        
        if (projects.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #8E8E93;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Нет проектов</h3>
                    <p>Создайте свой первый проект!</p>
                    <button class="btn btn-primary" onclick="game.showProjectModal()">
                        <i class="fas fa-plus"></i> Создать проект
                    </button>
                </div>
            `;
        }
    }

    // Получение прогресса проекта
    getProjectProgress(project) {
        if (!project.tasks || project.tasks.length === 0) return 0;
        const completed = project.tasks.filter(t => t.completed).length;
        return Math.round((completed / project.tasks.length) * 100);
    }

    // Получение количества выполненных задач
    getCompletedTasksCount(project) {
        return project.tasks ? project.tasks.filter(t => t.completed).length : 0;
    }

    // Переключение задачи
    toggleTask(projectId, taskIndex) {
        const project = this.data.projects.find(p => p.id === projectId);
        if (!project || !project.tasks[taskIndex]) return;
        
        const task = project.tasks[taskIndex];
        task.completed = !task.completed;
        
        // Начисление XP
        if (task.completed) {
            this.addXP(task.xp, `Задача: ${task.title}`);
            this.data.stats.completedTasks++;
            
            // Проверка ачивки "Первый шаг"
            if (this.data.stats.completedTasks === 1) {
                this.unlockAchievement(1);
            }
        } else {
            this.data.stats.completedTasks--;
        }
        
        // Проверка завершения проекта
        const allCompleted = project.tasks.every(t => t.completed);
        if (allCompleted && !project.completed) {
            project.completed = true;
            this.data.stats.completedProjects++;
            this.addXP(project.tasks.length * 20, `Проект завершён: ${project.title}`);
            this.showToast(`🎉 Проект "${project.title}" завершён!`, 'success');
            
            // Проверка ачивки "Проект завершён"
            this.unlockAchievement(3);
        } else if (!allCompleted && project.completed) {
            project.completed = false;
            this.data.stats.completedProjects--;
        }
        
        this.saveData();
        this.renderProjects();
        this.updateUI();
    }

    // Переключение проекта (завершение/возобновление)
    toggleProject(projectId) {
        const project = this.data.projects.find(p => p.id === projectId);
        if (!project) return;
        
        project.completed = !project.completed;
        
        if (project.completed) {
            this.data.stats.completedProjects++;
            this.showToast(`Проект "${project.title}" завершён`);
        } else {
            this.data.stats.completedProjects--;
            this.showToast(`Проект "${project.title}" возобновлён`);
        }
        
        this.saveData();
        this.renderProjects();
        this.updateUI();
    }

    // Удаление проекта
    deleteProject(projectId) {
        if (confirm('Удалить проект? Это действие нельзя отменить.')) {
            this.data.projects = this.data.projects.filter(p => p.id !== projectId);
            this.saveData();
            this.renderProjects();
            this.showToast('Проект удалён');
        }
    }

    // Редактирование проекта (заглушка)
    editProject(projectId) {
        this.showToast('Редактирование в разработке', 'info');
    }

    // Показать модальное окно проекта
    showProjectModal() {
        const modal = document.getElementById('project-modal');
        const form = document.getElementById('project-form');
        
        // Сброс формы
        form.reset();
        
        // Заполнение категорий
        const categorySelect = document.getElementById('project-category');
        categorySelect.innerHTML = '';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        
        // Обработчик отправки формы
        form.onsubmit = (e) => {
            e.preventDefault();
            this.createProject();
        };
        
        // Обработчик добавления задачи
        document.getElementById('add-task-btn').onclick = () => {
            this.addTaskInput();
        };
        
        // Инициализация с одной задачей
        const tasksContainer = document.getElementById('tasks-container');
        tasksContainer.innerHTML = `
            <div class="task-input">
                <input type="text" class="task-name" placeholder="Название задачи" required>
                <input type="number" class="task-xp" placeholder="XP" min="1" value="10">
                <button type="button" class="btn-icon remove-task" onclick="this.parentElement.remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        modal.classList.add('active');
    }

    // Добавление поля задачи
    addTaskInput() {
        const tasksContainer = document.getElementById('tasks-container');
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-input';
        taskDiv.innerHTML = `
            <input type="text" class="task-name" placeholder="Название задачи" required>
            <input type="number" class="task-xp" placeholder="XP" min="1" value="10">
            <button type="button" class="btn-icon remove-task" onclick="this.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        `;
        tasksContainer.appendChild(taskDiv);
    }

    // Создание проекта
    createProject() {
        const title = document.getElementById('project-name').value;
        const description = document.getElementById('project-description').value;
        const category = document.getElementById('project-category').value;
        const deadline = document.getElementById('project-deadline').value;
        
        // Сбор задач
        const taskInputs = document.querySelectorAll('.task-input');
        const tasks = Array.from(taskInputs).map(input => {
            return {
                title: input.querySelector('.task-name').value,
                xp: parseInt(input.querySelector('.task-xp').value) || 10,
                completed: false
            };
        });
        
        const newProject = {
            id: Date.now(),
            title,
            description,
            category,
            deadline: deadline || null,
            completed: false,
            tasks,
            createdAt: new Date().toISOString()
        };
        
        this.data.projects.push(newProject);
        this.saveData();
        this.renderProjects();
        
        // Закрытие модального окна
        document.getElementById('project-modal').classList.remove('active');
        
        this.showToast(`Проект "${title}" создан`, 'success');
    }

    // Рендеринг привычек
    renderHabits() {
        const todayList = document.getElementById('today-habits-list');
        const weekGrid = document.getElementById('week-grid');
        
        if (!todayList || !weekGrid) return;
        
        // Сегодняшние привычки
        const todayHabits = this.data.habits.filter(habit => habit.type === 'daily');
        todayList.innerHTML = todayHabits.map(habit => {
            const category = this.categories.find(c => c.id === habit.category);
            
            return `
                <div class="habit-item">
                    <div class="habit-checkbox ${habit.completed ? 'checked' : ''}" 
                         onclick="game.toggleHabit(${habit.id})">
                        <i class="fas fa-check" style="font-size: 0.8rem; ${habit.completed ? '' : 'display: none;'}"></i>
                    </div>
                    <div class="habit-info">
                        <div class="habit-name">${habit.title}</div>
                        <div class="habit-xp">+${habit.xp} XP</div>
                    </div>
                    <span class="project-category" style="background-color: ${category?.color}20; color: ${category?.color}; font-size: 0.75rem;">
                        ${category?.name || 'Без категории'}
                    </span>
                </div>
            `;
        }).join('');
        
        if (todayHabits.length === 0) {
            todayList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #8E8E93;">
                    <i class="fas fa-redo" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Нет привычек на сегодня</p>
                    <button class="btn btn-secondary" onclick="game.showHabitModal()">
                        <i class="fas fa-plus"></i> Добавить привычку
                    </button>
                </div>
            `;
        }
        
        // Недельная сетка
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        weekGrid.innerHTML = days.map(day => `
            <div class="week-day">
                ${day}
            </div>
        `).join('');
    }

    // Переключение привычки
    toggleHabit(habitId) {
        const habit = this.data.habits.find(h => h.id === habitId);
        if (!habit) return;
        
        habit.completed = !habit.completed;
        
        if (habit.completed) {
            this.addXP(habit.xp, `Привычка: ${habit.title}`);
            this.data.stats.totalHabits++;
            
            // Проверка ачивки "Мастер привычек"
            if (this.data.stats.totalHabits % 7 === 0) {
                this.unlockAchievement(4);
            }
        } else {
            this.data.stats.totalHabits--;
        }
        
        this.saveData();
        this.renderHabits();
        this.updateUI();
    }

    // Показать модальное окно привычки
    showHabitModal() {
        const modal = document.getElementById('habit-modal');
        const form = document.getElementById('habit-form');
        
        // Сброс формы
        form.reset();
        
        // Заполнение категорий
        const categorySelect = document.getElementById('habit-category');
        categorySelect.innerHTML = '';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        
        // Обработчик отправки формы
        form.onsubmit = (e) => {
            e.preventDefault();
            this.createHabit();
        };
        
        modal.classList.add('active');
    }

    // Создание привычки
    createHabit() {
        const title = document.getElementById('habit-name').value;
        const category = document.getElementById('habit-category').value;
        const xp = parseInt(document.getElementById('habit-xp').value) || 10;
        const type = document.querySelector('input[name="habit-type"]:checked').value;
        
        const newHabit = {
            id: Date.now(),
            title,
            category,
            xp,
            type,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.data.habits.push(newHabit);
        this.saveData();
        this.renderHabits();
        
        // Закрытие модального окна
        document.getElementById('habit-modal').classList.remove('active');
        
        this.showToast(`Привычка "${title}" создана`, 'success');
    }

    // Рендеринг ачивок
    renderAchievements() {
        const grid = document.getElementById('achievements-grid');
        if (!grid) return;
        
        const achieved = this.data.achievements.filter(a => a.earned).length;
        const total = this.data.achievements.length;
        
        document.getElementById('achieved-count').textContent = achieved;
        document.getElementById('total-achievements').textContent = total;
        
        grid.innerHTML = this.data.achievements.map(achievement => {
            return `
                <div class="achievement-card ${achievement.earned ? '' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                    <div class="achievement-status">
                        ${achievement.earned ? 'Получено' : 'Не получено'}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Разблокировка ачивки
    unlockAchievement(achievementId) {
        const achievement = this.data.achievements.find(a => a.id === achievementId);
        if (achievement && !achievement.earned) {
            achievement.earned = true;
            this.saveData();
            this.renderAchievements();
            this.showToast(`🏆 Ачивка получена: ${achievement.title}`, 'success');
        }
    }

    // Рендеринг прогресса проектов
    renderProjectProgress() {
        const container = document.getElementById('projects-progress');
        if (!container) return;
        
        const activeProjects = this.data.projects.filter(p => !p.completed);
        
        container.innerHTML = activeProjects.map(project => {
            const progress = this.getProjectProgress(project);
            const category = this.categories.find(c => c.id === project.category);
            
            return `
                <div class="project-progress-item">
                    <div class="progress-header">
                        <span>${project.title}</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%; background-color: ${category?.color || '#007AFF'}"></div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (activeProjects.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #8E8E93;">Нет активных проектов</p>';
        }
    }

    // Рендеринг категорий в настройках
    renderCategories() {
        const container = document.getElementById('categories-list');
        if (!container) return;
        
        container.innerHTML = this.categories.map(category => `
            <div class="category-item">
                <div class="category-color" style="background-color: ${category.color}"></div>
                <span class="category-name">${category.name}</span>
                <button class="btn-icon" onclick="game.deleteCategory('${category.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    // Добавление категории
    addCategory() {
        const nameInput = document.getElementById('new-category');
        const colorInput = document.getElementById('category-color');
        
        const name = nameInput.value.trim();
        const color = colorInput.value;
        
        if (!name) {
            this.showToast('Введите название категории', 'error');
            return;
        }
        
        const newCategory = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            color
        };
        
        this.categories.push(newCategory);
        this.setupDefaultCategories();
        this.renderCategories();
        
        // Сброс полей
        nameInput.value = '';
        colorInput.value = '#007AFF';
        
        this.showToast(`Категория "${name}" добавлена`, 'success');
    }

    // Удаление категории
    deleteCategory(categoryId) {
        if (this.categories.length <= 1) {
            this.showToast('Должна быть хотя бы одна категория', 'error');
            return;
        }
        
        this.categories = this.categories.filter(c => c.id !== categoryId);
        this.setupDefaultCategories();
        this.renderCategories();
        this.showToast('Категория удалена');
    }

    // Экспорт данных
    exportData() {
        const data = {
            ...this.data,
            categories: this.categories
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `life-game-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Данные экспортированы', 'success');
    }

    // Импорт данных
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (confirm('Заменить текущие данные импортированными?')) {
                    // Сохраняем категории если они есть в импортированных данных
                    if (importedData.categories) {
                        this.categories = importedData.categories;
                    }
                    
                    this.data = importedData;
                    this.saveData();
                    this.setupDefaultCategories();
                    this.renderProjects();
                    this.renderHabits();
                    this.renderAchievements();
                    this.updateUI();
                    
                    this.showToast('Данные импортированы', 'success');
                }
            } catch (error) {
                this.showToast('Ошибка при импорте данных', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // Сброс input
        event.target.value = '';
    }

    // Показать toast-уведомление
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show';
        
        // Стиль в зависимости от типа
        if (type === 'success') {
            toast.style.backgroundColor = '#34C759';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#FF3B30';
        } else if (type === 'info') {
            toast.style.backgroundColor = '#007AFF';
        }
        
        // Автоматическое скрытие
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Инициализация приложения
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new LifeGame();
    
    // Глобальные функции для использования в HTML
    window.game = game;
    
    // Закрытие модальных окон по клавише ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
            document.getElementById('settings-panel').classList.remove('active');
        }
    });
});
