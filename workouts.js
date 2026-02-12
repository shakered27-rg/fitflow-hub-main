// ============================================
// WORKOUTS FUNCTIONALITY
// ============================================

let currentWorkoutId = null;

// Load workouts
async function loadWorkouts() {
    const user = getCurrentUser();
    if (!user || user.uid === 'admin-uid') return;
    
    try {
        const workoutsSnapshot = await db.collection('workouts')
            .where('userId', '==', user.uid)
            .orderBy('date', 'desc')
            .get();
        
        const workouts = workoutsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayWorkouts(workouts);
    } catch (error) {
        console.error('Error loading workouts:', error);
    }
}

// Display workouts
function displayWorkouts(workouts) {
    const container = document.getElementById('workouts-list');
    if (!container) return;
    
    if (workouts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏋️</div>
                <h3>No Workouts Yet</h3>
                <p>Start your fitness journey by adding your first workout!</p>
                <button class="add-btn" onclick="openWorkoutModal()" style="margin-top: 16px;">
                    <span>➕</span> Add Workout
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = workouts.map(workout => `
        <div class="workout-card">
            <div class="workout-header">
                <h3>${workout.name}</h3>
                <span class="category-badge ${workout.category}">${workout.category}</span>
            </div>
            
            <div class="workout-details">
                <div class="detail-item">
                    <span class="label">📅 Date</span>
                    <span class="value">${new Date(workout.date).toLocaleDateString()}</span>
                </div>
                <div class="detail-item">
                    <span class="label">⏱️ Duration</span>
                    <span class="value">${workout.duration} min</span>
                </div>
                ${workout.sets ? `
                    <div class="detail-item">
                        <span class="label">🔄 Sets</span>
                        <span class="value">${workout.sets}</span>
                    </div>
                ` : ''}
                ${workout.reps ? `
                    <div class="detail-item">
                        <span class="label">🔁 Reps</span>
                        <span class="value">${workout.reps}</span>
                    </div>
                ` : ''}
                ${workout.weight ? `
                    <div class="detail-item">
                        <span class="label">🏋️ Weight</span>
                        <span class="value">${workout.weight} kg</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="workout-actions">
                <button class="edit-btn" onclick="editWorkout('${workout.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteWorkout('${workout.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Open workout modal
function openWorkoutModal() {
    currentWorkoutId = null;
    document.getElementById('modal-title').textContent = 'Add New Workout';
    document.getElementById('submit-workout').textContent = 'Add Workout';
    document.getElementById('workout-form').reset();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('workout-date').value = today;
    
    document.getElementById('workout-modal').classList.add('active');
}

// Close workout modal
function closeWorkoutModal() {
    document.getElementById('workout-modal').classList.remove('active');
    currentWorkoutId = null;
}

// Edit workout
async function editWorkout(workoutId) {
    try {
        const workoutDoc = await db.collection('workouts').doc(workoutId).get();
        const workout = workoutDoc.data();
        
        currentWorkoutId = workoutId;
        document.getElementById('modal-title').textContent = 'Edit Workout';
        document.getElementById('submit-workout').textContent = 'Update Workout';
        document.getElementById('workout-name').value = workout.name || '';
        document.getElementById('workout-category').value = workout.category || 'strength';
        document.getElementById('workout-duration').value = workout.duration || '';
        document.getElementById('workout-date').value = workout.date || '';
        document.getElementById('workout-sets').value = workout.sets || '';
        document.getElementById('workout-reps').value = workout.reps || '';
        document.getElementById('workout-weight').value = workout.weight || '';
        
        document.getElementById('workout-modal').classList.add('active');
    } catch (error) {
        console.error('Error loading workout:', error);
        alert('Failed to load workout');
    }
}

// Delete workout
async function deleteWorkout(workoutId) {
    if (!confirm('Are you sure you want to delete this workout?')) return;
    
    try {
        await db.collection('workouts').doc(workoutId).delete();
        loadWorkouts();
    } catch (error) {
        console.error('Error deleting workout:', error);
        alert('Failed to delete workout');
    }
}

// Filter workouts
async function filterWorkouts(category) {
    const filters = document.querySelectorAll('.category-filter');
    filters.forEach(filter => {
        filter.style.background = 'var(--bg-white)';
        filter.style.color = 'var(--text-dark)';
        filter.style.border = '2px solid var(--border-color)';
    });
    
    event.target.style.background = 'var(--primary-color)';
    event.target.style.color = 'white';
    event.target.style.border = 'none';
    
    const user = getCurrentUser();
    if (!user || user.uid === 'admin-uid') return;
    
    try {
        let query = db.collection('workouts')
            .where('userId', '==', user.uid);
        
        if (category !== 'all') {
            query = query.where('category', '==', category);
        }
        
        const snapshot = await query.orderBy('date', 'desc').get();
        const workouts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayWorkouts(workouts);
    } catch (error) {
        console.error('Error filtering workouts:', error);
    }
}

// Form submit handler
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('workout-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const user = getCurrentUser();
            if (!user || user.uid === 'admin-uid') return;
            
            const workoutData = {
                name: document.getElementById('workout-name').value,
                category: document.getElementById('workout-category').value,
                duration: parseInt(document.getElementById('workout-duration').value),
                date: document.getElementById('workout-date').value,
                sets: document.getElementById('workout-sets').value ? 
                    parseInt(document.getElementById('workout-sets').value) : null,
                reps: document.getElementById('workout-reps').value ? 
                    parseInt(document.getElementById('workout-reps').value) : null,
                weight: document.getElementById('workout-weight').value ? 
                    parseFloat(document.getElementById('workout-weight').value) : null,
                userId: user.uid,
                updatedAt: new Date().toISOString()
            };
            
            try {
                if (currentWorkoutId) {
                    await db.collection('workouts').doc(currentWorkoutId).update(workoutData);
                    alert('Workout updated successfully!');
                } else {
                    workoutData.createdAt = new Date().toISOString();
                    workoutData.completed = true;
                    await db.collection('workouts').add(workoutData);
                    alert('Workout added successfully!');
                }
                
                closeWorkoutModal();
                loadWorkouts();
            } catch (error) {
                console.error('Error saving workout:', error);
                alert('Failed to save workout');
            }
        });
    }
    
    // Load workouts on page load
    loadWorkouts();
});