const authCard = document.querySelector('#auth-card');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const loginMessage = document.querySelector('#login-message');
const registerMessage = document.querySelector('#register-message');
const appMain = document.querySelector('#app-main');
const logoutBtn = document.querySelector('#logout-btn');

const activityForm = document.querySelector('#activity-form');
const activityMessage = document.querySelector('#activity-message');
const activityList = document.querySelector('#activity-list');
const activityListSection = document.querySelector('#activity-list-card');
const publicList = document.querySelector('#public-activity-list');
const activitySubmitButton = document.querySelector('#activity-submit');
const cancelEditButton = document.querySelector('#cancel-edit');
const activityShareCheckbox = document.querySelector('#is-public');
const dateInput = document.querySelector('#date');
const sportInput = document.querySelector('#sport');
const durationInput = document.querySelector('#duration');
const intensitySelect = document.querySelector('#intensity');
const notesInput = document.querySelector('#notes');
const photoInput = document.querySelector('#photo');
const activityFormSection = activityForm?.closest('section');
let activityFormToggleButton = null;
let activityFormBodyContainer = null;
const openActivityFormButton = document.querySelector('#open-activity-form-btn');

const weatherLocation = document.querySelector('.weather-location');
const weatherTemp = document.querySelector('.weather-temp');
const weatherCondition = document.querySelector('.weather-condition');
const weatherExtra = document.querySelector('.weather-extra');
const weatherUpdated = document.querySelector('.weather-updated');

const calendarLabel = document.querySelector('#calendar-label');
const calendarDays = document.querySelector('#calendar-days');
const calendarSummary = document.querySelector('#calendar-summary');
const calendarPrevButton = document.querySelector('#calendar-prev');
const calendarNextButton = document.querySelector('#calendar-next');

const loginUsernameInput = document.querySelector('#login-username');
const loginPasswordInput = document.querySelector('#login-password');
const registerUsernameInput = document.querySelector('#register-username');
const toggleHistoryButton = document.querySelector('#toggle-history-btn');

const today = new Date();

const state = {
  token: null,
  user: null,
  weather: null,
  activities: [],
  activitiesByDate: new Map(),
  publicFeed: [],
  editingActivityId: null,
  calendarMonth: new Date(today.getFullYear(), today.getMonth(), 1),
  selectedCalendarDate: null
};

let authMode = 'login';
const defaultCalendarMessage = 'Select a highlighted date to see a summary.';

function setAuthMode(mode) {
  authMode = mode;
  loginForm.hidden = mode !== 'login';
  registerForm.hidden = mode !== 'register';
  authTabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.mode === mode);
  });

  const unauthenticated = !document.body.classList.contains('is-authenticated');
  if (mode === 'login') {
    setMessage(registerMessage, '', null);
    if (unauthenticated && loginUsernameInput) {
      setTimeout(() => loginUsernameInput.focus(), 0);
    }
  } else {
    setMessage(loginMessage, '', null);
    if (registerUsernameInput) {
      setTimeout(() => registerUsernameInput.focus(), 0);
    }
  }
}

function setMessage(element, text, variant) {
  if (!element) return;
  element.textContent = text;
  element.className = 'form-message';
  if (variant) {
    element.classList.add(variant);
  }
}

function setActivityFormExpanded(expanded, { focusField = false, reason = 'user' } = {}) {
  if (!activityFormSection || !activityFormToggleButton) return;

  activityFormSection.classList.toggle('is-collapsed', !expanded);
  activityFormToggleButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  activityFormToggleButton.classList.toggle('primary', !expanded);
  activityFormToggleButton.classList.toggle('secondary', expanded);
  activityFormToggleButton.textContent = expanded ? '收起表單' : '新增紀錄';

  if (expanded && focusField) {
    const fieldForFocus =
      reason === 'edit'
        ? sportInput || dateInput
        : dateInput || sportInput || activityForm.querySelector('input, select, textarea');
    if (fieldForFocus) {
      setTimeout(() => fieldForFocus.focus(), 0);
    }
  }
}

function initializeActivityFormToggle() {
  if (!activityForm || !activityFormSection) return;
  activityFormSection.classList.add('activity-form-card', 'is-collapsed');
  if (!activityFormSection.id) {
    activityFormSection.id = 'activity-form-card';
  }

  const header = document.createElement('div');
  header.className = 'activity-form-header';

  const heading = activityFormSection.querySelector('h2');
  if (heading) {
    header.appendChild(heading);
  }

  activityFormToggleButton = document.createElement('button');
  activityFormToggleButton.id = 'toggle-activity-form';
  activityFormToggleButton.type = 'button';
  activityFormToggleButton.className = 'primary toggle-activity-form';
  activityFormToggleButton.setAttribute('aria-expanded', 'false');
  activityFormToggleButton.setAttribute('aria-controls', 'activity-form');
  activityFormToggleButton.textContent = '新增紀錄';
  header.appendChild(activityFormToggleButton);

  activityFormBodyContainer = document.createElement('div');
  activityFormBodyContainer.className = 'activity-form-body';
  activityFormSection.insertBefore(header, activityForm);
  activityFormSection.insertBefore(activityFormBodyContainer, activityForm);
  activityFormBodyContainer.appendChild(activityForm);

  activityFormToggleButton.addEventListener('click', () => {
    const isCollapsed = activityFormSection.classList.contains('is-collapsed');
    if (isCollapsed) {
      setMessage(activityMessage, '', null);
      setActivityFormExpanded(true, { focusField: true, reason: 'create' });
      return;
    }

    if (state.editingActivityId) {
      setMessage(activityMessage, '請先完成或取消編輯後再收起表單。', 'info');
      return;
    }

    resetActivityForm();
    setActivityFormExpanded(false);
  });

  setActivityFormExpanded(false);
}

function resetActivityForm({ keepMessage = false } = {}) {
  if (activityForm) {
    activityForm.reset();
    activityForm.dataset.mode = 'create';
  }
  if (activityShareCheckbox) {
    activityShareCheckbox.checked = false;
  }
  if (photoInput) {
    photoInput.value = '';
  }
  state.editingActivityId = null;
  if (activitySubmitButton) {
    activitySubmitButton.textContent = '儲存';
  }
  if (cancelEditButton) {
    cancelEditButton.hidden = true;
  }
  if (!keepMessage) {
    setMessage(activityMessage, '', null);
  }
}

function startEditing(activity) {
  state.editingActivityId = activity.id;
  if (activityForm) {
    activityForm.dataset.mode = 'edit';
  }
  setActivityFormExpanded(true, { focusField: true, reason: 'edit' });
  if (dateInput) {
    dateInput.value = activity.date || '';
  }
  if (sportInput) {
    sportInput.value = activity.sport || '';
  }
  if (durationInput) {
    durationInput.value = activity.durationMinutes ?? '';
  }
  if (intensitySelect) {
    intensitySelect.value = activity.intensity || 'moderate';
  }
  if (notesInput) {
    notesInput.value = activity.notes || '';
  }
  if (activityShareCheckbox) {
    activityShareCheckbox.checked = Boolean(activity.isPublic);
  }
  if (photoInput) {
    photoInput.value = '';
  }
  if (activitySubmitButton) {
    activitySubmitButton.textContent = '更新紀錄';
  }
  if (cancelEditButton) {
    cancelEditButton.hidden = false;
  }
  setMessage(
    activityMessage,
    'Edit mode: update the fields and submit. Leave the photo empty to keep the current one.',
    'info'
  );
  if (activityForm) {
    activityForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseISODate(value) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function renderCalendar() {
  if (!calendarDays) return;
  const monthStart = getMonthStart(state.calendarMonth || today);
  state.calendarMonth = monthStart;
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const startDay = monthStart.getDay();
  const label = `${year} / ${String(month + 1).padStart(2, '0')}`;

  if (calendarLabel) {
    calendarLabel.textContent = label;
  }

  const firstVisible = new Date(year, month, 1 - startDay);
  const fragment = document.createDocumentFragment();
  const todayIso = toISODate(today);

  calendarDays.innerHTML = '';

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(firstVisible);
    cellDate.setDate(firstVisible.getDate() + index);
    const iso = toISODate(cellDate);
    const isCurrentMonth = cellDate.getMonth() === month;
    const hasActivities = state.activitiesByDate.has(iso);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'calendar-day';
    button.dataset.date = iso;
    const labelText = `${iso}${hasActivities ? ', has activity' : ''}`;
    button.setAttribute('aria-label', labelText);

    if (!isCurrentMonth) button.classList.add('outside');
    if (iso === todayIso) button.classList.add('today');
    if (hasActivities) button.classList.add('has-activity');
    if (state.selectedCalendarDate === iso) button.classList.add('selected');

    const numberSpan = document.createElement('span');
    numberSpan.className = 'calendar-day-number';
    numberSpan.textContent = String(cellDate.getDate());
    button.appendChild(numberSpan);

    if (hasActivities) {
      const dot = document.createElement('span');
      dot.className = 'calendar-day-dot';
      dot.setAttribute('aria-hidden', 'true');
      button.appendChild(dot);
    }

    fragment.appendChild(button);
  }

  calendarDays.appendChild(fragment);
}

function updateCalendarSummary(dateIso) {
  if (!calendarSummary) return;
  if (!dateIso) {
    calendarSummary.textContent = defaultCalendarMessage;
    return;
  }
  const activities = state.activitiesByDate.get(dateIso) ?? [];
  if (!activities.length) {
    calendarSummary.textContent = `${dateIso}: no records.`;
    return;
  }
  const previews = activities.slice(0, 3).map((activity) => {
    const duration = Number(activity.durationMinutes) || 0;
    return `${activity.sport} (${duration} min)`;
  });
  if (activities.length > 3) {
    previews.push(`…${activities.length} entries`);
  }
  calendarSummary.textContent = `${dateIso}: ${previews.join(', ')}`;
}

function changeCalendarMonth(offset) {
  const base = getMonthStart(state.calendarMonth || today);
  const next = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  state.calendarMonth = next;
  if (offset !== 0) {
    state.selectedCalendarDate = null;
  }
  renderCalendar();
  updateCalendarSummary(state.selectedCalendarDate);
}

function selectCalendarDate(dateIso) {
  const parsed = parseISODate(dateIso);
  if (!parsed) return;
  state.selectedCalendarDate = dateIso;
  state.calendarMonth = getMonthStart(parsed);
  renderCalendar();
  updateCalendarSummary(dateIso);
}

function resetCalendarView() {
  state.calendarMonth = getMonthStart(today);
  state.selectedCalendarDate = null;
  state.activitiesByDate = new Map();
  renderCalendar();
  updateCalendarSummary(null);
}

function setWeatherPlaceholder(message = 'Sign in to see weather info.') {
  weatherLocation.textContent = 'Location: --';
  weatherTemp.textContent = 'Temperature: -- °C';
  weatherCondition.textContent = `Condition: ${message}`;
  weatherExtra.textContent = 'Humidity: --  |  Wind: -- km/h';
  weatherUpdated.textContent = 'Updated: --';
}

function setWeatherLoading() {
  weatherLocation.textContent = 'Location: --';
  weatherTemp.textContent = 'Temperature: loading...';
  weatherCondition.textContent = 'Condition: please wait';
  weatherExtra.textContent = 'Humidity: --  |  Wind: -- km/h';
  weatherUpdated.textContent = 'Updated: --';
}

function renderWeather(weather) {
  if (!weather) {
    setWeatherPlaceholder();
    return;
  }
  const location = weather.location ?? '--';
  const hasTemperature = typeof weather.temperatureC === 'number';
  const hasHumidity = typeof weather.humidity === 'number';
  const hasWind = typeof weather.windKph === 'number';
  const condition = weather.summary || weather.condition || 'Weather';
  const updatedAt = weather.lastUpdated
    ? new Date(weather.lastUpdated).toLocaleString()
    : '--';

  weatherLocation.textContent = `Location: ${location}`;
  weatherTemp.textContent = `Temperature: ${hasTemperature ? weather.temperatureC : '--'} °C`;
  weatherCondition.textContent = `Condition: ${condition}`;
  weatherExtra.textContent = `Humidity: ${
    hasHumidity ? `${Math.round(weather.humidity * 100)}%` : '--'
  }  |  Wind: ${hasWind ? weather.windKph : '--'} km/h`;
  weatherUpdated.textContent = `Updated: ${updatedAt}`;
}

function applyAuthView() {
  const isAuthenticated = Boolean(state.token);
  authCard.hidden = isAuthenticated;
  appMain.hidden = !isAuthenticated;
  document.body.classList.toggle('is-authenticated', isAuthenticated);

  if (!isAuthenticated) {
    setWeatherPlaceholder();
    resetCalendarView();
  }
}

function logout(reason) {
  state.token = null;
  state.user = null;
  state.weather = null;
  state.activities = [];
  state.activitiesByDate = new Map();
  state.publicFeed = [];
  state.editingActivityId = null;
  loginForm.reset();
  registerForm.reset();
  resetActivityForm();
  setActivityFormExpanded(false);
  resetCalendarView();
  setMessage(registerMessage, '', null);
  setMessage(loginMessage, '', null);
  if (activityListSection) {
    activityListSection.hidden = true;
  }
  if (toggleHistoryButton) {
    toggleHistoryButton.setAttribute('aria-expanded', 'false');
    toggleHistoryButton.textContent = 'Show Activity History';
  }
  if (activityList) {
    activityList.innerHTML = '';
  }
  if (publicList) {
    publicList.innerHTML = '';
  }
  setAuthMode('login');
  applyAuthView();
  setWeatherPlaceholder();
  if (reason) {
    setMessage(loginMessage, reason, 'error');
  }
}

async function authorizedFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  if (state.token) {
    headers.set('Authorization', `Bearer ${state.token}`);
  }
  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(path, { ...options, headers });
  if (response.status === 401) {
    logout('Session expired, please sign in again.');
    throw new Error('Unauthorized');
  }
  return response;
}

const api = {
  async register(payload) {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    return data.data;
  },

  async login(credentials) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Login failed');
    }
    return payload.data;
  },

  async getActivities() {
    const response = await authorizedFetch('/api/activities');
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error('Failed to load activities');
    }
    return payload.data ?? [];
  },

  async createActivity(formData) {
    const response = await authorizedFetch('/api/activities', {
      method: 'POST',
      body: formData
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to create activity');
    }
    return payload.data;
  },

  async updateActivity(id, formData) {
    const response = await authorizedFetch(`/api/activities/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: formData
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to update activity');
    }
    return payload.data;
  },

  async deleteActivity(id) {
    const response = await authorizedFetch(`/api/activities/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to delete activity');
    }
    return payload.data;
  },

  async getPublicActivities() {
    const response = await authorizedFetch('/api/activities/public');
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load public feed');
    }
    return payload.data ?? [];
  },

  async getWeather() {
    const response = await authorizedFetch('/api/weather');
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load weather');
    }
    return payload.data;
  }
};

function renderActivities(activities) {
  if (!activityList) return;
  activityList.innerHTML = '';
  if (!activities.length) {
    activityList.innerHTML = '<li>No records yet, add your first workout!</li>';
    return;
  }

  for (const activity of activities) {
    const item = document.createElement('li');
    const isPublic = Boolean(activity.isPublic);
    item.innerHTML = `
      ${
        activity.photoUrl
          ? `<img class="activity-photo" src="${activity.photoUrl}" alt="${activity.sport} photo" loading="lazy" />`
          : ''
      }
      <div class="activity-header">
        <span>${activity.date}</span>
        <span>${activity.sport}</span>
      </div>
      <div class="activity-meta">
        <span>時間：${activity.durationMinutes} 分鐘</span>
        <span>強度：${activity.intensity}</span>
      </div>
      <span class="sharing-tag ${isPublic ? 'public' : 'private'}">${isPublic ? '公開' : '私人'}</span>
      ${activity.notes ? `<p class="activity-notes">${activity.notes}</p>` : ''}
      <div class="activity-actions">
        <button type="button" class="secondary small" data-action="edit" data-id="${activity.id}">編輯</button>
        <button type="button" class="danger small" data-action="delete" data-id="${activity.id}">刪除</button>
      </div>
    `;
    activityList.appendChild(item);
  }
}

function renderPublicActivities(activities) {
  if (!publicList) return;
  publicList.innerHTML = '';
  if (!activities.length) {
    publicList.innerHTML = '<li>No one has shared an activity yet. Be the first!</li>';
    return;
  }

  for (const activity of activities) {
    const item = document.createElement('li');
    const isPublic = Boolean(activity.isPublic);
    const ownerName = activity.ownerName || 'Anonymous';
    item.innerHTML = `
      ${
        activity.photoUrl
          ? `<img class="activity-photo" src="${activity.photoUrl}" alt="${activity.sport} photo" loading="lazy" />`
          : ''
      }
      <div class="activity-header">
        <span>${activity.date}</span>
        <span>${activity.sport}</span>
      </div>
      <div class="activity-meta">
        <span>時間：${activity.durationMinutes} 分鐘</span>
        <span>強度：${activity.intensity}</span>
      </div>
      <span class="sharing-tag ${isPublic ? 'public' : 'private'}">${isPublic ? '公開' : '私人'}</span>
      <p class="activity-owner">分享者：${ownerName}</p>
      ${activity.notes ? `<p class="activity-notes">${activity.notes}</p>` : ''}
    `;
    publicList.appendChild(item);
  }
}

async function refreshActivities() {
  if (!state.token) return;
  try {
    const activities = await api.getActivities();
    state.activities = activities;

    const byDate = new Map();
    for (const activity of activities) {
      if (!activity.date) continue;
      if (!byDate.has(activity.date)) {
        byDate.set(activity.date, []);
      }
      byDate.get(activity.date).push(activity);
    }
    state.activitiesByDate = byDate;

    if (
      state.editingActivityId &&
      !activities.some((activity) => activity.id === state.editingActivityId)
    ) {
      resetActivityForm({ keepMessage: true });
    }

    renderActivities(activities);
    renderCalendar();
    updateCalendarSummary(state.selectedCalendarDate);
  } catch (err) {
    if (err.message === 'Unauthorized') return;
    console.error(err);
    activityList.innerHTML = '<li class="error">Failed to load activities. Please try again.</li>';
  }
}

async function refreshPublicActivities() {
  if (!state.token || !publicList) return;
  try {
    const activities = await api.getPublicActivities();
    state.publicFeed = activities;
    renderPublicActivities(activities);
  } catch (err) {
    if (err.message === 'Unauthorized') return;
    console.error(err);
    publicList.innerHTML = '<li class="error">Failed to load the community feed. Please try again.</li>';
  }
}

async function refreshWeather() {
  if (!state.token) return;
  try {
    setWeatherLoading();
    const weather = await api.getWeather();
    state.weather = weather;
    renderWeather(weather);
  } catch (err) {
    if (err.message === 'Unauthorized') return;
    console.error(err);
    setWeatherPlaceholder('Unable to load weather data.');
  }
}

async function handleActivityListClick(event) {
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;

  const { action, id } = actionButton.dataset;
  if (!action || !id) return;

  const activity = state.activities.find((item) => item.id === id);
  if (!activity) return;

  if (action === 'edit') {
    event.preventDefault();
    startEditing(activity);
    return;
  }

  if (action === 'delete') {
    event.preventDefault();
    const confirmed = window.confirm('Delete this activity?');
    if (!confirmed) return;
    try {
      setMessage(activityMessage, 'Deleting...', null);
      await api.deleteActivity(id);
      if (state.editingActivityId === id) {
        resetActivityForm();
      }
      setMessage(activityMessage, 'Activity deleted.', 'success');
      await Promise.all([refreshActivities(), refreshPublicActivities()]);
    } catch (err) {
      if (err.message === 'Unauthorized') return;
      console.error(err);
      setMessage(
        activityMessage,
        err.message || 'Delete failed. Please try again.',
        'error'
      );
    }
  }
}

authTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    if (tab.dataset.mode) {
      setAuthMode(tab.dataset.mode);
    }
  });
});

if (calendarPrevButton) {
  calendarPrevButton.addEventListener('click', () => changeCalendarMonth(-1));
}

if (calendarNextButton) {
  calendarNextButton.addEventListener('click', () => changeCalendarMonth(1));
}

if (calendarDays) {
  calendarDays.addEventListener('click', (event) => {
    const dayButton = event.target.closest('.calendar-day');
    if (!dayButton) return;
    selectCalendarDate(dayButton.dataset.date);
  });
}

initializeActivityFormToggle();

if (openActivityFormButton) {
  openActivityFormButton.addEventListener('click', () => {
    if (!activityFormSection) return;
    setActivityFormExpanded(true, { focusField: true, reason: 'user' });
    activityFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

if (toggleHistoryButton && activityListSection) {
  toggleHistoryButton.addEventListener('click', () => {
    const willShow = activityListSection.hidden;
    activityListSection.hidden = !willShow;
    toggleHistoryButton.setAttribute('aria-expanded', willShow ? 'true' : 'false');
    toggleHistoryButton.textContent = willShow ? 'Hide Activity History' : 'Show Activity History';
  });
}

if (activityList) {
  activityList.addEventListener('click', handleActivityListClick);
}

if (cancelEditButton) {
  cancelEditButton.addEventListener('click', () => {
    resetActivityForm();
    setMessage(activityMessage, 'Edit cancelled.', 'info');
  });
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const credentials = Object.fromEntries(formData.entries());
  try {
    setMessage(loginMessage, 'Signing in...', null);
    const data = await api.login(credentials);
    state.token = data.token;
    state.user = data.user;
    setMessage(loginMessage, '', null);
    loginForm.reset();
    applyAuthView();
    await Promise.all([refreshActivities(), refreshPublicActivities(), refreshWeather()]);
  } catch (err) {
    console.error(err);
    setMessage(loginMessage, err.message, 'error');
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const payload = Object.fromEntries(formData.entries());
  if (payload.displayName) {
    payload.displayName = payload.displayName.trim();
  }
  const normalizedUsername = (payload.username || '').trim();
  payload.username = normalizedUsername;

  try {
    setMessage(registerMessage, 'Registering...', null);
    const data = await api.register(payload);
    const successMessage = data?.message || 'Registration successful. Please sign in.';
    registerForm.reset();
    loginForm.reset();
    loginUsernameInput.value = normalizedUsername;
    setAuthMode('login');
    setMessage(loginMessage, successMessage, 'success');
    setTimeout(() => loginPasswordInput.focus(), 0);
  } catch (err) {
    console.error(err);
    setMessage(registerMessage, err.message, 'error');
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    logout();
    if (loginUsernameInput) {
      loginUsernameInput.focus();
    }
  });
}

activityForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(activityForm);
  const durationValue = Number(formData.get('durationMinutes'));
  const isEditing = Boolean(state.editingActivityId);

  if (Number.isNaN(durationValue) || durationValue <= 0) {
    setMessage(activityMessage, 'Enter a valid duration (minutes).', 'error');
    return;
  }

  const sportValue = (formData.get('sport') || '').toString().trim();
  const notesValue = (formData.get('notes') || '').toString().trim();
  if (!sportValue) {
    setMessage(activityMessage, 'Enter a sport/activity.', 'error');
    return;
  }

  formData.set('durationMinutes', String(durationValue));
  formData.set('sport', sportValue);
  formData.set('notes', notesValue);
  formData.set('isPublic', activityShareCheckbox?.checked ? 'true' : 'false');

  try {
    setMessage(activityMessage, isEditing ? 'Updating...' : 'Saving...', null);
    if (isEditing) {
      await api.updateActivity(state.editingActivityId, formData);
      setMessage(activityMessage, 'Activity updated.', 'success');
    } else {
      await api.createActivity(formData);
      setMessage(activityMessage, 'Activity saved.', 'success');
    }
    resetActivityForm({ keepMessage: true });
    await Promise.all([refreshActivities(), refreshPublicActivities()]);
  } catch (err) {
    if (err.message === 'Unauthorized') return;
    console.error(err);
    setMessage(activityMessage, err.message, 'error');
  }
});

resetCalendarView();
resetActivityForm({ keepMessage: true });
setAuthMode('login');
applyAuthView();
