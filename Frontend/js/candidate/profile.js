requireAuth();
requireRole('candidate');

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearAuth();
  window.location.href = `${BASE_PATH}/login.html`;
});

const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
const profileDisplay = document.getElementById('profileDisplay');
const profileForm = document.getElementById('profileForm');
let profileExists = false;

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

const showDisplay = (p) => {
  document.getElementById('displayName').textContent = p.full_name || '-';
  document.getElementById('displayHeadline').textContent = p.headline || '-';
  document.getElementById('displayLocation').textContent = p.location || '-';
  document.getElementById('displayPhone').textContent = p.phone || '-';
  document.getElementById('displayExperience').textContent = p.total_experience_yrs || '0';
  document.getElementById('displayAbout').textContent = p.about_me || 'No description added yet.';

  const resumeLink = document.getElementById('displayResume');
  if (p.resume_url) {
    resumeLink.href = p.resume_url;
  } else {
    resumeLink.classList.add('disabled');
    resumeLink.textContent = 'No Resume';
  }

  const linkedinLink = document.getElementById('displayLinkedin');
  if (p.linkedin_url) {
    linkedinLink.href = p.linkedin_url;
  } else {
    linkedinLink.classList.add('disabled');
  }

  const portfolioLink = document.getElementById('displayPortfolio');
  if (p.portfolio_url) {
    portfolioLink.href = p.portfolio_url;
  } else {
    portfolioLink.classList.add('disabled');
  }

  profileDisplay.classList.remove('d-none');
  profileForm.classList.add('d-none');
};

const fillForm = (p) => {
  document.getElementById('full_name').value = p.full_name || '';
  document.getElementById('headline').value = p.headline || '';
  document.getElementById('phone').value = p.phone || '';
  document.getElementById('location').value = p.location || '';
  document.getElementById('total_experience_yrs').value = p.total_experience_yrs || '';
  document.getElementById('profile_photo_url').value = p.profile_photo_url || '';
  document.getElementById('resume_url').value = p.resume_url || '';
  document.getElementById('linkedin_url').value = p.linkedin_url || '';
  document.getElementById('portfolio_url').value = p.portfolio_url || '';
  document.getElementById('about_me').value = p.about_me || '';
};

let currentProfile = null;

const loadProfile = async () => {
  try {
    const data = await apiRequest('/candidate/profile');
    currentProfile = data.profile;
    profileExists = true;

    document.getElementById('formTitle').textContent = 'Edit Profile';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-save me-2"></i>Update Profile';
    document.getElementById('submitBtn').className = 'btn btn-success px-4';
    document.getElementById('cancelBtn').classList.remove('d-none');

    showDisplay(currentProfile);
    fillForm(currentProfile);

  } catch (err) {
    if (err.message === 'Profile not found') {
      profileExists = false;
      profileDisplay.classList.add('d-none');
      profileForm.classList.remove('d-none');
      document.getElementById('formTitle').textContent = 'Complete Your Profile';
      document.getElementById('submitBtn').innerHTML = '<i class="bi bi-save me-2"></i>Create Profile';
      document.getElementById('submitBtn').className = 'btn btn-primary px-4';
      return;
    }
    showError(err.message);
  }
};

document.getElementById('editBtn') && document.getElementById('editBtn').addEventListener('click', () => {
  profileDisplay.classList.add('d-none');
  profileForm.classList.remove('d-none');
  errorDiv.classList.add('d-none');
  successDiv.classList.add('d-none');
});

document.getElementById('cancelBtn').addEventListener('click', () => {
  profileForm.classList.add('d-none');
  profileDisplay.classList.remove('d-none');
  errorDiv.classList.add('d-none');
  successDiv.classList.add('d-none');
});

document.getElementById('submitBtn').addEventListener('click', async () => {
  const body = {
    full_name: document.getElementById('full_name').value,
    headline: document.getElementById('headline').value,
    phone: document.getElementById('phone').value,
    location: document.getElementById('location').value,
    total_experience_yrs: document.getElementById('total_experience_yrs').value,
    profile_photo_url: document.getElementById('profile_photo_url').value,
    resume_url: document.getElementById('resume_url').value,
    linkedin_url: document.getElementById('linkedin_url').value,
    portfolio_url: document.getElementById('portfolio_url').value,
    about_me: document.getElementById('about_me').value
  };

  try {
    if (profileExists) {
      const data = await apiRequest('/candidate/profile', 'PUT', body);
      currentProfile = data.profile;
      showSuccess('Profile updated successfully!');
    } else {
      const data = await apiRequest('/candidate/profile', 'POST', body);
      currentProfile = data.profile;
      profileExists = true;
      showSuccess('Profile created successfully!');
    }
    showDisplay(currentProfile);
    profileForm.classList.add('d-none');
  } catch (err) {
    showError(err.message);
  }
});

loadProfile();