(() => {
  'use strict';

  const steps = [
    { id:'step1' },
    { id:'step2' },
    { id:'step3' },
    { id:'step4' }
  ];
  let current = 0;
  const state = {
    name: '',
    email: '',
    age: '',
    phone: '',
    pref: '',
    topics: [],
    accept: false
  };

  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');
  const globalStatus = document.getElementById('globalStatus');

  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const ageEl = document.getElementById('age');
  const phoneEl = document.getElementById('phone');
  const errName = document.getElementById('errName');
  const errEmail = document.getElementById('errEmail');
  const errAge = document.getElementById('errAge');
  const errPhone = document.getElementById('errPhone');
  const errPref = document.getElementById('errPref');
  const errTopics = document.getElementById('errTopics');
  const errAccept = document.getElementById('errAccept');
  const summaryBox = document.getElementById('summaryBox');

  function hidden(el, h){ el.classList.toggle('hidden', !!h); }

  function setValid(input){
    input.style.border = '1px solid #2e7d32';
    input.style.boxShadow = '0 0 0 3px rgba(46,125,50,0.15)';
  }
  function setInvalid(input){
    input.style.border = '1px solid #2e7d32';
    input.style.boxShadow = '0 0 0 3px rgba(46,125,50,0.15)';
  }
  function clearState(input){
    input.style.border = '1px solid #dfe3e6';
    input.style.boxShadow = 'none';
  }

  function validateStep(idx){
    globalStatus.textContent = '';
    if(idx === 0){
      const name = (nameEl.value || '').trim();
      const email = (emailEl.value || '').trim();
      let ok = true;
      if(!name){ errName.textContent = 'Name is required'; setInvalid(nameEl); ok = false; } else { errName.textContent=''; setValid(nameEl); }
      const emailOk = /^[a-z0-9._%+-]+@(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(email);
      if(!emailOk){ errEmail.textContent = 'Enter a valid email'; setInvalid(emailEl); ok = false; } else { errEmail.textContent=''; setValid(emailEl); }
      if(ok){ state.name=name; state.email=email; }
      return ok;
    }
    if(idx === 1){
      const age = Number((ageEl.value || '').trim());
      let phone = (phoneEl.value || '').replace(/\D+/g,'').slice(0,10);
      phoneEl.value = phone;
      let ok = true;
      if(!Number.isFinite(age) || age < 13){ errAge.textContent='Age must be 13 or above'; setInvalid(ageEl); ok = false; } else { errAge.textContent=''; setValid(ageEl); }
      if(phone.length !== 10){ errPhone.textContent='Enter 10 digits'; setInvalid(phoneEl); ok = false; } else { errPhone.textContent=''; setValid(phoneEl); }
      if(ok){ state.age=String(age); state.phone=phone; }
      return ok;
    }
    if(idx === 2){
      const pref = Array.from(document.querySelectorAll('input[name="pref"]')).find(i => i.checked)?.value || '';
      const topics = Array.from(document.querySelectorAll('input[name="topics"]:checked')).map(i => i.value);
      let ok = true;
      if(!pref){ errPref.textContent='Select a preference'; ok = false; } else { errPref.textContent=''; }
      if(topics.length < 1){ errTopics.textContent='Select at least one topic'; ok = false; } else { errTopics.textContent=''; }
      if(ok){ state.pref=pref; state.topics=topics; }
      return ok;
    }
    if(idx === 3){
      const accept = document.getElementById('accept').checked;
      if(!accept){ errAccept.textContent='Please confirm'; return false; }
      errAccept.textContent=''; state.accept = true;
      return true;
    }
    return false;
  }

  function updateSummary(){
    summaryBox.innerHTML = `
      <div><strong>Name:</strong> ${state.name}</div>
      <div><strong>Email:</strong> ${state.email}</div>
      <div><strong>Age:</strong> ${state.age}</div>
      <div><strong>Phone:</strong> ${state.phone}</div>
      <div><strong>Preference:</strong> ${state.pref}</div>
      <div><strong>Topics:</strong> ${state.topics.join(', ')}</div>
    `;
  }

  function showStep(idx){
    steps.forEach((s,i) => hidden(document.getElementById(s.id), i!==idx));
    backBtn.disabled = idx === 0;
    nextBtn.textContent = idx === steps.length-1 ? 'Submit' : 'Next';
    const pct = Math.round(((idx)/ (steps.length-1)) * 100);
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `Step ${idx+1} of ${steps.length}`;
    if(idx === 3) updateSummary();
  }

  nameEl.addEventListener('input', () => { errName.textContent=''; clearState(nameEl); });
  emailEl.addEventListener('input', () => { errEmail.textContent=''; clearState(emailEl); });
  ageEl.addEventListener('input', () => { errAge.textContent=''; clearState(ageEl); });
  phoneEl.addEventListener('input', () => { errPhone.textContent=''; clearState(phoneEl); });
  document.querySelectorAll('input[name="pref"]').forEach(i => i.addEventListener('change', () => { errPref.textContent=''; }));
  document.querySelectorAll('input[name="topics"]').forEach(i => i.addEventListener('change', () => { errTopics.textContent=''; }));
  document.getElementById('accept').addEventListener('change', () => { errAccept.textContent=''; });

  backBtn.addEventListener('click', () => {
    if(current > 0){ current--; showStep(current); }
  });

  nextBtn.addEventListener('click', () => {
    const ok = validateStep(current);
    if(!ok){
      globalStatus.textContent = 'Please fix the highlighted fields';
      return;
    }
    globalStatus.textContent = '';
    if(current < steps.length-1){
      current++;
      showStep(current);
    } else {
      nextBtn.disabled = true;
      backBtn.disabled = true;
      globalStatus.textContent = 'Form submitted successfully';
    }
  });

  showStep(current);
})(); 
