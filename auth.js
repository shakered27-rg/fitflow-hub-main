// ============================================
// AUTHENTICATION SYSTEM
// ============================================

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User logged in:', user.email);
        
        // Redirect to dashboard if on index page
        if (window.location.pathname.includes('index.html') || 
            window.location.pathname === '/' || 
            window.location.pathname === '') {
            window.location.href = 'dashboard.html';
        }
        
        // Check if admin
        if (isAdmin(user.email)) {
            localStorage.setItem('userRole', 'admin');
            const adminSection = document.getElementById('admin-section');
            if (adminSection) adminSection.style.display = 'block';
        } else {
            localStorage.setItem('userRole', 'user');
        }
        
        // Update user name display
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.displayName || user.email;
        }
    } else {
        // User is signed out
        console.log('No user logged in');
        
        // Redirect to login if not on index page
        if (!window.location.pathname.includes('index.html') && 
            window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
});

// Show login/register tabs
function showTab(tabName) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    if (tabName === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabBtns[0].classList.add('active');
        tabBtns[1].classList.remove('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        tabBtns[1].classList.add('active');
        tabBtns[0].classList.remove('active');
    }
}

// Handle Login
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // Check for admin login
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            const adminUser = {
                email: ADMIN_EMAIL,
                uid: 'admin-' + Date.now(),
                displayName: 'Admin'
            };
            
            // Create custom admin session
            localStorage.setItem('adminSession', 'true');
            localStorage.setItem('adminUser', JSON.stringify(adminUser));
            
            // Manually set current user
            Object.defineProperty(auth, 'currentUser', {
                get: () => adminUser
            });
            
            window.location.href = 'dashboard.html';
            return;
        }
        
        // Regular user login
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

// Handle Register
async function handleRegister() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    if (!username || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update profile
        await userCredential.user.updateProfile({
            displayName: username
        });
        
        // Create user document in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            username: username,
            email: email,
            role: 'user',
            createdAt: new Date().toISOString(),
            profile: {
                name: username,
                age: null,
                gender: null,
                height: null,
                weight: null,
                fitnessLevel: 'beginner',
                profilePicture: null
            },
            settings: {
                notifications: true,
                reminderSchedule: 'daily'
            }
        });
        
        alert('Registration successful! Please login.');
        showTab('login');
        
        // Clear form
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-password').value = '';
        document.getElementById('reg-confirm-password').value = '';
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    }
}

// Handle Logout
async function handleLogout() {
    try {
        // Clear admin session if exists
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('userRole');
        
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
}

// Get current user helper
function getCurrentUser() {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
        return JSON.parse(adminUser);
    }
    return auth.currentUser;
}

// Set current date
function setCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

// Call on dashboard load
if (window.location.pathname.includes('dashboard.html')) {
    setCurrentDate();
}
