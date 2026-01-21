// Lab 3 / Exercise 1 — Adaptive Registration with Dynamic Validation
(function(){
  'use strict';

  // Elements
  const form = document.getElementById('regForm');
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const confirmEl = document.getElementById('confirm');
  const ageEl = document.getElementById('age');
  const roleEl = document.getElementById('role');
  const skillsField = document.getElementById('skillsField');
  const skillsEl = document.getElementById('skills');
  const submitBtn = document.getElementById('submitBtn');

  const errName = document.getElementById('errName');
  const errEmail = document.getElementById('errEmail');
  const errPassword = document.getElementById('errPassword');
  const errConfirm = document.getElementById('errConfirm');
  const errAge = document.getElementById('errAge');
  const errRole = document.getElementById('errRole');
  const errSkills = document.getElementById('errSkills');
  const formStatus = document.getElementById('formStatus');
  const ariaLive = document.getElementById('ariaLive');

  // Configurable validation rules object
  const rules = {
    email: {
      // Basic domain verification: local@domain.tld with at least one dot in domain parts
      domainPattern: /^[a-z0-9._%+-]+@(?:[a-z0-9-]+\.)+[a-z]{2,}$/i
      // To restrict domains, you could add: allowedDomains: ['example.edu','school.edu']
    },
    roles: {
      Student: { password: { minLength: 6, requireSpecial: false }, ageMin: 13, requireSkills: false },
      Teacher: { password: { minLength: 8, requireSpecial: false }, ageMin: 21, requireSkills: true },
      Admin:   { password: { minLength: 12, requireSpecial: true  }, ageMin: 25, requireSkills: true }
    }
  };

  // Helpers to set UI validity states
  function setValidity(inputEl, ok, msgEl, message){
    inputEl.classList.toggle('valid', !!ok);
    inputEl.classList.toggle('invalid', !ok);
    inputEl.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if(msgEl) msgEl.textContent = ok ? '' : (message || '');
  }

  // Email domain verification
  function validateEmail(){
    const v = (emailEl.value || '').trim();
    if(!v){ setValidity(emailEl, false, errEmail, 'Email is required'); return false; }
    const ok = rules.email.domainPattern.test(v);
    setValidity(emailEl, ok, errEmail, ok ? '' : 'Enter a valid email domain');
    return ok;
  }

  // Password strength assessment based on role
  function validatePassword(){
    const v = passwordEl.value || '';
    const role = roleEl.value || 'Student';
    const cfg = rules.roles[role].password;
    const hasSpecial = /[\W_]/.test(v);
    const okLen = v.length >= cfg.minLength;
    const okSpecial = cfg.requireSpecial ? hasSpecial : true;
    const ok = okLen && okSpecial;
    let msg = '';
    if(!ok){
      msg = `Password must be at least ${cfg.minLength} characters` + (cfg.requireSpecial ? ' and include a special character' : '');
    }
    setValidity(passwordEl, ok, errPassword, msg);
    return ok;
  }

  // Confirm password matches
  function validateConfirm(){
    const ok = !!confirmEl.value && confirmEl.value === passwordEl.value;
    setValidity(confirmEl, ok, errConfirm, ok ? '' : 'Passwords must match');
    return ok;
  }

  // Age validation based on role minimums
  function validateAge(){
    const role = roleEl.value || 'Student';
    const minAge = rules.roles[role].ageMin;
    const num = Number((ageEl.value || '').trim());
    const ok = Number.isFinite(num) && num >= minAge;
    setValidity(ageEl, ok, errAge, ok ? '' : `Minimum age for ${role} is ${minAge}`);
    return ok;
  }

  // Name required
  function validateName(){
    const ok = !!(nameEl.value || '').trim();
    setValidity(nameEl, ok, errName, ok ? '' : 'Name is required');
    return ok;
  }

  // Role required (from given options)
  function validateRole(){
    const ok = !!(roleEl.value || '').trim();
    setValidity(roleEl, ok, errRole, ok ? '' : 'Role is required');
    return ok;
  }

  // Skills conditional requirement
  function validateSkills(){
    const role = roleEl.value || 'Student';
    const need = rules.roles[role].requireSkills;
    const val = (skillsEl.value || '').trim();
    const ok = !need || !!val;
    setValidity(skillsEl, ok, errSkills, ok ? '' : 'Skills are required for this role');
    return ok;
  }

  // Show/hide skills field based on role
  function syncSkillsVisibility(){
    const role = roleEl.value || 'Student';
    const need = rules.roles[role].requireSkills;
    skillsField.hidden = !need;
    skillsEl.toggleAttribute('required', need);
    if(!need){
      // Clear error and validity when hidden
      setValidity(skillsEl, true, errSkills, '');
      skillsEl.value = '';
    }
  }

  // Real-time validation and UI updates
  function revalidateAll(){
    const a = [
      validateName(),
      validateEmail(),
      validatePassword(),
      validateConfirm(),
      validateAge(),
      validateRole(),
      validateSkills()
    ];
    const allOk = a.every(Boolean);
    submitBtn.disabled = !allOk;
    const msg = allOk ? 'All validations passed' : 'Please fix the highlighted fields';
    formStatus.textContent = msg;
    if(ariaLive) ariaLive.textContent = msg;
  }

  // Event listeners
  function bindEvents(){
    // Input changes
    nameEl.addEventListener('input', revalidateAll);
    emailEl.addEventListener('input', revalidateAll);
    passwordEl.addEventListener('input', () => { validatePassword(); validateConfirm(); revalidateAll(); });
    confirmEl.addEventListener('input', () => { validateConfirm(); revalidateAll(); });
    ageEl.addEventListener('input', revalidateAll);
    roleEl.addEventListener('change', () => { syncSkillsVisibility(); updateRoleHelps(); validatePassword(); validateAge(); validateSkills(); revalidateAll(); });
    skillsEl.addEventListener('input', revalidateAll);

    // Submission blocking until all validations pass
    form.addEventListener('submit', (ev) => {
      try{
        revalidateAll();
        const ok = !submitBtn.disabled;
        if(!ok){
          ev.preventDefault();
          formStatus.textContent = 'Form submission blocked: fix errors';
          return;
        }
        ev.preventDefault();
        formStatus.textContent = 'Registration successful';
        if(ariaLive) ariaLive.textContent = 'Registration successful';
        form.reset();
        syncSkillsVisibility();
        revalidateAll();
      }catch(e){
        ev.preventDefault();
        formStatus.textContent = 'Unexpected error; please try again';
        if(ariaLive) ariaLive.textContent = 'Unexpected error; please try again';
      }
    });
  }

  // Dynamic role help text updates
  function updateRoleHelps(){
    const role = roleEl.value || 'Student';
    const cfg = rules.roles[role];
    const helpPwd = document.getElementById('helpPwd');
    const helpAge = document.getElementById('helpAge');
    if(helpPwd){
      helpPwd.textContent = `Password: min ${cfg.password.minLength}` + (cfg.password.requireSpecial ? ', include a special character' : '');
    }
    if(helpAge){
      helpAge.textContent = `Minimum age for ${role}: ${cfg.ageMin}`;
    }
  }
  // Init
  function init(){
    syncSkillsVisibility();
    updateRoleHelps();
    revalidateAll();
    bindEvents();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
