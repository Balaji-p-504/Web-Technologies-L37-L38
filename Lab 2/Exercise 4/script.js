// Exercise 4: User Registration & Management functionality
(function(){
  'use strict';

  // Elements
  const form = document.getElementById('regForm');
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const mobileEl = document.getElementById('mobile');
  const passwordEl = document.getElementById('password');
  const submitBtn = document.getElementById('submitBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const errName = document.getElementById('errName');
  const errEmail = document.getElementById('errEmail');
  const errMobile = document.getElementById('errMobile');
  const errPassword = document.getElementById('errPassword');
  const pwdStrength = document.getElementById('pwdStrength');
  const formStatus = document.getElementById('formStatus');
  const usersTbody = document.getElementById('usersTbody');
  const toastContainer = document.getElementById('toast-container');

  // Storage key
  const STORAGE_KEY = 'exercise4_users';

  // Util: show toast notifications
  function showToast(message){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // Util: read/write users map from localStorage (wrapped in try/catch)
  function loadUsers(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function saveUsers(map){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Render users table
  function renderTable(){
    const users = loadUsers();
    usersTbody.innerHTML = '';
    const emails = Object.keys(users);
    for(const email of emails){
      const u = users[email];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.mobile)}</td>
        <td class="actions-cell">
          <button class="btn delete" data-action="delete" data-email="${escapeAttr(u.email)}">Delete</button>
        </td>
      `;
      usersTbody.appendChild(tr);
    }
  }

  // Simple escaping for safe rendering
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
  }
  function escapeAttr(str){
    return String(str).replace(/["']/g, s => ({'"':'&quot;','\'':'&#39;'}[s]));
  }

  // Validations
  function validateName(){
    const v = (nameEl.value || '').trim();
    if(!v){ errName.textContent = 'Name is required'; return false; }
    errName.textContent = ''; return true;
  }
  function validateEmail(){
    const v = (emailEl.value || '').trim();
    if(!v){ errEmail.textContent = 'Email is required'; return false; }
    const ok = /.+@.+\..+/.test(v);
    if(!ok){ errEmail.textContent = 'Enter a valid email address'; return false; }
    errEmail.textContent = ''; return true;
  }
  function validateMobile(){
    const v = (mobileEl.value || '').trim();
    if(!v){ errMobile.textContent = 'Mobile number is required'; return false; }
    const digitsOnly = /^\d{10}$/.test(v);
    if(!digitsOnly){ errMobile.textContent = 'Mobile must be exactly 10 digits'; return false; }
    errMobile.textContent = ''; return true;
  }
  function validatePassword(){
    const v = passwordEl.value || '';
    if(!v){ errPassword.textContent = 'Password is required'; return false; }
    if(v.length < 6){ errPassword.textContent = 'Password must be at least 6 characters'; return false; }
    errPassword.textContent = ''; return true;
  }

  // Password strength indicator
  function updateStrength(){
    const v = passwordEl.value || '';
    let score = 0;
    if(v.length >= 6) score++;
    if(/[A-Z]/.test(v)) score++;
    if(/[a-z]/.test(v)) score++;
    if(/\d/.test(v)) score++;
    if(/[\W_]/.test(v)) score++;
    const levels = ['Weak','Fair','Good','Strong','Very Strong'];
    const label = levels[Math.min(score, levels.length-1)];
    pwdStrength.textContent = `Strength: ${label}`;
  }

  // Restrict mobile input to digits only
  function bindMobileDigitsOnly(){
    mobileEl.addEventListener('input', () => {
      mobileEl.value = mobileEl.value.replace(/\D+/g, '').slice(0,10);
    });
  }

  // Submit handler
  function onSubmit(ev){
    ev.preventDefault();
    const ok = [validateName(), validateEmail(), validateMobile(), validatePassword()].every(Boolean);
    if(!ok){ formStatus.textContent = 'Fix errors before submitting'; formStatus.style.color = '#ff0000'; return; }

    const user = {
      name: nameEl.value.trim(),
      email: emailEl.value.trim().toLowerCase(),
      mobile: mobileEl.value.trim(),
      password: passwordEl.value
    };

    const users = loadUsers();
    if(users[user.email]){
      formStatus.textContent = 'Duplicate registration: email already exists';
      formStatus.style.color = '#ff0000';
      return;
    }

    users[user.email] = user;
    const saved = saveUsers(users);
    if(!saved){
      formStatus.textContent = 'Storage error: could not save user';
      formStatus.style.color = '#ff0000';
      return;
    }

    showToast('User registered successfully');
    formStatus.textContent = '';
    form.reset();
    updateStrength();
    renderTable();
  }

  // Event delegation: handle table actions (Delete)
  function onTableClick(ev){
    const btn = ev.target.closest('button');
    if(!btn) return;
    const action = btn.dataset.action;
    if(action === 'delete'){
      const email = btn.dataset.email;
      if(!email) return;
      const confirmed = window.confirm('Delete this user?');
      if(!confirmed) return;
      const users = loadUsers();
      if(users[email]){
        delete users[email];
        saveUsers(users);
        renderTable();
      }
    }
  }

  // Clear all users
  function onClearAll(){
    const confirmed = window.confirm('Clear all users? This cannot be undone.');
    if(!confirmed) return;
    const ok = saveUsers({});
    if(!ok){
      showToast('Storage error while clearing users');
      return;
    }
    renderTable();
  }

  // Refresh button: reload from storage and render
  function onRefresh(){ renderTable(); }

  // Initialize
  function init(){
    bindMobileDigitsOnly();
    updateStrength();
    passwordEl.addEventListener('input', updateStrength);
    form.addEventListener('submit', onSubmit);
    usersTbody.addEventListener('click', onTableClick);
    clearAllBtn.addEventListener('click', onClearAll);
    refreshBtn.addEventListener('click', onRefresh);
    renderTable();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
