// DailyHub - LocalStorage State Management for Tasks, Notes, and Personal Calendar
const STORAGE_KEY = 'dailyhub_data_v1';

const todayStr = () => new Date().toISOString().split('T')[0];

const defaultData = {
  theme: 'light',
  tasks: [
    { id: 't1', title: 'Review project milestones', desc: 'Check Q4 deliverables and timeline', date: todayStr(), priority: 'high', completed: false },
    { id: 't2', title: 'Buy groceries & coffee beans', desc: 'Oat milk, espresso roast, fresh fruit', date: todayStr(), priority: 'medium', completed: true }
  ],
  notes: [
    { id: 'n1', title: 'App Ideas & Brainstorm', body: '1. Offline sync capability\n2. Custom tags for calendar\n3. Weekly habit reflection', color: 'amber', updatedAt: new Date().toLocaleDateString() },
    { id: 'n2', title: 'Reading List', body: '- Designing Data-Intensive Applications\n- The Pragmatic Programmer\n- Atomic Habits', color: 'sky', updatedAt: new Date().toLocaleDateString() }
  ],
  events: [
    { id: 'e1', title: 'Morning Workout', date: todayStr(), time: '08:00', color: '#10b981', notes: '30m cardio + core session' },
    { id: 'e2', title: 'Team Sync Call', date: todayStr(), time: '14:00', color: '#4f46e5', notes: 'Discuss mobile APK release' }
  ]
};

let state = loadState();
let activeTab = 'tasks';
let activeTaskFilter = 'all';
let selectedNoteColor = 'default';
let calCurrentDate = new Date();
let selectedCalendarDate = todayStr();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : structuredClone(defaultData);
  } catch (e) {
    return structuredClone(defaultData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  updateHeaderDate();
  setupNavigation();
  setupTaskHandlers();
  setupNoteHandlers();
  setupCalendarHandlers();
  setupModals();
  renderAll();
});

function applyTheme() {
  document.body.classList.toggle('dark', state.theme === 'dark');
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveState();
  applyTheme();
});

// Export / Backup JSON
document.getElementById('export-btn').addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `dailyhub-backup-${todayStr()}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
});

function updateHeaderDate() {
  const opts = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  document.getElementById('current-date-label').textContent = new Date().toLocaleDateString(undefined, opts);
}

// Navigation
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const titles = { tasks: 'My Tasks', notes: 'Quick Notes', calendar: 'Personal Calendar' };

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.target;
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(`view-${activeTab}`).classList.add('active');
      document.getElementById('view-title').textContent = titles[activeTab];
      renderAll();
    });
  });

  // FAB click opens modal for current active tab
  document.getElementById('fab-add').addEventListener('click', () => {
    if (activeTab === 'tasks') openTaskModal();
    else if (activeTab === 'notes') openNoteModal();
    else if (activeTab === 'calendar') openEventModal(null, selectedCalendarDate);
  });
}

function renderAll() {
  renderTasks();
  renderNotes();
  renderCalendar();
}

/* ==================== 1. TO-DO LIST ==================== */
function setupTaskHandlers() {
  document.querySelectorAll('.filter-bar .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-bar .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeTaskFilter = chip.dataset.filter;
      renderTasks();
    });
  });

  document.getElementById('form-task').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-name').value.trim();
    const date = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;
    const desc = document.getElementById('task-desc').value.trim();

    if (!title) return;

    if (id) {
      const idx = state.tasks.findIndex(t => t.id === id);
      if (idx > -1) state.tasks[idx] = { ...state.tasks[idx], title, date, priority, desc };
    } else {
      state.tasks.unshift({
        id: 't_' + Date.now(),
        title,
        date,
        priority,
        desc,
        completed: false
      });
    }
    saveState();
    closeModal('modal-task');
    renderAll();
  });
}

function openTaskModal(task = null) {
  document.getElementById('modal-task-title').textContent = task ? 'Edit Task' : 'New Task';
  document.getElementById('task-id').value = task ? task.id : '';
  document.getElementById('task-name').value = task ? task.title : '';
  document.getElementById('task-date').value = task ? (task.date || '') : todayStr();
  document.getElementById('task-priority').value = task ? task.priority : 'medium';
  document.getElementById('task-desc').value = task ? (task.desc || '') : '';
  document.getElementById('modal-task').classList.remove('hidden');
}

function renderTasks() {
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.completed).length;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-active').textContent = total - done;
  document.getElementById('stat-done').textContent = done;

  let filtered = state.tasks.filter(t => {
    if (activeTaskFilter === 'active') return !t.completed;
    if (activeTaskFilter === 'completed') return t.completed;
    if (activeTaskFilter === 'high') return t.priority === 'high';
    return true;
  });

  const list = document.getElementById('tasks-list');
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">No tasks match this view. Tap + to add one!</div>`;
    return;
  }

  list.innerHTML = filtered.map(t => `
    <div class="task-card ${t.completed ? 'completed' : ''}">
      <div class="task-check" onclick="toggleTask('${t.id}')">
        ${t.completed ? '&#10003;' : ''}
      </div>
      <div class="task-body" onclick="editTaskById('${t.id}')">
        <div class="task-title">${escapeHtml(t.title)}</div>
        ${t.desc ? `<div class="task-desc">${escapeHtml(t.desc)}</div>` : ''}
        <div class="task-meta">
          <span class="badge ${t.priority}">${t.priority}</span>
          ${t.date ? `<span style="font-size:0.75rem;color:var(--text-muted)">📅 ${t.date}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn" onclick="editTaskById('${t.id}')" title="Edit">✏️</button>
        <button class="action-btn" onclick="deleteTask('${t.id}')" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');
}

window.toggleTask = (id) => {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveState();
    renderAll();
  }
};

window.editTaskById = (id) => {
  const task = state.tasks.find(t => t.id === id);
  if (task) openTaskModal(task);
};

window.deleteTask = (id) => {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderAll();
};

/* ==================== 2. NOTES ==================== */
function setupNoteHandlers() {
  document.getElementById('note-search').addEventListener('input', renderNotes);

  document.querySelectorAll('#note-color-picker .color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('#note-color-picker .color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      selectedNoteColor = dot.dataset.color;
    });
  });

  document.getElementById('form-note').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('note-id').value;
    const title = document.getElementById('note-title').value.trim();
    const body = document.getElementById('note-body').value.trim();
    if (!title || !body) return;

    const updatedAt = new Date().toLocaleDateString();
    if (id) {
      const idx = state.notes.findIndex(n => n.id === id);
      if (idx > -1) state.notes[idx] = { ...state.notes[idx], title, body, color: selectedNoteColor, updatedAt };
    } else {
      state.notes.unshift({ id: 'n_' + Date.now(), title, body, color: selectedNoteColor, updatedAt });
    }
    saveState();
    closeModal('modal-note');
    renderNotes();
  });

  document.getElementById('delete-note-btn').addEventListener('click', () => {
    const id = document.getElementById('note-id').value;
    if (id) {
      state.notes = state.notes.filter(n => n.id !== id);
      saveState();
      closeModal('modal-note');
      renderNotes();
    }
  });
}

function openNoteModal(note = null) {
  document.getElementById('modal-note-title').textContent = note ? 'Edit Note' : 'New Note';
  document.getElementById('note-id').value = note ? note.id : '';
  document.getElementById('note-title').value = note ? note.title : '';
  document.getElementById('note-body').value = note ? note.body : '';
  selectedNoteColor = note ? (note.color || 'default') : 'default';

  document.querySelectorAll('#note-color-picker .color-dot').forEach(d => {
    d.classList.toggle('selected', d.dataset.color === selectedNoteColor);
  });

  document.getElementById('delete-note-btn').classList.toggle('hidden', !note);
  document.getElementById('modal-note').classList.remove('hidden');
}

function renderNotes() {
  const q = (document.getElementById('note-search').value || '').toLowerCase();
  const filtered = state.notes.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
  const grid = document.getElementById('notes-grid');

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">No notes found. Tap + to write a new note!</div>`;
    return;
  }

  grid.innerHTML = filtered.map(n => `
    <div class="note-card" data-color="${n.color || 'default'}" onclick="editNoteById('${n.id}')">
      <div>
        <h4>${escapeHtml(n.title)}</h4>
        <p>${escapeHtml(n.body)}</p>
      </div>
      <div class="note-date">${n.updatedAt || ''}</div>
    </div>
  `).join('');
}

window.editNoteById = (id) => {
  const note = state.notes.find(n => n.id === id);
  if (note) openNoteModal(note);
};

/* ==================== 3. PERSONAL CALENDAR ==================== */
function setupCalendarHandlers() {
  document.getElementById('cal-prev').addEventListener('click', () => {
    calCurrentDate.setMonth(calCurrentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('cal-next').addEventListener('click', () => {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById('add-event-inline-btn').addEventListener('click', () => {
    openEventModal(null, selectedCalendarDate);
  });

  document.getElementById('form-event').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('event-id').value;
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const color = document.getElementById('event-category').value;
    const notes = document.getElementById('event-notes').value.trim();

    if (!title || !date) return;

    if (id) {
      const idx = state.events.findIndex(ev => ev.id === id);
      if (idx > -1) state.events[idx] = { ...state.events[idx], title, date, time, color, notes };
    } else {
      state.events.push({ id: 'e_' + Date.now(), title, date, time, color, notes });
    }
    selectedCalendarDate = date;
    saveState();
    closeModal('modal-event');
    renderCalendar();
  });

  document.getElementById('delete-event-btn').addEventListener('click', () => {
    const id = document.getElementById('event-id').value;
    if (id) {
      state.events = state.events.filter(ev => ev.id !== id);
      saveState();
      closeModal('modal-event');
      renderCalendar();
    }
  });
}

function openEventModal(ev = null, defaultDate = todayStr()) {
  document.getElementById('modal-event-title').textContent = ev ? 'Edit Calendar Entry' : 'New Calendar Entry';
  document.getElementById('event-id').value = ev ? ev.id : '';
  document.getElementById('event-title').value = ev ? ev.title : '';
  document.getElementById('event-date').value = ev ? ev.date : defaultDate;
  document.getElementById('event-time').value = ev ? (ev.time || '09:00') : '09:00';
  document.getElementById('event-category').value = ev ? (ev.color || '#4f46e5') : '#4f46e5';
  document.getElementById('event-notes').value = ev ? (ev.notes || '') : '';
  document.getElementById('delete-event-btn').classList.toggle('hidden', !ev);
  document.getElementById('modal-event').classList.remove('hidden');
}

function renderCalendar() {
  const year = calCurrentDate.getFullYear();
  const month = calCurrentDate.getMonth();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('cal-month-year').textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayStr();

  const daysGrid = document.getElementById('cal-days');
  let html = '';

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day other-month"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = state.events.filter(e => e.date === dateIso);
    const dayTasks = state.tasks.filter(t => t.date === dateIso && !t.completed);

    const dotsHtml = [
      ...dayEvents.slice(0, 3).map(e => `<span class="cal-dot" style="background:${e.color}"></span>`),
      ...(dayTasks.length ? [`<span class="cal-dot" style="background:#f59e0b"></span>`] : [])
    ].join('');

    const cls = [
      'cal-day',
      dateIso === today ? 'today' : '',
      dateIso === selectedCalendarDate ? 'selected' : ''
    ].join(' ');

    html += `
      <div class="${cls}" onclick="selectCalDate('${dateIso}')">
        <span>${d}</span>
        <div class="cal-dots">${dotsHtml}</div>
      </div>
    `;
  }

  daysGrid.innerHTML = html;
  renderSelectedDayAgenda();
}

window.selectCalDate = (dateIso) => {
  selectedCalendarDate = dateIso;
  renderCalendar();
};

function renderSelectedDayAgenda() {
  document.getElementById('selected-date-label').textContent = `Schedule for ${selectedCalendarDate}`;
  const dayEvents = state.events
    .filter(e => e.date === selectedCalendarDate)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const dayTasks = state.tasks.filter(t => t.date === selectedCalendarDate);

  const container = document.getElementById('day-items-list');
  if (dayEvents.length === 0 && dayTasks.length === 0) {
    container.innerHTML = `<div class="empty-state">Nothing scheduled for this day. Tap "+ Add Event" to populate!</div>`;
    return;
  }

  const eventsHtml = dayEvents.map(ev => `
    <div class="task-card" style="border-left: 4px solid ${ev.color}" onclick="editEventById('${ev.id}')">
      <div class="task-body">
        <div class="task-title">${escapeHtml(ev.title)}</div>
        ${ev.notes ? `<div class="task-desc">${escapeHtml(ev.notes)}</div>` : ''}
        <div class="task-meta">
          <span style="font-size:0.76rem;font-weight:600;color:var(--primary)">🕒 ${ev.time || 'All Day'}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn">✏️</button>
      </div>
    </div>
  `).join('');

  const tasksHtml = dayTasks.map(t => `
    <div class="task-card ${t.completed ? 'completed' : ''}" onclick="editTaskById('${t.id}')">
      <div class="task-check" onclick="event.stopPropagation(); toggleTask('${t.id}')">
        ${t.completed ? '&#10003;' : ''}
      </div>
      <div class="task-body">
        <div class="task-title">[Task] ${escapeHtml(t.title)}</div>
      </div>
    </div>
  `).join('');

  container.innerHTML = eventsHtml + tasksHtml;
}

window.editEventById = (id) => {
  const ev = state.events.find(e => e.id === id);
  if (ev) openEventModal(ev);
};

/* ==================== MODAL & UTILS ==================== */
function setupModals() {
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}
