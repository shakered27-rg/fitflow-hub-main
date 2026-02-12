// ============================================
// NOTIFICATIONS FUNCTIONALITY
// ============================================

// Load notifications
async function loadNotifications() {
    const user = getCurrentUser();
    if (!user || user.uid === 'admin-uid') {
        // Load admin notifications
        displayNotifications([
            {
                id: '1',
                icon: '👋',
                title: 'Welcome Admin!',
                message: 'You are logged in as administrator.',
                createdAt: new Date().toISOString(),
                read: false
            }
        ]);
        return;
    }
    
    try {
        const notificationsSnapshot = await db.collection('notifications')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        const notifications = notificationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // If no notifications, create sample ones
        if (notifications.length === 0) {
            createSampleNotifications(user.uid);
        }
        
        displayNotifications(notifications);
        
        // Load user settings
        loadNotificationSettings();
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Create sample notifications
async function createSampleNotifications(userId) {
    const samples = [
        {
            userId: userId,
            icon: '🎯',
            title: 'Welcome to FitnessTracker!',
            message: 'Start by setting your first fitness goal.',
            createdAt: new Date().toISOString(),
            read: false
        },
        {
            userId: userId,
            icon: '🏋️',
            title: 'Complete Your Profile',
            message: 'Add your fitness level and personal info.',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            read: false
        },
        {
            userId: userId,
            icon: '🔥',
            title: 'Workout Reminder',
            message: 'You haven\'t logged a workout today. Stay active!',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            read: true
        }
    ];
    
    try {
        const batch = db.batch();
        samples.forEach(sample => {
            const docRef = db.collection('notifications').doc();
            batch.set(docRef, sample);
        });
        await batch.commit();
        loadNotifications();
    } catch (error) {
        console.error('Error creating sample notifications:', error);
    }
}

// Display notifications
function displayNotifications(notifications) {
    const container = document.getElementById('notifications-list');
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <h3>No Notifications</h3>
                <p>You're all caught up!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notification => `
        <div class="notification-card ${notification.read ? 'read' : 'unread'}" 
             onclick="markNotificationRead('${notification.id}')">
            <div class="notification-icon">${notification.icon || '🔔'}</div>
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <span class="notification-time">${timeAgo(notification.createdAt)}</span>
            </div>
            ${!notification.read ? '<span class="unread-dot"></span>' : ''}
        </div>
    `).join('');
}

// Load notification settings
async function loadNotificationSettings() {
    const user = getCurrentUser();
    if (!user || user.uid === 'admin-uid') return;
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const settings = userDoc.data()?.settings || {
            notifications: true,
            reminderSchedule: 'daily',
            workoutReminders: true,
            goalReminders: true
        };
        
        const notificationsEnabled = document.getElementById('notifications-enabled');
        const reminderSchedule = document.getElementById('reminder-schedule');
        const workoutReminders = document.getElementById('workout-reminders');
        const goalReminders = document.getElementById('goal-reminders');
        
        if (notificationsEnabled) notificationsEnabled.checked = settings.notifications;
        if (reminderSchedule) reminderSchedule.value = settings.reminderSchedule || 'daily';
        if (workoutReminders) workoutReminders.checked = settings.workoutReminders !== false;
        if (goalReminders) goalReminders.checked = settings.goalReminders !== false;
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save notification settings
async function saveNotificationSettings() {
    const user = getCurrentUser();
    if (!user || user.uid === 'admin-uid') {
        alert('Admin settings saved!');
        return;
    }
    
    const settings = {
        notifications: document.getElementById('notifications-enabled')?.checked || false,
        reminderSchedule: document.getElementById('reminder-schedule')?.value || 'daily',
        workoutReminders: document.getElementById('workout-reminders')?.checked || false,
        goalReminders: document.getElementById('goal-reminders')?.checked || false,
        updatedAt: new Date().toISOString()
    };
    
    try {
        await db.collection('users').doc(user.uid).update({
            settings: settings
        });
        
        alert('Settings saved successfully!');
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings');
    }
}

// Mark notification as read
async function markNotificationRead(notificationId) {
    const user = getCurrentUser();
    if (!user || user.uid === 'admin-uid') {
        loadNotifications();
        return;
    }
    
    try {
        await db.collection('notifications').doc(notificationId).update({
            read: true
        });
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark all notifications as read
async function markAllAsRead() {
    const user = getCurrentUser();
    if (!user || user.uid === 'admin-uid') {
        loadNotifications();
        return;
    }
    
    try {
        const notificationsSnapshot = await db.collection('notifications')
            .where('userId', '==', user.uid)
            .where('read', '==', false)
            .get();
        
        const batch = db.batch();
        notificationsSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        
        await batch.commit();
        loadNotifications();
        alert('All notifications marked as read!');
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

// Time ago helper
function timeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
}

// Initialize notifications page
document.addEventListener('DOMContentLoaded', () => {
    loadNotifications();
    
    const saveBtn = document.getElementById('save-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveNotificationSettings);
    }
    
    const markAllBtn = document.getElementById('mark-all-read');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', markAllAsRead);
    }
});