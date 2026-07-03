requireAuth();
requireRole('candidate');

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearAuth();
  window.location.href = `${BASE_PATH}/login.html`;
});

const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
const experienceForm = document.getElementById('experienceForm');
let editingId = null;

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

const resetForm = () => {
  document.getElementById('job_title').value = '';
  document.getElementById('company_name').value = '';
  document.getElementById('employment_type').value = '';
  document.getElementById('start_date').value = '';
  document.getElementById('end_date').value = '';
  document.getElementById('is_current').checked = false;
  document.getElementById('description').value = '';
  document.getElementById('formTitle').textContent = 'Add Experience';
  document.getElementById('submitBtn').innerHTML = '<i class="bi bi-save me-2"></i>Save';
  editingId = null;
};

const showForm = () => {
  experienceForm.classList.remove('d-none');
  experienceForm.scrollIntoView({ behavior: 'smooth' });
};

const hideForm = () => {
  experienceForm.classList.add('d-none');
  resetForm();
  errorDiv.classList.add('d-none');
  successDiv.classList.add('d-none');
};

document.getElementById('showFormBtn').addEventListener('click', () => {
  resetForm();
  showForm();
});

document.getElementById('cancelBtn').addEventListener('click', hideForm);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
};

const employmentLabel = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  internship: 'Internship',
  contract: 'Contract'
};

const loadExperiences = async () => {
  try {
    const data = await apiRequest('/candidate/profile');
    const experiences = data.profile.experiences || [];
    const container = document.getElementById('experienceList');

    if (experiences.length === 0) {
      container.innerHTML = `
        <div class="card shadow-sm">
          <div class="card-body text-center py-5 text-muted">
            <i class="bi bi-briefcase" style="font-size: 2.5rem;"></i>
            <p class="mt-3">No experience added yet. Click Add Experience to get started.</p>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = experiences.map(exp => `
      <div class="card shadow-sm mb-3">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="fw-bold mb-1">${exp.job_title}</h5>
              <p class="text-primary fw-semibold mb-1">${exp.company_name}</p>
              <p class="text-muted small mb-1">
                ${employmentLabel[exp.employment_type] || ''}
                ${exp.employment_type ? '•' : ''}
                ${formatDate(exp.start_date)} — ${exp.is_current ? 'Present' : formatDate(exp.end_date)}
              </p>
              ${exp.description ? `<p class="text-muted mt-2 mb-0">${exp.description}</p>` : ''}
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary" onclick="editExperience('${exp.id}')">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteExperience('${exp.id}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`).join('');

  } catch (err) {
    showError(err.message);
  }
};

document.getElementById('submitBtn').addEventListener('click', async () => {
  const body = {
    job_title: document.getElementById('job_title').value,
    company_name: document.getElementById('company_name').value,
    employment_type: document.getElementById('employment_type').value,
    start_date: document.getElementById('start_date').value,
    end_date: document.getElementById('end_date').value || null,
    is_current: document.getElementById('is_current').checked,
    description: document.getElementById('description').value
  };

  if (!body.job_title || !body.company_name || !body.start_date) {
    return showError('Job title, company name and start date are required');
  }

  try {
    if (editingId) {
      await apiRequest(`/candidate/experience/${editingId}`, 'PUT', body);
      showSuccess('Experience updated successfully!');
    } else {
      await apiRequest('/candidate/experience', 'POST', body);
      showSuccess('Experience added successfully!');
    }
    hideForm();
    loadExperiences();
  } catch (err) {
    showError(err.message);
  }
});

window.editExperience = async (id) => {
  try {
    const data = await apiRequest('/candidate/profile');
    const exp = data.profile.experiences.find(e => e.id === id);
    if (!exp) return;

    document.getElementById('job_title').value = exp.job_title || '';
    document.getElementById('company_name').value = exp.company_name || '';
    document.getElementById('employment_type').value = exp.employment_type || '';
    document.getElementById('start_date').value = exp.start_date ? exp.start_date.split('T')[0] : '';
    document.getElementById('end_date').value = exp.end_date ? exp.end_date.split('T')[0] : '';
    document.getElementById('is_current').checked = exp.is_current || false;
    document.getElementById('description').value = exp.description || '';

    document.getElementById('formTitle').textContent = 'Edit Experience';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-save me-2"></i>Update';
    editingId = id;
    showForm();
  } catch (err) {
    showError(err.message);
  }
};

window.deleteExperience = async (id) => {
  if (!confirm('Are you sure you want to delete this experience?')) return;
  try {
    await apiRequest(`/candidate/experience/${id}`, 'DELETE');
    showSuccess('Experience deleted successfully!');
    loadExperiences();
  } catch (err) {
    showError(err.message);
  }
};

loadExperiences();