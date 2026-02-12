// ============================================
// DASHBOARD FUNCTIONALITY
// ============================================

let workoutChart = null;

// Load dashboard data
async function loadDashboardData() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const userId = user.uid;
        
        // Fetch workouts
        let workouts = [];
        if (userId !== 'admin-uid') {
            const workoutsSnapshot = await db.collection('workouts')
                .where('userId', '==', userId)
                .get();
            
            workouts = workoutsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        
        // Fetch goals
        let goals = [];
        if (userId !== 'admin-uid') {
            const goalsSnapshot = await db.collection('goals')
                .where('userId', '==', userId)
                .get();
            
            goals = goalsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        
        // Calculate stats
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const weeklyWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo).length;
        const caloriesBurned = workouts.length * 300;
        const completedGoals = goals.filter(g => g.status === 'completed').length;
        
        // Update UI
        const totalWorkoutsEl = document.getElementById('total-workouts');
        const weeklyWorkoutsEl = document.getElementById('weekly-workouts');
        const caloriesBurnedEl = document.getElementById('calories-burned');
        const completedGoalsEl = document.getElementById('completed-goals');
        
        if (totalWorkoutsEl) totalWorkoutsEl.textContent = workouts.length;
        if (weeklyWorkoutsEl) weeklyWorkoutsEl.textContent = weeklyWorkouts;
        if (caloriesBurnedEl) caloriesBurnedEl.textContent = caloriesBurned;
        if (completedGoalsEl) completedGoalsEl.textContent = completedGoals;
        
        // Create chart
        createWorkoutChart(workouts);
        
        // Load recent workouts
        loadRecentWorkouts(workouts.slice(0, 5));
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Create workout chart
function createWorkoutChart(workouts) {
    const ctx = document.getElementById('workoutChart');
    if (!ctx) return;
    
    // Get last 7 days
    const last7Days = [];
    const workoutCounts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        last7Days.push(dayName);
        
        const count = workouts.filter(w => {
            const workoutDate = new Date(w.date);
            return workoutDate.toLocaleDateString('en-US', { weekday: 'short' }) === dayName;
        }).length;
        
        workoutCounts.push(count);
    }
    
    // Destroy existing chart if exists
    if (workoutChart) {
        workoutChart.destroy();
    }
    
    // Create new chart
    workoutChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Workouts',
                data: workoutCounts,
                backgroundColor: 'rgba(76, 175, 80, 0.6)',
                borderColor: '#4CAF50',
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Load recent workouts
function loadRecentWorkouts(workouts) {
    const recentContainer = document.getElementById('recent-workouts');
    if (!recentContainer) return;
    
    if (workouts.length === 0) {
        recentContainer.innerHTML = `
            <div style="text-align: center; padding: 32px;">
                <p style="color: var(--text-light);">No workouts yet. Start by adding your first workout!</p>
            </div>
        `;
        return;
    }
    
    recentContainer.innerHTML = workouts.map(workout => `
        <div class="recent-item">
            <div class="recent-info">
                <h4>${workout.name}</h4>
                <div class="recent-meta">
                    <span>📅 ${new Date(workout.date).toLocaleDateString()}</span>
                    <span>⏱️ ${workout.duration} min</span>
                </div>
            </div>
            <div class="recent-stats">
                ${workout.sets ? `<span>${workout.sets} sets</span>` : ''}
                ${workout.reps ? `<span>${workout.reps} reps</span>` : ''}
            </div>
        </div>
    `).join('');
}

// Theme toggle
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDark ? '<span>☀️</span> Light Mode' : '<span>🌙</span> Dark Mode';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<span>☀️</span> Light Mode';
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    initThemeToggle();
    setCurrentDate();
});