requireAuth();
requireRole('candidate');

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearAuth();
  window.location.href = `${BASE_PATH}/login.html`;
});

const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');

const showError = (msg) => {
  errorDiv.textContent = msg;
  errorDiv.classList.remove('d-none');
  successDiv.classList.add('d-none');
};

const showSuccess = (msg) => {
  successDiv.textContent = msg;
  successDiv.classList.remove('d-none');
  errorDiv.classList.add('d-none');
};

const jobTypeLabel = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  internship: 'Internship',
  contract: 'Contract'
};

const workModeLabel = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'Onsite'
};

const loadSavedJobs = async () => {
  try {
    const data = await apiRequest('/saved-jobs');
    const jobs = data.saved_jobs || [];
    const container = document.getElementById('savedJobsList');

    if (jobs.length === 0) {
      container.innerHTML = `
        <div class="card shadow-sm">
          <div class="card-body text-center py-5 text-muted">
            <i class="bi bi-bookmark-heart" style="font-size: 2.5rem;"></i>
            <p class="mt-3">No saved jobs yet.</p>
            <a href="jobs.html" class="btn btn-primary btn-sm">Browse Jobs</a>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = jobs.map(job => `
      <div class="card job-card shadow-sm mb-3">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="fw-bold mb-1">${job.title}</h5>
              <p class="text-primary fw-semibold mb-2">${job.company_name}</p>
              <div class="d-flex flex-wrap gap-2 mb-2">
                <span class="badge bg-light text-dark border">
                  <i class="bi bi-geo-alt me-1"></i>${job.location}
                </span>
                <span class="badge bg-light text-dark border">
                  <i class="bi bi-briefcase me-1"></i>${jobTypeLabel[job.job_type] || job.job_type}
                </span>
                <span class="badge bg-light text-dark border">
                  <i class="bi bi-laptop me-1"></i>${workModeLabel[job.work_mode] || job.work_mode}
                </span>
              </div>
              <p class="text-muted small mb-0">
                <i class="bi bi-bookmark me-1"></i>
                Saved on ${new Date(job.saved_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div class="d-flex flex-column gap-2">
              <button class="btn btn-primary btn-sm" onclick="applyJob('${job.id}')">
                <i class="bi bi-send me-1"></i>Apply
              </button>
              <button class="btn btn-outline-danger btn-sm" onclick="unsaveJob('${job.id}')">
                <i class="bi bi-bookmark-x me-1"></i>Remove
              </button>
            </div>
          </div>
        </div>
      </div>`).join('');

  } catch (err) {
    showError(err.message);
  }
};

window.applyJob = async (jobId) => {
  if (!confirm('Apply to this job?')) return;
  try {
    await apiRequest(`/applications/${jobId}`, 'POST', {});
    showSuccess('Application submitted successfully!');
  } catch (err) {
    showError(err.message);
  }
};

window.unsaveJob = async (jobId) => {
  if (!confirm('Remove this job from saved list?')) return;
  try {
    await apiRequest(`/saved-jobs/${jobId}`, 'DELETE');
    showSuccess('Job removed from saved list!');
    loadSavedJobs();
  } catch (err) {
    showError(err.message);
  }
};

loadSavedJobs();