requireAuth();
requireRole('candidate');

const user = getUser();
document.getElementById('userName').textContent = user.email.split('@')[0];

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearAuth();
 window.location.href = `${BASE_PATH}/login.html`;
});

const loadDashboard = async () => {
  try {
    const [applicationsData, savedData, notificationsData] = await Promise.all([
      apiRequest('/applications/my'),
      apiRequest('/saved-jobs'),
      apiRequest('/notifications')
    ]);

    const applications = applicationsData.applications || [];
    const savedJobs = savedData.saved_jobs || [];
    const notifications = notificationsData.notifications || [];

    document.getElementById('totalApplications').textContent = applications.length;
    document.getElementById('totalSaved').textContent = savedJobs.length;
    document.getElementById('totalNotifications').textContent = notifications.length;

    const unread = notifications.filter(n => !n.is_read).length;
    document.getElementById('unreadCount').textContent = unread;

    const recentApps = applications.slice(0, 5);
    const appContainer = document.getElementById('recentApplications');

    if (recentApps.length === 0) {
      appContainer.innerHTML = `
        <div class="text-center text-muted py-5">
          <i class="bi bi-inbox" style="font-size: 2rem;"></i>
          <p class="mt-2">No applications yet</p>
          <a href="jobs.html" class="btn btn-primary btn-sm">Browse Jobs</a>
        </div>`;
    } else {
      appContainer.innerHTML = recentApps.map(app => `
        <div class="d-flex align-items-center justify-content-between p-3 border-bottom">
          <div>
            <div class="fw-semibold">${app.title}</div>
            <div class="text-muted small">${app.company_name} • ${app.location}</div>
          </div>
          <span class="badge badge-${app.status}">${app.status.replace('_', ' ')}</span>
        </div>`).join('');
    }

    const notifContainer = document.getElementById('recentNotifications');
    const recentNotifs = notifications.slice(0, 5);

    if (recentNotifs.length === 0) {
      notifContainer.innerHTML = `
        <div class="text-center text-muted py-4">
          <i class="bi bi-bell-slash" style="font-size: 2rem;"></i>
          <p class="mt-2">No notifications</p>
        </div>`;
    } else {
      notifContainer.innerHTML = recentNotifs.map(n => `
        <div class="notification-item ${n.is_read ? 'read' : ''}">
          <div class="fw-semibold small">${n.title}</div>
          <div class="text-muted small">${n.message}</div>
        </div>`).join('');
    }

  } catch (err) {
    console.error(err);
  }
};

loadDashboard();