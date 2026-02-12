// ============================================
// PROFILE FUNCTIONALITY
// ============================================

// Load profile
async function loadProfile() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        // Handle admin
        if (user.uid === 'admin-uid') {
            document.getElementById('profile-name').textContent = 'Administrator';
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('profile-fitness-level').textContent = 'Admin';
            document.getElementById('stat-workouts').textContent = '∞';
            document.getElementById('stat-goals').textContent = '∞';
            document.getElementById('stat-streak').textContent = '∞';
            return;
        }
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const profile = userData.profile || {};
        
        // Update profile display
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileFitnessLevel = document.getElementById('profile-fitness-level');
        
        if (profileName) profileName.textContent = profile.name || user.displayName || 'User';
        if (profileEmail) profileEmail.textContent = user.email;
        if (profileFitnessLevel) {
            profileFitnessLevel.textContent = profile.fitnessLevel ? 
                profile.fitnessLevel.charAt(0).toUpperCase() + profile.fitnessLevel.slice(1) : 'Beginner';
        }
        
        // Fill form fields
        const fullName = document.getElementById('full-name');
        const age = document.getElementById('age');
        const gender = document.getElementById('gender');
        const height = document.getElementById('height');
        const weight = document.getElementById('weight');
        const fitnessLevel = document.getElementById('fitness-level');
        
        if (fullName) fullName.value = profile.name || '';
        if (age) age.value = profile.age || '';
        if (gender) gender.value = profile.gender || '';
        if (height) height.value = profile.height || '';
        if (weight) weight.value = profile.weight || '';
        if (fitnessLevel) fitnessLevel.value = profile.fitnessLevel || 'beginner';
        
        // Display profile info in view mode
        document.getElementById('profile-age').textContent = profile.age || 'Not set';
        document.getElementById('profile-gender').textContent = profile.gender || 'Not set';
        document.getElementById('profile-height').textContent = profile.height ? `${profile.height} cm` : 'Not set';
        document.getElementById('profile-weight').textContent = profile.weight ? `${profile.weight} kg` : 'Not set';
        
        // Load profile picture
        if (profile.profilePicture) {
            document.getElementById('profile-img').src = profile.profilePicture;
            document.getElementById('profile-img-preview').src = profile.profilePicture;
        }
        
        // Load stats
        loadProfileStats(user.uid);
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load profile stats
async function loadProfileStats(userId) {
    try {
        // Load workouts count
        const workoutsSnapshot = await db.collection('workouts')
            .where('userId', '==', userId)
            .get();
        
        document.getElementById('stat-workouts').textContent = workoutsSnapshot.size;
        
        // Load goals count
        const goalsSnapshot = await db.collection('goals')
            .where('userId', '==', userId)
            .get();
        
        document.getElementById('stat-goals').textContent = goalsSnapshot.size;
        
        // Calculate streak (simplified)
        const streak = calculateStreak(workoutsSnapshot.docs.map(doc => doc.data()));
        document.getElementById('stat-streak').textContent = streak;
        
    } catch (error) {
        console.error('Error loading profile stats:', error);
    }
}

// Calculate workout streak
function calculateStreak(workouts) {
    if (workouts.length === 0) return 0;
    
    const dates = workouts
        .map(w => new Date(w.date).toDateString())
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 1;
    let currentDate = new Date(dates[0]);
    
    for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i]);
        const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            streak++;
            currentDate = prevDate;
        } else {
            break;
        }
    }
    
    return streak;
}

// Toggle edit mode
function toggleEdit() {
    const viewMode = document.getElementById('profile-view');
    const editMode = document.getElementById('profile-edit');
    const editBtn = document.getElementById('edit-profile-btn');
    
    if (viewMode.style.display !== 'none') {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        editBtn.innerHTML = '<span>✖️</span> Cancel';
    } else {
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
        editBtn.innerHTML = '<span>✏️</span> Edit Profile';
    }
}

// Handle profile picture upload
function handleProfilePictureUpload() {
    const fileInput = document.getElementById('profile-picture');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-img').src = e.target.result;
            document.getElementById('profile-img-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Save profile
async function saveProfile() {
    const user = getCurrentUser();
    if (!user || user.uid === 'admin-uid') {
        alert('Admin profile cannot be edited');
        toggleEdit();
        return;
    }
    
    const profileData = {
        name: document.getElementById('full-name').value,
        age: document.getElementById('age').value ? parseInt(document.getElementById('age').value) : null,
        gender: document.getElementById('gender').value,
        height: document.getElementById('height').value ? parseFloat(document.getElementById('height').value) : null,
        weight: document.getElementById('weight').value ? parseFloat(document.getElementById('weight').value) : null,
        fitnessLevel: document.getElementById('fitness-level').value,
        updatedAt: new Date().toISOString()
    };
    
    try {
        await db.collection('users').doc(user.uid).update({
            profile: profileData
        });
        
        // Update display name
        if (profileData.name) {
            await user.updateProfile({
                displayName: profileData.name
            });
        }
        
        alert('Profile updated successfully!');
        toggleEdit();
        loadProfile();
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile');
    }
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});