let todos = JSON.parse(localStorage.getItem('todos')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || [];
let planner = JSON.parse(localStorage.getItem('planner')) || [];
let currentFilter = 'all';
let timerInterval = null;
let timeLeft = 25 * 60;
let totalTime = 25 * 60;
let timerMode = 'work';
let isTimerRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    loadQuote();
    loadWeather();
    updateDashboardStats();
    setupFeatureCards();
    setupEventListeners();
});

function showDashboard() {
    document.querySelectorAll('.feature-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById('dashboardView').classList.add('active');
    updateDashboardStats();
}

function showFeature(featureName) {
    document.getElementById('dashboardView').classList.remove('active');
    document.querySelectorAll('.feature-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(featureName + 'View').classList.add('active');
    
    if (featureName === 'todo') renderTodos();
    if (featureName === 'goals') renderGoals();
    if (featureName === 'pomodoro') updateTimerDisplay();
    if (featureName === 'planner') renderPlanner();
}

function setupFeatureCards() {
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', () => {
            const feature = card.dataset.feature;
            showFeature(feature);
        });
    });
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme');
    const icon = document.querySelector('.theme-icon');
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
}

function updateDateTime() {
    const now = new Date();
    
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', dateOptions);
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', timeOptions);
}

async function loadWeather() {
    try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true');
        const data = await response.json();
        const temp = Math.round(data.current_weather.temperature);
        document.getElementById('weatherTemp').textContent = `${temp}°C`;
    } catch (error) {
        document.getElementById('weatherTemp').textContent = '--°';
    }
}

const quotes = [
    { text: "Buzz into action! The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Stay busy like a bee, sweet success will follow!", author: "Unknown" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
];

function loadQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    document.getElementById('quoteText').textContent = quote.text;
    document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;
}

function updateDashboardStats() {
    const activeTodos = todos.filter(t => !t.completed).length;
    document.getElementById('dashboardTodoCount').textContent = `${activeTodos} active`;

    const completedGoals = goals.filter(g => g.completed).length;
    const totalGoals = goals.length;
    const goalsPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    document.getElementById('dashboardGoalsCount').textContent = `${completedGoals}/${totalGoals}`;
    document.getElementById('dashboardGoalsProgress').style.width = `${goalsPercentage}%`;

    document.getElementById('dashboardPlannerCount').textContent = `${planner.length} events`;

    document.getElementById('dashboardTimerStatus').textContent = isTimerRunning ? 'Running...' : 'Ready';
}

function renderTodos() {
    const todoList = document.getElementById('todoList');
    const filteredTodos = getFilteredTodos();
    
    todoList.innerHTML = '';
    
    if (filteredTodos.length === 0) {
        todoList.innerHTML = '<li style="text-align: center; color: var(--text-muted); padding: 40px; font-size: 1.1rem;">🐝 No tasks yet. Add one above!</li>';
        return;
    }
    
    filteredTodos.forEach((todo) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todos.indexOf(todo)})">
            <span>${todo.text}</span>
            <button onclick="deleteTodo(${todos.indexOf(todo)})">×</button>
        `;
        todoList.appendChild(li);
    });
}

function getFilteredTodos() {
    if (currentFilter === 'active') {
        return todos.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        return todos.filter(todo => todo.completed);
    }
    return todos;
}

function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (text === '') return;
    
    todos.push({ text, completed: false });
    saveTodos();
    renderTodos();
    updateDashboardStats();
    input.value = '';
}

function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    saveTodos();
    renderTodos();
    updateDashboardStats();
}

function deleteTodo(index) {
    todos.splice(index, 1);
    saveTodos();
    renderTodos();
    updateDashboardStats();
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function renderGoals() {
    const goalsList = document.getElementById('goalsList');
    goalsList.innerHTML = '';
    
    if (goals.length === 0) {
        goalsList.innerHTML = '<li style="text-align: center; color: var(--text-muted); padding: 40px; font-size: 1.1rem;">🍯 No goals yet. Set your first sweet goal!</li>';
        return;
    }
    
    goals.forEach((goal, index) => {
        const li = document.createElement('li');
        li.className = `goal-item ${goal.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" ${goal.completed ? 'checked' : ''} onchange="toggleGoal(${index})">
            <span>${goal.text}</span>
            <button onclick="deleteGoal(${index})">×</button>
        `;
        goalsList.appendChild(li);
    });
    
    updateGoalsProgress();
}

function addGoal() {
    const input = document.getElementById('goalInput');
    const text = input.value.trim();
    
    if (text === '') return;
    
    goals.push({ text, completed: false });
    saveGoals();
    renderGoals();
    updateDashboardStats();
    input.value = '';
}

function toggleGoal(index) {
    goals[index].completed = !goals[index].completed;
    saveGoals();
    renderGoals();
    updateDashboardStats();
}

function deleteGoal(index) {
    goals.splice(index, 1);
    saveGoals();
    renderGoals();
    updateDashboardStats();
}

function saveGoals() {
    localStorage.setItem('goals', JSON.stringify(goals));
}

function updateGoalsProgress() {
    const completed = goals.filter(g => g.completed).length;
    const total = goals.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    const ring = document.getElementById('goalsRingProgress');
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (percentage / 100) * circumference;
    ring.style.strokeDashoffset = offset;

    document.getElementById('goalsPercentage').textContent = `${Math.round(percentage)}%`;
}

function startTimer() {
    if (isTimerRunning) return;
    
    isTimerRunning = true;
    updateDashboardStats();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        updateTimerProgress();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            updateDashboardStats();
            alert('🐝 Timer completed! Great work! Time for some honey!');
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    updateDashboardStats();
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    const modeBtn = document.querySelector(`.mode-btn[data-mode="${timerMode}"]`);
    timeLeft = parseInt(modeBtn.dataset.time) * 60;
    totalTime = timeLeft;
    updateTimerDisplay();
    updateTimerProgress();
    updateDashboardStats();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timerDisplay').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimerProgress() {
    const progress = document.getElementById('timerProgress');
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (timeLeft / totalTime) * circumference;
    progress.style.strokeDashoffset = offset;
}

function setTimerMode(mode, time) {
    timerMode = mode;
    timeLeft = time * 60;
    totalTime = timeLeft;
    clearInterval(timerInterval);
    isTimerRunning = false;
    updateTimerDisplay();
    updateTimerProgress();
    updateDashboardStats();
    
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.mode-btn[data-mode="${mode}"]`).classList.add('active');
}

function renderPlanner() {
    const plannerList = document.getElementById('plannerList');
    plannerList.innerHTML = '';
    
    if (planner.length === 0) {
        plannerList.innerHTML = '<li style="text-align: center; color: var(--text-muted); padding: 40px; font-size: 1.1rem;">📅 No events scheduled. Plan your productive day!</li>';
        return;
    }
    
    planner.sort((a, b) => a.time.localeCompare(b.time));
    
    planner.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'planner-item';
        li.innerHTML = `
            <span class="planner-time">${formatTime(item.time)}</span>
            <span class="planner-task">${item.task}</span>
            <button onclick="deletePlannerItem(${index})">×</button>
        `;
        plannerList.appendChild(li);
    });
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function addPlannerItem() {
    const timeInput = document.getElementById('plannerTime');
    const taskInput = document.getElementById('plannerTask');
    const time = timeInput.value;
    const task = taskInput.value.trim();
    
    if (time === '' || task === '') return;
    
    planner.push({ time, task });
    savePlanner();
    renderPlanner();
    updateDashboardStats();
    timeInput.value = '';
    taskInput.value = '';
}

function deletePlannerItem(index) {
    planner.splice(index, 1);
    savePlanner();
    renderPlanner();
    updateDashboardStats();
}

function savePlanner() {
    localStorage.setItem('planner', JSON.stringify(planner));
}

function setupEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    document.getElementById('newQuoteBtn').addEventListener('click', loadQuote);
    
    document.getElementById('addTodoBtn').addEventListener('click', addTodo);
    document.getElementById('todoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });
    
    document.getElementById('addGoalBtn').addEventListener('click', addGoal);
    document.getElementById('goalInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addGoal();
    });

    document.getElementById('startTimerBtn').addEventListener('click', startTimer);
    document.getElementById('pauseTimerBtn').addEventListener('click', pauseTimer);
    document.getElementById('resetTimerBtn').addEventListener('click', resetTimer);
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setTimerMode(btn.dataset.mode, parseInt(btn.dataset.time));
        });
    });

    document.getElementById('addPlannerBtn').addEventListener('click', addPlannerItem);
    document.getElementById('plannerTask').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlannerItem();
    });
}