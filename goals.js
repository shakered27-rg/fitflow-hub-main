// ============================================
// GOALS FUNCTIONALITY
// ============================================

let currentGoalId = null;

// Load goals
async function loadGoals() {
    const user = getCurrentUser();
    if (!user || user.uid === 'admin-uid') return;
    
    try {
        const goalsSnapshot = await db.collection('goals')
            .where('userId', '==', user.uid)
            .orderBy('deadline', 'asc')
            .get();
        
        const goals = goalsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayGoals(goals);
    } catch (error) {
        console.error('Error loading goals:', error);
    }
}

// Display goals
function displayGoals(goals) {
    const container = document.getElementById('goals-grid');
    if (!container) return;
    
    if (goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <h3>No Goals Yet</h3>
                <p>Set your first fitness goal to track your progress!</p>
                <button class="add-btn" onclick="openGoalModal()" style="margin-top: 16px;">
                    <span>➕</span> Create Goal
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = goals.map(goal => `
        <div class="goal-card ${goal.status}">
            <div class="goal-header">
                <h3>${goal.title}</h3>
                <span class="status-badge ${goal.status}">${goal.status}</span>
            </div>
            
            <p class="goal-description" style="color: var(--text-light); margin-bottom: 16px;">
                ${goal.description || 'No description'}
            </p>
            
            <div class="goal-progress">
                <div class="progress-header">
                    <span>Progress</span>
                    <span style="font-weight: 600; color: var(--primary-color);">${goal.progress || 0}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${goal.progress || 0}%"></div>
                </div>
            </div>
            
            <div class="goal-details" style="margin-top: 16px;">
                <div class="detail">
                    <span class="label">🎯 Target:</span>
                    <span class="value">${goal.targetValue} ${goal.targetUnit}</span>
                </div>
                <div class="detail">
                    <span class="label">📅 Deadline:</span>
                    <span class="value">${new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
            </div>
            
            <div class="goal-actions" style="margin-top: 20px;">
                ${goal.status !== 'completed' ? `
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <input type="range" min="0" max="100" value="${goal.progress || 0}" 
                               onchange="updateGoalProgress('${goal.id}', this.value)"
                               style="flex: 1; height: 6px; -webkit-appearance: none; background: var(--border-color); border-radius: 3px;">
                        <span style="font-weight: 600; color: var(--primary-color); min-width: 45px;">${goal.progress || 0}%</span>
                    </div>
                ` : ''}
                <div style="display: flex; gap: 10px;">
                    <button class="edit-btn" onclick="editGoal('${goal.id}')" style="flex: 1;">Edit</button>
                    <button class="delete-btn" onclick="deleteGoal('${goal.id}')" style="flex: 1;">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Open goal modal
function openGoalModal() {
    currentGoalId = null;
    document.getElementById('goal-modal-title').textContent = 'Create New Goal';
    document.getElementById('submit-goal').textContent = 'Create Goal';
    document.getElementById('goal-form').reset();
    
    // Set default deadline to 30 days from now
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    document.getElementById('goal-deadline').value = thirtyDaysLater.toISOString().split('T')[0];
    
    document.getElementById('goal-modal').classList.add('active');
}

// Close goal modal
function closeGoalModal() {
    document.getElementById('goal-modal').classList.remove('active');
    currentGoalId = null;
}

// Edit goal
async function editGoal(goalId) {
    try {
        const goalDoc = await db.collection('goals').doc(goalId).get();
        const goal = goalDoc.data();
        
        currentGoalId = goalId;
        document.getElementById('goal-modal-title').textContent = 'Edit Goal';
        document.getElementById('submit-goal').textContent = 'Update Goal';
        document.getElementById('goal-title').value = goal.title || '';
        document.getElementById('goal-description').value = goal.description || '';
        document.getElementById('goal-target').value = goal.targetValue || '';
        document.getElementById('goal-unit').value = goal.targetUnit || 'workouts';
        document.getElementById('goal-deadline').value = goal.deadline || '';
        
        document.getElementById('goal-modal').classList.add('active');
    } catch (error) {
        console.error('Error loading goal:', error);
        alert('Failed to load goal');
    }
}

// Delete goal
async function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
        await db.collection('goals').doc(goalId).delete();
        loadGoals();
    } catch (error) {
        console.error('Error deleting goal:', error);
        alert('Failed to delete goal');
    }
}

// Update goal progress
async function updateGoalProgress(goalId, progress) {
    try {
        await db.collection('goals').doc(goalId).update({
            progress: parseInt(progress),
            status: parseInt(progress) >= 100 ? 'completed' : 'active',
            completedAt: parseInt(progress) >= 100 ? new Date().toISOString() : null
        });
        loadGoals();
    } catch (error) {
        console.error('Error updating progress:', error);
    }
}

// Form submit handler
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('goal-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const user = getCurrentUser();
            if (!user || user.uid === 'admin-uid') return;
            
            const goalData = {
                title: document.getElementById('goal-title').value,
                description: document.getElementById('goal-description').value,
                targetValue: parseInt(document.getElementById('goal-target').value),
                targetUnit: document.getElementById('goal-unit').value,
                deadline: document.getElementById('goal-deadline').value,
                status: 'active',
                progress: 0,
                userId: user.uid,
                updatedAt: new Date().toISOString()
            };
            
            try {
                if (currentGoalId) {
                    await db.collection('goals').doc(currentGoalId).update(goalData);
                    alert('Goal updated successfully!');
                } else {
                    goalData.createdAt = new Date().toISOString();
                    await db.collection('goals').add(goalData);
                    alert('Goal created successfully!');
                }
                
                closeGoalModal();
                loadGoals();
            } catch (error) {
                console.error('Error saving goal:', error);
                alert('Failed to save goal');
            }
        });
    }
    
    // Load goals on page load
    loadGoals();
});