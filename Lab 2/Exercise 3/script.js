// Exercise 3: Task Board functionality
(function(){
  'use strict';

  // Elements
  const input = document.getElementById('taskInput');
  const addBtn = document.getElementById('addTaskBtn');
  const errorEl = document.getElementById('inputError');
  const zones = {
    todo: document.getElementById('todo'),
    inprogress: document.getElementById('inprogress'),
    completed: document.getElementById('completed')
  };
  const toastContainer = document.getElementById('toast-container');

  const STORAGE_KEY = 'exercise3_tasks';
  let tasks = [];
  let draggedTaskId = null;

  // Utilities
  function formatDateMMDDYYYY(date){
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  function showToast(message){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    toastContainer.appendChild(t);
    setTimeout(() => {
      t.remove();
    }, 3000);
  }

  function save(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }catch(e){
      // Storage might be unavailable; fail silently
    }
  }
  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    }catch(e){
      tasks = [];
    }
  }

  // Render tasks into columns
  function render(){
    zones.todo.innerHTML = '';
    zones.inprogress.innerHTML = '';
    zones.completed.innerHTML = '';

    for(const task of tasks){
      const card = document.createElement('div');
      card.className = 'card' + (task.status === 'completed' ? ' completed' : '');
      card.setAttribute('draggable', 'true');
      card.dataset.id = task.id;

      const nameEl = document.createElement('div');
      nameEl.className = 'name';
      nameEl.textContent = task.name;
      const dateEl = document.createElement('div');
      dateEl.className = 'date';
      dateEl.textContent = task.date;
      card.appendChild(nameEl);
      card.appendChild(dateEl);

      // Drag handlers
      card.addEventListener('dragstart', (ev) => {
        draggedTaskId = card.dataset.id;
        card.classList.add('dragging');
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('text/plain', draggedTaskId);
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        draggedTaskId = null;
      });

      // Place in appropriate zone
      const zone = task.status === 'inprogress' ? zones.inprogress
                  : task.status === 'completed' ? zones.completed
                  : zones.todo;
      zone.appendChild(card);
    }
  }

  // Dropzone handlers
  function attachZoneHandlers(zoneEl, status){
    zoneEl.addEventListener('dragenter', (ev) => {
      ev.preventDefault();
      zoneEl.classList.add('drag-over');
    });
    zoneEl.addEventListener('dragover', (ev) => {
      ev.preventDefault();
    });
    zoneEl.addEventListener('dragleave', () => {
      zoneEl.classList.remove('drag-over');
    });
    zoneEl.addEventListener('drop', (ev) => {
      ev.preventDefault();
      zoneEl.classList.remove('drag-over');
      const id = ev.dataTransfer.getData('text/plain') || draggedTaskId;
      if(!id) return;
      const t = tasks.find(x => String(x.id) === String(id));
      if(!t) return;
      const wasCompleted = t.status === 'completed';
      t.status = status;
      save();
      render();
      if(status === 'completed' && !wasCompleted){
        showToast('Task Completed Successfully');
      }
    });
  }

  // Create task
  function addTask(){
    const name = (input.value || '').trim();
    if(!name){
      errorEl.textContent = 'Please enter a task name';
      input.focus();
      return;
    }
    errorEl.textContent = '';
    const task = {
      id: Date.now(),
      name,
      date: formatDateMMDDYYYY(new Date()),
      status: 'todo'
    };
    tasks.push(task);
    save();
    render();
    input.value = '';
  }

  // Init
  function init(){
    load();
    render();
    addBtn.addEventListener('click', addTask);
    input.addEventListener('keydown', (e) => {
      if(e.key === 'Enter') addTask();
    });
    attachZoneHandlers(zones.todo, 'todo');
    attachZoneHandlers(zones.inprogress, 'inprogress');
    attachZoneHandlers(zones.completed, 'completed');
  }

  // DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
