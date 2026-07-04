requireAuth();
requireRole('candidate');

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearAuth();
  window.location.href = `${BASE_PATH}/login.html`;
});

const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
let allSkills = [];

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

const proficiencyColors = {
  beginner: 'secondary',
  intermediate: 'primary',
  advanced: 'success',
  expert: 'warning'
};

const loadMySkills = async () => {
  try {
    const data = await apiRequest('/skills/candidate');
    const skills = data.skills || [];
    const container = document.getElementById('mySkillsList');

    if (skills.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted py-4">
          <i class="bi bi-stars" style="font-size: 2.5rem;"></i>
          <p class="mt-3">No skills added yet.</p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="row g-3">
        ${skills.map(skill => `
          <div class="col-md-6">
            <div class="d-flex justify-content-between align-items-center p-3 border rounded">
              <div>
                <div class="fw-semibold">${skill.name}</div>
                <span class="badge bg-${proficiencyColors[skill.proficiency_level] || 'secondary'}">
                  ${skill.proficiency_level}
                </span>
                ${skill.category ? `<span class="text-muted small ms-2">${skill.category}</span>` : ''}
              </div>
              <button class="btn btn-sm btn-outline-danger" onclick="removeSkill('${skill.id}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>`).join('')}
      </div>`;
  } catch (err) {
    showError(err.message);
  }
};

const loadAllSkills = async () => {
  try {
    const data = await apiRequest('/skills', 'GET', null, false);
    allSkills = data.skills || [];
  } catch (err) {
    console.error(err);
  }
};

document.getElementById('skillSearch').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const suggestions = document.getElementById('skillSuggestions');

  if (!query) {
    suggestions.innerHTML = '';
    return;
  }

  const filtered = allSkills.filter(s => s.name.toLowerCase().includes(query)).slice(0, 6);

  if (filtered.length === 0) {
    suggestions.innerHTML = '<div class="list-group-item text-muted small">No skills found</div>';
    return;
  }

  suggestions.innerHTML = filtered.map(s => `
    <button class="list-group-item list-group-item-action" onclick="selectSkill('${s.id}', '${s.name}')">
      ${s.name} ${s.category ? `<span class="text-muted small">(${s.category})</span>` : ''}
    </button>`).join('');
});

window.selectSkill = (id, name) => {
  document.getElementById('selectedSkillId').value = id;
  document.getElementById('selectedSkillName').value = name;
  document.getElementById('skillSearch').value = '';
  document.getElementById('skillSuggestions').innerHTML = '';
};

document.getElementById('addSkillBtn').addEventListener('click', async () => {
  const skill_id = document.getElementById('selectedSkillId').value;
  const proficiency_level = document.getElementById('proficiency_level').value;

  if (!skill_id) return showError('Please select a skill first');
  if (!proficiency_level) return showError('Please select proficiency level');

  try {
    await apiRequest('/skills/candidate', 'POST', { skill_id, proficiency_level });
    showSuccess('Skill added successfully!');
    document.getElementById('selectedSkillId').value = '';
    document.getElementById('selectedSkillName').value = '';
    document.getElementById('proficiency_level').value = '';
    loadMySkills();
  } catch (err) {
    showError(err.message);
  }
});

document.getElementById('createSkillBtn').addEventListener('click', async () => {
  const name = document.getElementById('newSkillName').value;
  const category = document.getElementById('newSkillCategory').value;

  if (!name) return showError('Skill name is required');

  try {
    const data = await apiRequest('/skills', 'POST', { name, category });
    showSuccess(`Skill "${name}" created! Now select it from search.`);
    allSkills.push(data.skill);
    document.getElementById('newSkillName').value = '';
    document.getElementById('newSkillCategory').value = '';
  } catch (err) {
    showError(err.message);
  }
});

window.removeSkill = async (skillId) => {
  if (!confirm('Remove this skill from your profile?')) return;
  try {
    await apiRequest(`/skills/candidate/${skillId}`, 'DELETE');
    showSuccess('Skill removed!');
    loadMySkills();
  } catch (err) {
    showError(err.message);
  }
};

loadAllSkills();
loadMySkills();