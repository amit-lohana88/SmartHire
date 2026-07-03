const BASE_URL = 'http://localhost:5000/api';
const BASE_PATH = '/Frontend';

const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user'));
const isLoggedIn = () => !!getToken();

const saveAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const requireAuth = () => {
  if (!isLoggedIn()) {
    window.location.href = `${BASE_PATH}/login.html`;
  }
};

const requireRole = (role) => {
  const user = getUser();
  if (!user || user.role !== role) {
    window.location.href = `${BASE_PATH}/login.html`;
  }
};

const apiRequest = async (endpoint, method = 'GET', body = null, auth = true) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (auth) {
    headers['Authorization'] = `Bearer ${getToken()}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};