requireAuth();
requireRole('candidate');

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearAuth();
  window.location.href = `${BASE_PATH}/login.html`;
});

const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
let currentJobId = null;

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

const experienceLabel = {
  entry: 'Entry Level',
  junior: 'Junior',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead'
};

const loadJobs = async () => {
  try {
    const location = document.getElementById('filterLocation').value;
    const job_type = document.getElementById('filterJobType').value;
    const work_mode = document.getElementById('filterWorkMode').value;
    const experience_level = document.getElementById('filterExperience').value;

    let query = '/jobs?';
    if (location) query += `location=${location}&`;
    if (job_type) query += `job_type=${job_type}&`;
    if (work_mode) query += `work_mode=${work_mode}&`;
    if (experience_level) query += `experience_level=${experience_level}&`;

    const data = await apiRequest(query, 'GET', null, false);
    const jobs = data.jobs || [];
    const container = document.getElementById('jobsList');

    if (jobs.length === 0) {
      container.innerHTML = `
        <div class="card shadow-sm">
          <div class="card-body text-center py-5 text-muted">
            <i class="bi bi-search" style="font-size: 2.5rem;"></i>
            <p class="mt-3">No jobs found. Try different filters.</p>
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
                <span class="badge bg-light text-dark border">
                  <i class="bi bi-bar-chart me-1"></i>${experienceLabel[job.experience_level] || job.experience_level}
                </span>
              </div>
              ${job.salary_min ? `<p class="text-muted small mb-0">
                <i class="bi bi-cash me-1"></i>
                PKR ${job.salary_min.toLocaleString()} — ${job.salary_max ? job.salary_max.toLocaleString() : 'Negotiable'}
              </p>` : ''}
            </div>
            <button class="btn btn-primary btn-sm" onclick="viewJob('${job.id}')">
              View Job
            </button>
          </div>
        </div>
      </div>`).join('');

  } catch (err) {
    showError(err.message);
  }
};

window.viewJob = async (jobId) => {
  try {
    const data = await apiRequest(`/jobs/${jobId}`, 'GET', null, false);
    const job = data.job;
    currentJobId = jobId;

    document.getElementById('modalTitle').textContent = job.title;
    document.getElementById('modalBody').innerHTML = `
      <div class="mb-3">
        <h6 class="fw-bold text-primary">${job.company_name}</h6>
        <div class="d-flex flex-wrap gap-2 mb-3">
          <span class="badge bg-light text-dark border"><i class="bi bi-geo-alt me-1"></i>${job.location}</span>
          <span class="badge bg-light text-dark border"><i class="bi bi-briefcase me-1"></i>${jobTypeLabel[job.job_type] || job.job_type}</span>
          <span class="badge bg-light text-dark border"><i class="bi bi-laptop me-1"></i>${workModeLabel[job.work_mode] || job.work_mode}</span>
          <span class="badge bg-light text-dark border"><i class="bi bi-bar-chart me-1"></i>${experienceLabel[job.experience_level] || job.experience_level}</span>
        </div>
        ${job.salary_min ? `<p class="text-muted"><i class="bi bi-cash me-2"></i>PKR ${job.salary_min.toLocaleString()} — ${job.salary_max ? job.salary_max.toLocaleString() : 'Negotiable'}</p>` : ''}
      </div>
      <hr/>
      <h6 class="fw-bold">Job Description</h6>
      <p class="text-muted">${job.description}</p>
      ${job.benefits ? `<h6 class="fw-bold">Benefits</h6><p class="text-muted">${job.benefits}</p>` : ''}
      ${job.about ? `<hr/><h6 class="fw-bold">About ${job.company_name}</h6><p class="text-muted">${job.about}</p>` : ''}
    `;

    new bootstrap.Modal(document.getElementById('jobModal')).show();
  } catch (err) {
    showError(err.message);
  }
};

document.getElementById('saveJobBtn').addEventListener('click', async () => {
  if (!currentJobId) return;
  try {
    await apiRequest(`/saved-jobs/${currentJobId}`, 'POST');
    showSuccess('Job saved successfully!');
  } catch (err) {
    showError(err.message);
  }
});

document.getElementById('applyJobBtn').addEventListener('click', async () => {
  if (!currentJobId) return;
  try {
    await apiRequest(`/applications/${currentJobId}`, 'POST', {});
    showSuccess('Application submitted successfully!');
    bootstrap.Modal.getInstance(document.getElementById('jobModal')).hide();
  } catch (err) {
    showError(err.message);
  }
});

document.getElementById('searchBtn').addEventListener('click', loadJobs);

document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('filterLocation').value = '';
  document.getElementById('filterJobType').value = '';
  document.getElementById('filterWorkMode').value = '';
  document.getElementById('filterExperience').value = '';
  loadJobs();
});

loadJobs();