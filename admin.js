// ============================================
// ADMIN DASHBOARD FUNCTIONALITY
// ============================================

let categoryChart = null;
let growthChart = null;

// Check if user is admin
function checkAdminAccess() {
    const user = getCurrentUser();
    const userRole = localStorage.getItem('userRole');
    
    if (!user || (userRole !== 'admin' && user.email !== ADMIN_EMAIL)) {
        alert('Admin access required');
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

// Load admin dashboard data
async function loadAdminData() {
    if (!checkAdminAccess()) return;
    
    try {
        // Load all users
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Load all workouts
        const workoutsSnapshot = await db.collection('workouts').get();
        const workouts = workoutsSnapshot.docs.map(doc => doc.data());
        
        // Load all goals
        const goalsSnapshot = await db.collection('goals').get();
        const goals = goalsSnapshot.docs.map(doc => doc.data());
        
        // Update stats
        document.getElementById('total-users').textContent = users.length;
        document.getElementById('total-workouts-admin').textContent = workouts.length;
        
        const activeGoals = goals.filter(g => g.status === 'active').length;
        document.getElementById('active-goals').textContent = activeGoals;
        
        const completedGoals = goals.filter(g => g.status === 'completed').length;
        const completionRate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        
        // Display users list
        displayUsersList(users);
        
        // Create charts
        createCategoryChart(workouts);
        createGrowthChart(users);
        
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

// Display users list
function displayUsersList(users) {
    const tbody = document.getElementById('users-list');
    if (!tbody) return;
    
    tbody.innerHTML = users.map(user => `
        <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-light); display: flex; align-items: center; justify-content: center; color: var(--primary-dark); font-weight: 600;">
                        ${user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <p style="font-weight: 600; margin-bottom: 2px;">${user.username || 'Unknown'}</p>
                        <p style="color: var(--text-light); font-size: 12px;">ID: ${user.id.slice(0, 8)}...</p>
                    </div>
                </div>
            </td>
            <td style="padding: 12px; color: var(--text-dark);">${user.email || 'No email'}</td>
            <td style="padding: 12px; color: var(--text-light);">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</td>
            <td style="padding: 12px;">
                <span style="padding: 4px 12px; background: ${user.disabled ? '#ffebee' : '#e8f5e9'}; color: ${user.disabled ? '#f44336' : '#4caf50'}; border-radius: 20px; font-size: 12px;">
                    ${user.disabled ? 'Disabled' : 'Active'}
                </span>
            </td>
            <td style="padding: 12px;">
                <button onclick="toggleUserStatus('${user.id}', ${!user.disabled})" 
                        style="padding: 6px 16px; background: ${user.disabled ? 'var(--primary-color)' : 'var(--danger-color)'}; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 12px;">
                    ${user.disabled ? 'Enable' : 'Disable'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Create category chart
function createCategoryChart(workouts) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const categories = ['strength', 'cardio', 'flexibility', 'hiit', 'yoga'];
    const counts = categories.map(cat => 
        workouts.filter(w => w.category === cat).length
    );
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Strength', 'Cardio', 'Flexibility', 'HIIT', 'Yoga'],
            datasets: [{
                data: counts,
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4CAF50',
                    '#9C27B0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Create growth chart
function createGrowthChart(users) {
    const ctx = document.getElementById('growthChart');
    if (!ctx) return;
    
    // Get last 6 months
    const months = [];
    const counts = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        months.push(monthName);
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const count = users.filter(u => {
            const createdDate = new Date(u.createdAt);
            return createdDate >= monthStart && createdDate <= monthEnd;
        }).length;
        
        counts.push(count);
    }
    
    if (growthChart) {
        growthChart.destroy();
    }
    
    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'New Users',
                data: counts,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
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
                    }
                }
            }
        }
    });
}

// Toggle user status
async function toggleUserStatus(userId, disable) {
    if (!confirm(`Are you sure you want to ${disable ? 'disable' : 'enable'} this user?`)) return;
    
    try {
        await db.collection('users').doc(userId).update({
            disabled: disable,
            disabledAt: disable ? new Date().toISOString() : null
        });
        
        loadAdminData();
        alert(`User ${disable ? 'disabled' : 'enabled'} successfully!`);
    } catch (error) {
        console.error('Error toggling user status:', error);
        alert('Failed to update user status');
    }
}

// Switch view
function switchView(view) {
    const buttons = document.querySelectorAll('.view-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (view === 'user') {
        window.location.href = 'dashboard.html';
    }
}

// Switch to user view
function switchToUserView() {
    window.location.href = 'dashboard.html';
}

// Save admin settings
function saveAdminSettings() {
    const maintenanceMode = document.getElementById('maintenance-mode')?.checked || false;
    const allowRegistrations = document.getElementById('allow-registrations')?.checked || true;
    const defaultFitness = document.getElementById('default-fitness')?.value || 'beginner';
    
    // Save to localStorage for demo
    localStorage.setItem('adminSettings', JSON.stringify({
        maintenanceMode,
        allowRegistrations,
        defaultFitness,
        updatedAt: new Date().toISOString()
    }));
    
    alert('Admin settings saved successfully!');
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin.html')) {
        loadAdminData();
    }
});