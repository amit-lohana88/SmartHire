requireAuth();
requireRole('candidate');

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearAuth();
  window.location.href = `${BASE_PATH}/login.html`;
});

const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
const educationForm = document.getElementById('educationForm');
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
  document.getElementById('institution').value = '';
  document.getElementById('degree').value = '';
  document.getElementById('field_of_study').value = '';
  document.getElementById('cgpa').value = '';
  document.getElementById('start_year').value = '';
  document.getElementById('end_year').value = '';
  document.getElementById('formTitle').textContent = 'Add Education';
  document.getElementById('submitBtn').innerHTML = '<i class="bi bi-save me-2"></i>Save';
  editingId = null;
};

const showForm = () => {
  educationForm.classList.remove('d-none');
  educationForm.scrollIntoView({ behavior: 'smooth' });
};

const hideForm = () => {
  educationForm.classList.add('d-none');
  resetForm();
  errorDiv.classList.add('d-none');
  successDiv.classList.add('d-none');
};

document.getElementById('showFormBtn').addEventListener('click', () => {
  resetForm();
  showForm();
});

document.getElementById('cancelBtn').addEventListener('click', hideForm);

const loadEducation = async () => {
  try {
    const data = await apiRequest('/candidate/profile');
    const education = data.profile.education || [];
    const container = document.getElementById('educationList');

    if (education.length === 0) {
      container.innerHTML = `
        <div class="card shadow-sm">
          <div class="card-body text-center py-5 text-muted">
            <i class="bi bi-mortarboard" style="font-size: 2.5rem;"></i>
            <p class="mt-3">No education added yet. Click Add Education to get started.</p>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = education.map(edu => `
      <div class="card shadow-sm mb-3">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="fw-bold mb-1">${edu.degree} in ${edu.field_of_study}</h5>
              <p class="text-primary fw-semibold mb-1">${edu.institution}</p>
              <p class="text-muted small mb-1">
                ${edu.start_year} — ${edu.end_year || 'Present'}
                ${edu.cgpa ? `&nbsp;|&nbsp; CGPA: ${edu.cgpa}` : ''}
              </p>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary" onclick="editEducation('${edu.id}')">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteEducation('${edu.id}')">
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
    institution: document.getElementById('institution').value,
    degree: document.getElementById('degree').value,
    field_of_study: document.getElementById('field_of_study').value,
    cgpa: document.getElementById('cgpa').value || null,
    start_year: document.getElementById('start_year').value,
    end_year: document.getElementById('end_year').value || null
  };

  if (!body.institution || !body.degree || !body.field_of_study || !body.start_year) {
    return showError('Institution, degree, field of study and start year are required');
  }

  try {
    if (editingId) {
      await apiRequest(`/candidate/education/${editingId}`, 'PUT', body);
      showSuccess('Education updated successfully!');
    } else {
      await apiRequest('/candidate/education', 'POST', body);
      showSuccess('Education added successfully!');
    }
    hideForm();
    loadEducation();
  } catch (err) {
    showError(err.message);
  }
});

window.editEducation = async (id) => {
  try {
    const data = await apiRequest('/candidate/profile');
    const edu = data.profile.education.find(e => e.id === id);
    if (!edu) return;

    document.getElementById('institution').value = edu.institution || '';
    document.getElementById('degree').value = edu.degree || '';
    document.getElementById('field_of_study').value = edu.field_of_study || '';
    document.getElementById('cgpa').value = edu.cgpa || '';
    document.getElementById('start_year').value = edu.start_year || '';
    document.getElementById('end_year').value = edu.end_year || '';

    document.getElementById('formTitle').textContent = 'Edit Education';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-save me-2"></i>Update';
    editingId = id;
    showForm();
  } catch (err) {
    showError(err.message);
  }
};

window.deleteEducation = async (id) => {
  if (!confirm('Are you sure you want to delete this education?')) return;
  try {
    await apiRequest(`/candidate/education/${id}`, 'DELETE');
    showSuccess('Education deleted successfully!');
    loadEducation();
  } catch (err) {
    showError(err.message);
  }
};

loadEducation();