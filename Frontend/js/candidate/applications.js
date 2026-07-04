requireAuth();
requireRole('candidate');

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearAuth();
  window.location.href = `${BASE_PATH}/login.html`;
});

const errorDiv = document.getElementById('error');
let allApplications = [];
let currentFilter = '';

const showError = (msg) => {
  errorDiv.textContent = msg;
  errorDiv.classList.remove('d-none');
};

const statusBadge = {
  applied: 'primary',
  reviewing: 'purple',
  shortlisted: 'success',
  interview_scheduled: 'warning',
  rejected: 'danger',
  hired: 'teal'
};

const statusLabel = {
  applied: 'Applied',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  rejected: 'Rejected',
  hired: 'Hired'
};

const jobTypeLabel = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  internship: 'Internship',
  contract: 'Contract'
};

const renderApplications = () => {
  const container = document.getElementById('applicationsList');
  const filtered = currentFilter
    ? allApplications.filter(a => a.status === currentFilter)
    : allApplications;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-body text-center py-5 text-muted">
          <i class="bi bi-file-earmark-text" style="font-size: 2.5rem;"></i>
          <p class="mt-3">No applications found.</p>
          <a href="jobs.html" class="btn btn-primary btn-sm">Browse Jobs</a>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(app => `
    <div class="card shadow-sm mb-3">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="fw-bold mb-1">${app.title}</h5>
            <p class="text-primary fw-semibold mb-2">${app.company_name}</p>
            <div class="d-flex flex-wrap gap-2 mb-2">
              <span class="badge bg-light text-dark border">
                <i class="bi bi-geo-alt me-1"></i>${app.location}
              </span>
              <span class="badge bg-light text-dark border">
                <i class="bi bi-briefcase me-1"></i>${jobTypeLabel[app.job_type] || app.job_type}
              </span>
            </div>
            <p class="text-muted small mb-0">
              <i class="bi bi-calendar me-1"></i>
              Applied on ${new Date(app.applied_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div class="text-end">
            <span class="badge badge-${app.status} fs-6 px-3 py-2">
              ${statusLabel[app.status] || app.status}
            </span>
          </div>
        </div>
      </div>
    </div>`).join('');
};

const loadApplications = async () => {
  try {
    const data = await apiRequest('/applications/my');
    allApplications = data.applications || [];
    renderApplications();
  } catch (err) {
    showError(err.message);
  }
};

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.remove('btn-primary');
      b.classList.add('btn-outline-primary');
    });
    btn.classList.remove('btn-outline-primary');
    btn.classList.add('btn-primary');
    currentFilter = btn.dataset.status;
    renderApplications();
  });
});

loadApplications();