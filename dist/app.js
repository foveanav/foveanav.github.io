/* Local static page: all media and scientific results are supplied assets. */
const project = window.FOVEANAV;
const byId = (id) => document.getElementById(id);
const percent = (value) => `${value}%`;
const videos = [...document.querySelectorAll('video')];
const hero = byId('teaser-video');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let autoPreview = !reducedMotion.matches && !navigator.connection?.saveData;
let automaticHeroPauses = 0;
const pendingSeeks = new Map();
videos.forEach((video) => {
  const message = document.createElement('p');
  message.className = 'media-error';
  message.setAttribute('role', 'status');
  message.hidden = true;
  const link = document.createElement('a');
  link.textContent = 'Open the video directly ↗';
  message.append(document.createTextNode('This video could not be loaded. '), link);
  video.after(message);
  const showError = () => {
    link.href = video.querySelector('source').src;
    message.hidden = false;
  };
  video.addEventListener('error', showError);
  video.querySelector('source').addEventListener('error', showError);
  video.addEventListener('loadstart', () => { message.hidden = true; });
});
function cancelSeek(video) {
  const seek = pendingSeeks.get(video);
  if (seek) video.removeEventListener('loadedmetadata', seek);
  pendingSeeks.delete(video);
}
function pausePreviewAutomatically() {
  if (hero.paused) return;
  automaticHeroPauses += 1;
  hero.pause();
}

videos.forEach((active) => active.addEventListener('play', () => {
  if (active.paused) return; // A stopped clip may still have a queued play event.
  videos.forEach((other) => { if (other !== active) { cancelSeek(other); other.pause(); } });
  if (active !== hero) autoPreview = false;
}));
const updatePreviewButton = () => { byId('teaser-toggle').textContent = hero.paused ? 'Play preview' : 'Pause preview'; };
hero.addEventListener('play', updatePreviewButton);
hero.addEventListener('pause', () => {
  if (automaticHeroPauses) automaticHeroPauses -= 1;
  else autoPreview = false; // Native controls must also disable automatic restart.
  updatePreviewButton();
});
byId('teaser-toggle').addEventListener('click', () => {
  autoPreview = false;
  if (hero.paused) hero.play().catch(() => {}); else hero.pause();
});
// Only the muted introduction may auto-play; respect motion and data preferences.
new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) pausePreviewAutomatically();
  else if (autoPreview && !document.hidden) hero.play().catch(() => {});
}, {threshold: 0.35}).observe(hero);
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) { autoPreview = false; hero.pause(); }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) videos.forEach((video) => {
    cancelSeek(video);
    if (video === hero) pausePreviewAutomatically(); else video.pause();
  });
});
const mediaObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.preload = 'metadata';
    observer.unobserve(entry.target);
  });
}, {rootMargin: '250px'});
videos.filter((video) => video !== hero && video.id !== 'overview-video').forEach((video) => mediaObserver.observe(video));

const viewButtons = [...document.querySelectorAll('[data-player]')];
viewButtons.forEach((button) => button.addEventListener('click', () => {
  if (button.getAttribute('aria-pressed') === 'true') return;
  const video = byId(button.dataset.player);
  cancelSeek(video);
  video.pause();
  video.poster = `assets/posters/${button.dataset.src}.webp`;
  video.querySelector('source').src = `assets/media/${button.dataset.src}.mp4`;
  video.querySelector('a').href = `assets/media/${button.dataset.src}.mp4`;
  video.height = Number(button.dataset.height);
  video.setAttribute('aria-label', `${video.id.startsWith('forest') ? 'Forest' : 'Obstacle'} comparison: ${button.textContent.toLowerCase()}, FoveaNav and full-image BC`);
  viewButtons.filter((other) => other.dataset.player === button.dataset.player).forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
  if (video.id === 'obstacle-video') byId('obstacle-speed').textContent = button.dataset.view === 'external' ? 'Speed labels retained · separate trials' : '1× playback · separate trial excerpts';
  video.load(); // Each view is a selected excerpt; switching restarts the clip.
}));
document.querySelectorAll('[data-seek-player]').forEach((button) => button.addEventListener('click', () => {
  const video = byId(button.dataset.seekPlayer);
  videos.forEach((other) => { cancelSeek(other); if (other !== video) other.pause(); });
  autoPreview = false;
  const seek = () => {
    cancelSeek(video);
    video.currentTime = Math.max(0, Math.min(Number(button.dataset.time), video.duration - 0.05));
    video.play().catch(() => {});
  };
  if (video.readyState >= 1) seek();
  else {
    pendingSeeks.set(video, seek);
    video.addEventListener('loadedmetadata', seek, {once: true});
    video.load();
  }
  video.scrollIntoView({block: 'center', behavior: reducedMotion.matches ? 'instant' : 'smooth'});
}));
const dialog = byId('overview-dialog');
const overview = byId('overview-video');
const figureDialog = byId('figure-dialog');
const modalState = new WeakMap();
function openModal(modal, opener) {
  if (document.querySelector('dialog[open]')) return false;
  autoPreview = false;
  videos.forEach((video) => { cancelSeek(video); video.pause(); });
  modalState.set(modal, {opener, overflow: document.documentElement.style.overflow});
  document.documentElement.style.overflow = 'hidden';
  modal.showModal();
  return true;
}
document.querySelectorAll('[data-open-overview]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  if (!openModal(dialog, link)) return;
  const source = overview.querySelector('source');
  if (!source.getAttribute('src')) { source.src = source.dataset.src; overview.load(); }
  overview.play().catch(() => {}); // Native controls remain available if playback is blocked.
}));
byId('close-overview').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => overview.pause());
document.querySelectorAll('[data-open-figure]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  if (!openModal(figureDialog, link)) return;
  byId('figure-title').textContent = link.dataset.figureTitle;
  byId('figure-image').src = link.href;
  byId('figure-image').alt = link.querySelector('img').alt;
  byId('figure-original').href = link.href;
}));
byId('close-figure').addEventListener('click', () => figureDialog.close());
[dialog, figureDialog].forEach((modal) => {
  modal.addEventListener('close', () => {
    const state = modalState.get(modal);
    document.documentElement.style.overflow = state.overflow;
    state.opener.focus({preventScroll: true});
  });
  modal.addEventListener('click', (event) => {
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
  });
});

const chart = byId('results-chart');
const tbody = byId('results-table');
function addTableRow(task, setting, n, ours, bc) {
  const row = document.createElement('tr');
  [task.title, setting, n, ours, bc].forEach((value, index) => {
    const cell = document.createElement(index === 0 ? 'th' : 'td');
    if (index === 0) cell.scope = 'row';
    if (index === 3) cell.className = 'ours';
    cell.textContent = value;
    row.append(cell);
  });
  tbody.append(row);
}
project.tasks.forEach((task) => {
  if (task.setting === 'OOD') {
    const row = document.createElement('div');
    row.className = 'chart-row';
    row.setAttribute('role', 'listitem');
    const label = document.createElement('div');
    label.className = 'chart-label';
    const title = document.createElement('strong'); title.textContent = task.short;
    const note = document.createElement('span'); note.textContent = `n = ${task.n}`;
    label.append(title, note); row.append(label);
    const bars = document.createElement('div'); bars.className = 'chart-bars';
    bars.setAttribute('role', 'img');
    bars.setAttribute('aria-label', `FoveaNav: ${percent(task.ours)}; BC: ${percent(task.bc)}`);
    [['ours',task.ours], ['baseline',task.bc]].forEach(([type,value]) => {
      const track = document.createElement('div'); track.className = `bar-track ${type}`;
      const fill = document.createElement('span'); fill.className = 'bar-fill'; fill.style.width = percent(value);
      const number = document.createElement('span'); number.className = 'bar-value'; number.textContent = percent(value);
      track.append(fill, number); bars.append(track);
    });
    row.append(bars); chart.append(row);
  }
  if (task.idResult) addTableRow(task, 'ID', ...task.idResult);
  addTableRow(task, task.setting, task.n, task.ours, task.bc);
});
document.querySelectorAll('.task-stat').forEach((container) => {
  const task = project.tasks.find((item) => item.id === container.dataset.task);
  const pair = document.createElement('div'); pair.className = 'stat-pair';
  [['FoveaNav','ours',task.ours], ['BC','baseline',task.bc]].forEach(([label,style,value]) => {
    const item = document.createElement('span'); item.className = style;
    const number = document.createElement('b'); number.textContent = percent(value);
    item.append(number, document.createTextNode(label)); pair.append(item);
  });
  const note = document.createElement('p'); note.className = 'small-note';
  note.textContent = `${task.setting} success rate · ${task.n} trials per method`;
  container.append(pair, note);
});
// Metadata is intentionally absent until the authors approve it for publication.
if (project.authors.length) {
  const container = byId("authors");
  project.authors.forEach((author) => {
    const item = document.createElement(author.url ? "a" : "span");
    item.textContent = author.name;
    if (author.url) item.href = author.url;
    if (author.affiliations?.length) {
      const indices = document.createElement("sup");
      indices.textContent = author.affiliations.join(",");
      item.append(indices);
    }
    container.append(item);
  });
  container.hidden = false;
}
if (project.affiliations.length) {
  byId("affiliations").textContent = project.affiliations.map((name, index) => `${index + 1} ${name}`).join(" · ");
  byId("affiliations").hidden = false;
}
Object.entries(project.links).forEach(([name, url]) => {
  if (!url) return;
  const link = document.createElement("a");
  link.className = "button button-light";
  link.href = url;
  link.textContent = name === "arxiv" ? "arXiv" : "Code";
  byId("resource-links").append(link);
});
if (project.citation) {
  byId("citation-text").textContent = project.citation;
  byId("citation").hidden = false;
}
