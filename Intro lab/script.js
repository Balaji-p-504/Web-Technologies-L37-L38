// script.js — form validation for registration
(function(){
  'use strict';
  const form = document.getElementById('regForm');
  if(!form) return;

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    const fields = [
      {id:'name', label:'Name'},
      {id:'regno', label:'Registration Number'},
      {id:'phone', label:'Phone Number'},
      {id:'email', label:'Email'}
    ];
    for(const f of fields){
      const el = document.getElementById(f.id);
      if(!el || !el.value || el.value.trim() === ''){
        alert('Error: ' + f.label + ' column left empty');
        el && el.focus();
        return false;
      }
    }
    // Demo behaviour: show confirmation and reset
    alert('Registration confirmed (demo).');
    form.reset();
    return true;
  });
})();
