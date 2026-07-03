const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');

    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password }, false);
      saveAuth(data.token, data.user);

      if (data.user.role === 'candidate') {
        window.location.href = `${BASE_PATH}/candidate/dashboard.html`;
        } else {
        window.location.href = `${BASE_PATH}/company/dashboard.html`;
        }
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.classList.remove('d-none');
    }
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.querySelector('input[name="role"]:checked').value;
    const errorDiv = document.getElementById('error');

    if (password !== document.getElementById('confirmPassword').value) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.remove('d-none');
        return;
    }
    try {
      const data = await apiRequest('/auth/register', 'POST', { email, password, role }, false);
      saveAuth(data.token, data.user);

      if (data.user.role === 'candidate') {
        window.location.href = 'candidate/dashboard.html';
        
      } else {
        window.location.href = 'company/dashboard.html';
      }
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.classList.remove('d-none');
    }
  });
}