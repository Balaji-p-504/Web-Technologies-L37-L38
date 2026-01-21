// Lab 3 / Exercise 3 — Dynamic Survey Builder (pure JS styling, white/green theme)
(function(){
  'use strict';

  // Theme colors (used via JS style attributes)
  const colors = {
    bg: '#ffffff',
    border: '#dfe3e6',
    text: '#222',
    muted: '#607d8b',
    green: '#2e7d32',
    greenShadow: 'rgba(46,125,50,0.15)'
  };

  // Example question data structure
  const questions = [
    { questionText: 'Your Name', type: 'text', required: true, maxLength: 40 },
    { questionText: 'Preferred Contact', type: 'radio', required: true, options: ['Email', 'Phone'] },
    { questionText: 'Topics Interested', type: 'checkbox', required: false, options: ['Web', 'AI', 'Networks', 'Security'], maxSelections: 2 },
    { questionText: 'Short Feedback', type: 'text', required: false, maxLength: 120 }
  ];

  // Validators config per input type
  const validators = {
    text: {
      validate(q, inputEl){
        const v = (inputEl.value || '').trim();
        if(q.required && !v) return { ok:false, msg:'This field is required' };
        if(q.maxLength && v.length > q.maxLength) return { ok:false, msg:`Max ${q.maxLength} characters` };
        return { ok:true };
      }
    },
    radio: {
      validate(q, groupEls){
        const count = groupEls.filter(el => el.checked).length;
        if(q.required && count !== 1) return { ok:false, msg:'Select exactly one option' };
        if(!q.required && count > 1) return { ok:false, msg:'Select only one option' };
        return { ok:true };
      }
    },
    checkbox: {
      validate(q, groupEls){
        const count = groupEls.filter(el => el.checked).length;
        if(q.required && count < 1) return { ok:false, msg:'Select at least one option' };
        if(q.maxSelections && count > q.maxSelections) return { ok:false, msg:`Select up to ${q.maxSelections}` };
        return { ok:true };
      }
    }
  };

  // Apply white/green styles to a field container and input(s)
  function styleFieldWrapper(wrapper){
    wrapper.style.margin = '12px 0';
  }
  function styleLabel(label){
    label.style.display = 'block';
    label.style.marginBottom = '6px';
    label.style.color = colors.muted;
    label.style.fontSize = '13px';
  }
  function styleInput(input){
    input.style.width = '100%';
    input.style.padding = '10px 12px';
    input.style.background = colors.bg;
    input.style.border = `1px solid ${colors.border}`;
    input.style.borderRadius = '8px';
    input.style.outline = 'none';
    input.style.color = colors.text;
  }
  function styleGroupOption(container){
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '8px';
    container.style.margin = '6px 0';
  }
  function styleError(el){
    el.style.color = colors.green; // green palette per requirement
    el.style.fontSize = '12px';
    el.style.minHeight = '16px';
    el.style.marginTop = '6px';
  }
  function setValid(el){
    el.style.border = `1px solid ${colors.green}`;
    el.style.boxShadow = `0 0 0 3px ${colors.greenShadow}`;
  }
  function setInvalid(el){
    el.style.border = `1px solid ${colors.green}`;
    el.style.boxShadow = `0 0 0 3px ${colors.greenShadow}`;
  }
  function clearState(el){
    el.style.border = `1px solid ${colors.border}`;
    el.style.boxShadow = 'none';
  }

  // Build the survey form dynamically from questions array
  function buildSurvey(container, qList){
    const form = document.createElement('form');
    form.id = 'surveyForm';
    form.setAttribute('novalidate','');

    // Header styles (assigned via JS)
    const header = document.getElementById('header');
    if(header){
      header.style.padding = '16px 20px';
      header.style.fontWeight = '600';
      header.style.color = colors.green;
    }
    container.style.maxWidth = '860px';
    container.style.margin = '0 auto';
    container.style.padding = '16px 20px';

    const fields = [];

    qList.forEach((q, idx) => {
      const fieldWrapper = document.createElement('div');
      styleFieldWrapper(fieldWrapper);
      const label = document.createElement('label');
      styleLabel(label);
      label.textContent = q.questionText + (q.required ? ' *' : '');

      const error = document.createElement('div');
      styleError(error);
      error.setAttribute('aria-live','polite');

      // Create input(s) based on type
      if(q.type === 'text'){
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = q.maxLength || '';
        input.name = `q_${idx}`;
        styleInput(input);
        fieldWrapper.appendChild(label);
        fieldWrapper.appendChild(input);
        fieldWrapper.appendChild(error);
        form.appendChild(fieldWrapper);

        // Real-time validation
        input.addEventListener('input', () => {
          const res = validators.text.validate(q, input);
          if(res.ok){ setValid(input); error.textContent = ''; } else { setInvalid(input); error.textContent = res.msg; }
          if(!input.value) clearState(input), (error.textContent = '');
        });

        fields.push({ type:q.type, inputs:[input], error, q });
      } else if(q.type === 'radio'){
        const group = document.createElement('div');
        group.style.display = 'block';
        const inputs = [];
        q.options.forEach((opt,i) => {
          const optWrap = document.createElement('div');
          styleGroupOption(optWrap);
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = `q_${idx}`;
          input.value = opt;
          const optLabel = document.createElement('label');
          optLabel.textContent = opt;
          optLabel.style.color = colors.text;
          optWrap.appendChild(input);
          optWrap.appendChild(optLabel);
          group.appendChild(optWrap);
          inputs.push(input);
        });
        fieldWrapper.appendChild(label);
        fieldWrapper.appendChild(group);
        fieldWrapper.appendChild(error);
        form.appendChild(fieldWrapper);

        // Real-time validation
        inputs.forEach(input => input.addEventListener('change', () => {
          const res = validators.radio.validate(q, inputs);
          // Highlight the group container boundary using first option's input
          const anchor = inputs[0];
          if(res.ok){ setValid(anchor); error.textContent = ''; } else { setInvalid(anchor); error.textContent = res.msg; }
        }));

        fields.push({ type:q.type, inputs:inputs, error, q });
      } else if(q.type === 'checkbox'){
        const group = document.createElement('div');
        group.style.display = 'block';
        const inputs = [];
        q.options.forEach((opt,i) => {
          const optWrap = document.createElement('div');
          styleGroupOption(optWrap);
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.name = `q_${idx}_${i}`;
          input.value = opt;
          const optLabel = document.createElement('label');
          optLabel.textContent = opt;
          optLabel.style.color = colors.text;
          optWrap.appendChild(input);
          optWrap.appendChild(optLabel);
          group.appendChild(optWrap);
          inputs.push(input);
        });
        fieldWrapper.appendChild(label);
        fieldWrapper.appendChild(group);
        fieldWrapper.appendChild(error);
        form.appendChild(fieldWrapper);

        // Real-time validation
        inputs.forEach(input => input.addEventListener('change', () => {
          const res = validators.checkbox.validate(q, inputs);
          const anchor = inputs[0];
          if(res.ok){ setValid(anchor); error.textContent = ''; } else { setInvalid(anchor); error.textContent = res.msg; }
        }));

        fields.push({ type:q.type, inputs:inputs, error, q });
      }
    });

    // Submit button
    const submitRow = document.createElement('div');
    submitRow.style.marginTop = '14px';
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Submit Survey';
    submitBtn.style.padding = '10px 12px';
    submitBtn.style.borderRadius = '8px';
    submitBtn.style.border = `1px solid ${colors.green}`;
    submitBtn.style.background = colors.green;
    submitBtn.style.color = '#fff';
    submitBtn.style.cursor = 'pointer';
    submitRow.appendChild(submitBtn);

    const status = document.createElement('div');
    status.style.marginTop = '8px';
    status.style.minHeight = '18px';
    status.style.color = colors.green;
    status.setAttribute('aria-live','polite');
    submitRow.appendChild(status);

    form.appendChild(submitRow);
    container.appendChild(form);

    // Validate all fields function
    function validateAll(){
      let allOk = true;
      fields.forEach(f => {
        if(f.type === 'text'){
          const res = validators.text.validate(f.q, f.inputs[0]);
          if(res.ok){ setValid(f.inputs[0]); f.error.textContent = ''; } else { setInvalid(f.inputs[0]); f.error.textContent = res.msg; allOk = false; }
        } else if(f.type === 'radio'){
          const res = validators.radio.validate(f.q, f.inputs);
          const anchor = f.inputs[0];
          if(res.ok){ setValid(anchor); f.error.textContent = ''; } else { setInvalid(anchor); f.error.textContent = res.msg; allOk = false; }
        } else if(f.type === 'checkbox'){
          const res = validators.checkbox.validate(f.q, f.inputs);
          const anchor = f.inputs[0];
          if(res.ok){ setValid(anchor); f.error.textContent = ''; } else { setInvalid(anchor); f.error.textContent = res.msg; allOk = false; }
        }
      });
      return allOk;
    }

    // Submission control
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const ok = validateAll();
      if(!ok){
        status.textContent = 'Please correct the highlighted fields';
        return;
      }
      status.textContent = 'Survey submitted successfully';
      form.reset();
      // Clear visual state
      fields.forEach(f => {
        f.inputs.forEach(inp => clearState(inp));
        f.error.textContent = '';
      });
    });
  }

  // Initialize
  function init(){
    const container = document.getElementById('surveyContainer');
    if(!container) return;
    try{
      buildSurvey(container, questions);
    }catch(e){
      const err = document.createElement('div');
      err.textContent = 'Error building survey';
      err.style.color = colors.green;
      container.appendChild(err);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
