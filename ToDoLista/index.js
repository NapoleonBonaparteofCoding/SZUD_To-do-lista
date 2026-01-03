(() => {
  const STORAGE = 'todo-list-v1';
  const SORT_KEY = 'todo-sort-order';
  const listEl = document.getElementById('task-list');
  const newTaskInput = document.getElementById('new-task');
  const addBtn = document.getElementById('add-btn');
  const prioritySelect = document.getElementById('priority-select');
  const sortSelect = document.getElementById('sort-order');
  const itemsLeft = document.getElementById('items-left');
  const filterBtns = document.querySelectorAll('.filter');
  const clearBtn = document.getElementById('clear-completed');
  let sortOrder = localStorage.getItem(SORT_KEY) || 'newest';

  let tasks = [];
  let filter = 'all';

  function load(){
    try { tasks = JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { tasks = []; }
    // ensure createdAt and priority exist for older entries
    tasks = tasks.map(t => ({ ...t, createdAt: t.createdAt || Number(t.id), priority: t.priority || 'normal' }));
  }
  function save(){ localStorage.setItem(STORAGE, JSON.stringify(tasks)); }

  function createTaskElement(task){
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('completed');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'toggle';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', 'Označi kao završeno');

    const label = document.createElement('label');
    label.textContent = task.text;
    label.tabIndex = 0;

    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = '×';
    del.setAttribute('aria-label', 'Obriši stavku');

    const pr = document.createElement('select');
    pr.className = 'task-priority pr-' + (task.priority || 'normal');
    pr.setAttribute('aria-label', 'Prioritet zadatka');
    pr.innerHTML = '<option value="soon">Uskoro</option><option value="normal">Ima vremena</option><option value="optional">ne mora ni da se uradi ali bilo bi dobro</option>';
    pr.value = task.priority || 'normal';
    pr.addEventListener('change', () => updatePriority(task.id, pr.value));

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(pr);
    li.appendChild(del);

    li.classList.add('pr-' + (task.priority || 'normal'));

    return li;
  }

  function render(){
    listEl.innerHTML = '';
    const filtered = tasks.filter(t => filter === 'all' ? true : (filter === 'active' ? !t.completed : t.completed));
    const sorted = [...filtered].sort((a,b) => (sortOrder === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt));
    sorted.forEach(t => listEl.appendChild(createTaskElement(t)));
    itemsLeft.textContent = `${tasks.filter(t => !t.completed).length} stavki`;
  }

  function addTask(text){
    if(!text || !text.trim()) return;
    const priority = (typeof prioritySelect !== 'undefined' && prioritySelect) ? prioritySelect.value : 'normal';
    tasks.push({ id: Date.now().toString(), text: text.trim(), completed: false, createdAt: Date.now(), priority });
    save(); render();
  }

  function toggleTask(id){
    const t = tasks.find(x => x.id === id); if(!t) return; t.completed = !t.completed; save(); render();
  }

  function deleteTask(id){ tasks = tasks.filter(x => x.id !== id); save(); render(); }

  function editTask(id, newText){
    const t = tasks.find(x => x.id === id); if(!t) return; t.text = newText.trim(); if(!t.text) deleteTask(id); else { save(); render(); }
  }

  function updatePriority(id, newPriority){ const t = tasks.find(x => x.id === id); if(!t) return; t.priority = newPriority; save(); render(); }

  function clearCompleted(){ tasks = tasks.filter(x => !x.completed); save(); render(); }

  function setFilter(f){ filter = f; filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === f)); render(); }

  addBtn.addEventListener('click', () => { addTask(newTaskInput.value); newTaskInput.value = ''; newTaskInput.focus(); });
  newTaskInput.addEventListener('keydown', e => { if(e.key === 'Enter'){ addTask(newTaskInput.value); newTaskInput.value = ''; } });



  listEl.addEventListener('click', e => {
    const li = e.target.closest('li.task-item'); if(!li) return; const id = li.dataset.id;
    if(e.target.classList.contains('toggle')) toggleTask(id);
    if(e.target.classList.contains('delete')) deleteTask(id);
  });

  listEl.addEventListener('dblclick', e => {
    if(e.target.tagName.toLowerCase() === 'label'){
      const li = e.target.closest('li.task-item');
      const id = li.dataset.id;
      const input = document.createElement('input');
      input.className = 'edit-input';
      input.value = e.target.textContent;
      li.replaceChild(input, e.target);
      input.focus();
      input.select();

      function finish(saveEdit){
        if(saveEdit) editTask(id, input.value);
        else render();
        input.removeEventListener('keydown', onKey);
        input.removeEventListener('blur', onBlur);
      }
      function onKey(ev){ if(ev.key === 'Enter') finish(true); if(ev.key === 'Escape') finish(false); }
      function onBlur(){ finish(true); }

      input.addEventListener('keydown', onKey);
      input.addEventListener('blur', onBlur);
    }
  });

  filterBtns.forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
  clearBtn.addEventListener('click', clearCompleted);

  // sort control
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortOrder = sortSelect.value;
      localStorage.setItem(SORT_KEY, sortOrder);
      render();
    });
  }

  load();
  if (sortSelect) sortSelect.value = sortOrder;
  render();
})();
