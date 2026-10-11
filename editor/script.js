/* =========================================================
   Cod-Hestudio · Editor de código web
   Persistencia: IndexedDB (proyectos) + localStorage (tema y plugins)
   Sistema de plugins: JsPlugins (rutas externas) + hooks + slots UI
   ========================================================= */

// ---------- Config ----------
const ICONS = [
  'folder', 'code-2', 'rocket', 'globe', 'gamepad-2', 'palette',
  'database', 'bot', 'star', 'heart', 'zap', 'book',
];

const MONACO_PATH = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs';
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.cache'];

const DB_NAME = 'cod-hestudio';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const LS_THEME_KEY = 'cod-hestudio-theme';
const LS_PLUGINS_KEY = 'cod-hestudio-active-plugins';

// ---------- Estado ----------
const state = {
  projects: [],
  activeProject: null,
  openTabs: [],
  activeTab: null,
  pendingHandle: null,
  monacoEditor: null,
  editorReady: false,
  monacoTheme: 'cod-light',
  saving: false,
  db: null,
};

// ---------- Refs ----------
const $ = (s) => document.querySelector(s);
const projectsList  = $('#projectsList');
const projectsEmpty = $('#projectsEmpty');
const filetreeList  = $('#filetreeList');
const filetreeEmpty = $('#filetreeEmpty');
const filetreeTitle = $('#filetreeTitle');
const welcomeEl     = $('#welcome');
const editorWrap    = $('#editorWrap');
const tabsBar       = $('#tabsBar');
const statusText    = $('#statusText');
const statusFile    = $('#statusFile');
const modal         = $('#modal');
const iconPicker    = $('#iconPicker');
const saveBtn       = $('#saveBtn');
const saveAllBtn    = $('#saveAllBtn');
const pluginsBar    = $('#pluginsBar');
const storeModal    = $('#storeModal');
const storeGrid     = $('#storeGrid');

// =========================================================
// HELPERS BÁSICOS
// =========================================================
function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let statusTimer;
function setStatus(msg, sticky = false) {
  statusText.textContent = msg;
  clearTimeout(statusTimer);
  if (!sticky && !/^(Error|Guardado|Sin cambios)/.test(msg)) {
    statusTimer = setTimeout(() => setStatus('Listo', true), 1800);
  }
}

function detectLanguage(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    html: 'html', htm: 'html',
    css: 'css', scss: 'scss', less: 'less',
    json: 'json',
    md: 'markdown', markdown: 'markdown',
    py: 'python', java: 'java',
    c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cc: 'cpp',
    cs: 'csharp', go: 'go', rs: 'rust',
    php: 'php', rb: 'ruby',
    sh: 'shell', bash: 'shell',
    yml: 'yaml', yaml: 'yaml',
    xml: 'xml', svg: 'xml',
    sql: 'sql', vue: 'html', txt: 'plaintext',
  };
  return map[ext] || 'plaintext';
}

function iconForFile(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    js: 'file-code', mjs: 'file-code', cjs: 'file-code',
    ts: 'file-code', jsx: 'file-code', tsx: 'file-code',
    html: 'file-code-2', htm: 'file-code-2',
    css: 'palette', scss: 'palette', less: 'palette',
    json: 'braces',
    md: 'file-text', markdown: 'file-text', txt: 'file-text',
    png: 'image', jpg: 'image', jpeg: 'image', svg: 'image', gif: 'image', webp: 'image',
    py: 'file-code', java: 'file-code', go: 'file-code', rs: 'file-code',
  };
  return map[ext] || 'file';
}

// =========================================================
// INDEXEDDB
// =========================================================
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE_PROJECTS)) {
        d.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGetAll(store) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function dbPut(store, value) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbDelete(store, key) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function loadSavedProjects() {
  try {
    const records = await dbGetAll(STORE_PROJECTS);
    for (const rec of records) {
      let needsPermission = true;
      try {
        const perm = await rec.handle.queryPermission({ mode: 'readwrite' });
        needsPermission = perm !== 'granted';
      } catch {}

      state.projects.push({
        id: rec.id, name: rec.name, icon: rec.icon,
        handle: rec.handle, tree: [], needsPermission,
      });
    }
  } catch (err) {
    console.error('Error cargando proyectos:', err);
  }
}

async function persistProject(p) {
  try {
    await dbPut(STORE_PROJECTS, {
      id: p.id, name: p.name, icon: p.icon, handle: p.handle,
    });
  } catch (err) {
    console.error('Error guardando proyecto:', err);
  }
}

// =========================================================
// SISTEMA DE PLUGINS — Hooks
// =========================================================
const __hooks = new Map();

function onHook(name, fn) {
  if (typeof fn !== 'function') return () => {};
  if (!__hooks.has(name)) __hooks.set(name, new Set());
  __hooks.get(name).add(fn);
  return () => offHook(name, fn);
}

function offHook(name, fn) {
  const set = __hooks.get(name);
  if (!set) return;
  set.delete(fn);
  if (set.size === 0) __hooks.delete(name);
}

function emitHook(name, ...args) {
  const set = __hooks.get(name);
  if (!set) return;
  for (const fn of [...set]) {
    try { fn(...args); }
    catch (e) { console.error(`[hook:${name}]`, e); }
  }
}

// =========================================================
// SISTEMA DE PLUGINS — Slots UI: Status bar
// =========================================================
let __statusSeq = 0;

function _addStatusItem({ id, title, text, icon, onClick }) {
  const uid = id || `status-${++__statusSeq}`;
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'statusbar-plugin-item';
  el.title = title || '';
  el.innerHTML = `
    ${icon ? `<i data-lucide="${icon}"></i>` : ''}
    <span>${escapeHtml(text || '')}</span>
  `;
  if (typeof onClick === 'function') el.addEventListener('click', onClick);

  const container = $('#statusbarPlugins');
  if (container) container.appendChild(el);
  refreshIcons();

  return {
    id: uid, el,
    update(patch) {
      const span = el.querySelector('span');
      if (patch.text !== undefined && span) span.textContent = patch.text;
      if (patch.title !== undefined) el.title = patch.title;
      if (patch.icon !== undefined) {
        const ic = el.querySelector('i');
        if (ic) { ic.setAttribute('data-lucide', patch.icon); refreshIcons(); }
      }
    },
    remove() { el.remove(); },
  };
}

// =========================================================
// SISTEMA DE PLUGINS — Slots UI: Toolbar
// =========================================================
let __toolbarSeq = 0;

function _addToolbarItem({ id, title, icon, onClick }) {
  const uid = id || `toolbar-${++__toolbarSeq}`;
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'btn-icon';
  el.title = title || '';
  el.innerHTML = `<i data-lucide="${icon || 'puzzle'}"></i>`;
  if (typeof onClick === 'function') el.addEventListener('click', onClick);

  const container = $('#toolbarPlugins');
  if (container) container.appendChild(el);
  refreshIcons();

  return {
    id: uid, el,
    update(patch) {
      if (patch.title !== undefined) el.title = patch.title;
      if (patch.icon !== undefined) {
        const ic = el.querySelector('i');
        if (ic) { ic.setAttribute('data-lucide', patch.icon); refreshIcons(); }
      }
    },
    remove() { el.remove(); },
  };
}

// =========================================================
// PROMPT MODAL (reutilizable)
// =========================================================
function uiPrompt({ title = 'Nombre', desc = '', placeholder = '', defaultValue = '' } = {}) {
  return new Promise((resolve) => {
    const pModal = $('#promptModal');
    const input = $('#promptInput');
    const okBtn = $('#promptOk');
    const cancelBtn = $('#promptCancel');

    $('#promptTitle').textContent = title;
    $('#promptDesc').textContent = desc;
    input.placeholder = placeholder;
    input.value = defaultValue;

    let resolved = false;
    const finish = (val) => {
      if (resolved) return;
      resolved = true;
      pModal.classList.add('hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      input.onkeydown = null;
      pModal.onclick = null;
      resolve(val);
    };

    okBtn.onclick = () => finish(input.value.trim() || null);
    cancelBtn.onclick = () => finish(null);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') finish(input.value.trim() || null);
      if (e.key === 'Escape') finish(null);
    };
    pModal.onclick = (e) => { if (e.target === pModal) finish(null); };

    pModal.classList.remove('hidden');
    setTimeout(() => { input.focus(); input.select(); }, 60);
  });
}

// =========================================================
// ÁRBOL: helpers de búsqueda y creación
// =========================================================
function findNodeByPath(nodes, path) {
  for (const n of nodes) {
    if (n.path === path) return n;
    if (n.kind === 'directory' && n.children?.length && path.startsWith(n.path + '/')) {
      const found = findNodeByPath(n.children, path);
      if (found) return found;
    }
  }
  return null;
}

function validateName(name) {
  if (!name) throw new Error('Nombre vacío');
  if (/[\\\/]/.test(name)) throw new Error('No se permiten / ni \\');
  if (name === '.' || name === '..') throw new Error('Nombre inválido');
  return name;
}

async function resolveParentHandle(parentPath) {
  if (!state.activeProject) throw new Error('No hay proyecto activo');
  if (!parentPath) return state.activeProject.handle;

  const found = findNodeByPath(state.activeProject.tree, parentPath);
  if (!found || found.kind !== 'directory') throw new Error('Carpeta padre no encontrada');
  return found.handle;
}

async function createFolder(parentPath, name) {
  name = validateName(String(name).trim());
  const parent = await resolveParentHandle(parentPath);

  await parent.getDirectoryHandle(name, { create: true });

  state.activeProject.tree = await readDirectory(state.activeProject.handle);
  renderFileTree();
  emitHook('tree:refresh', state.activeProject);
  return true;
}

async function createFile(parentPath, name, content = '') {
  name = validateName(String(name).trim());
  const parent = await resolveParentHandle(parentPath);

  const fh = await parent.getFileHandle(name, { create: true });
  const writable = await fh.createWritable();
  await writable.write(content);
  await writable.close();

  state.activeProject.tree = await readDirectory(state.activeProject.handle);
  renderFileTree();
  emitHook('tree:refresh', state.activeProject);
  return true;
}

async function refreshFileTreeNow() {
  if (!state.activeProject) return;
  state.activeProject.tree = await readDirectory(state.activeProject.handle);
  renderFileTree();
  emitHook('tree:refresh', state.activeProject);
}

// =========================================================
// SISTEMA DE PLUGINS — Manager
// =========================================================
const pluginManager = {
  registry: new Map(),
  active: new Map(),

  register(plugin) {
    if (!plugin || !plugin.id || !plugin.name) {
      console.warn('[plugins] plugin inválido (falta id o name)', plugin);
      return false;
    }
    this.registry.set(plugin.id, plugin);
    renderPluginsBar();
    renderStore();
    return true;
  },

  unregister(id) {
    if (this.active.has(id)) this.deactivate(id);
    this.registry.delete(id);
    renderPluginsBar();
    renderStore();
  },

  isActive(id) { return this.active.has(id); },

  activate(id) {
    if (this.active.has(id)) return true;
    const plugin = this.registry.get(id);
    if (!plugin) { console.warn(`[plugins] no existe: ${id}`); return false; }

    const cleanups = [];
    const ctx = createPluginContext(plugin, cleanups);

    try {
      plugin.activate?.(ctx);
    } catch (e) {
      console.error(`[plugin:${id}] error al activar`, e);
      cleanups.forEach(fn => { try { fn(); } catch {} });
      return false;
    }

    this.active.set(id, { plugin, cleanups });
    this.persist();
    emitHook('plugin:activated', id, plugin);
    renderPluginsBar();
    renderStore();
    return true;
  },

  deactivate(id) {
    const entry = this.active.get(id);
    if (!entry) return false;
    const { plugin, cleanups } = entry;

    try { plugin.deactivate?.(); }
    catch (e) { console.error(`[plugin:${id}] error al desactivar`, e); }

    cleanups.forEach(fn => { try { fn(); } catch {} });

    this.active.delete(id);
    this.persist();
    emitHook('plugin:deactivated', id, plugin);
    renderPluginsBar();
    renderStore();
    return true;
  },

  toggle(id) { return this.isActive(id) ? this.deactivate(id) : this.activate(id); },

  persist() {
    try {
      localStorage.setItem(LS_PLUGINS_KEY, JSON.stringify([...this.active.keys()]));
    } catch {}
  },

  restore() {
    try {
      const ids = JSON.parse(localStorage.getItem(LS_PLUGINS_KEY) || '[]');
      for (const id of ids) {
        if (this.registry.has(id)) this.activate(id);
      }
    } catch (e) {
      console.error('[plugins] error restaurando', e);
    }
  },
};

// =========================================================
// SISTEMA DE PLUGINS — Contexto
// =========================================================
function createPluginContext(plugin, cleanups) {
  const storePrefix = `cod-hestudio-plugin:${plugin.id}:`;

  return {
    id: plugin.id,
    version: plugin.version || '1.0.0',
    state,

    actions: {
      openFile, closeTab, saveCurrentFile, saveAllFiles, selectProject,
      getActiveTab: () => state.openTabs.find(t => t.path === state.activeTab) || null,
      getActiveProject: () => state.activeProject,
      getOpenTabs: () => [...state.openTabs],
      getEditor: () => state.monacoEditor,
      getMonaco: () => (window.monaco || null),
      setStatus,

      // Árbol de archivos
      createFolder,
      createFile,
      refreshFileTree: refreshFileTreeNow,
      findNodeByPath: (path) => findNodeByPath(state.activeProject?.tree || [], path),
    },

    ui: {
      addStatusItem: (item) => {
        const handle = _addStatusItem(item);
        cleanups.push(handle.remove);
        return handle;
      },
      addToolbarItem: (item) => {
        const handle = _addToolbarItem(item);
        cleanups.push(handle.remove);
        return handle;
      },
      prompt: uiPrompt,
      setAccent: (color) => {
        const root = document.documentElement;
        const prev = root.style.getPropertyValue('--accent');
        root.style.setProperty('--accent', color);
        cleanups.push(() => {
          if (prev) root.style.setProperty('--accent', prev);
          else root.style.removeProperty('--accent');
        });
      },
    },

    storage: {
      get(key, fallback = null) {
        try {
          const raw = localStorage.getItem(storePrefix + key);
          return raw == null ? fallback : JSON.parse(raw);
        } catch { return fallback; }
      },
      set(key, value) {
        try { localStorage.setItem(storePrefix + key, JSON.stringify(value)); } catch {}
      },
      remove(key) {
        try { localStorage.removeItem(storePrefix + key); } catch {}
      },
    },

    on: (name, fn) => {
      const off = onHook(name, fn);
      cleanups.push(off);
      return off;
    },

    cleanup: (fn) => { if (typeof fn === 'function') cleanups.push(fn); },
    log: (...args) => console.log(`[${plugin.id}]`, ...args),
  };
}

// =========================================================
// BARRA DE PLUGINS ACTIVOS
// =========================================================
function renderPluginsBar() {
  if (!pluginsBar) return;
  pluginsBar.innerHTML = '';

  const actives = [...pluginManager.active.values()].map(e => e.plugin);

  if (actives.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'plugins-bar-empty';
    empty.innerHTML = `<i data-lucide="puzzle"></i><span>Sin plugins activos · abrí la tienda para instalar</span>`;
    empty.addEventListener('click', openStore);
    pluginsBar.appendChild(empty);
    refreshIcons();
    return;
  }

  actives.forEach(p => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'plugin-chip active';
    chip.dataset.pluginId = p.id;
    chip.title = p.name;
    chip.innerHTML = `<i data-lucide="${p.icon || 'puzzle'}"></i>`;
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      openPluginPopover(p, chip);
    });
    pluginsBar.appendChild(chip);
  });

  refreshIcons();
}

// =========================================================
// POPOVER MINI DE PLUGIN
// =========================================================
const pluginPopover = $('#pluginPopover');
let currentPopoverPluginId = null;

function openPluginPopover(plugin, anchorEl) {
  if (!pluginPopover) return;

  if (pluginPopover.classList.contains('open') && currentPopoverPluginId === plugin.id) {
    closePluginPopover();
    return;
  }

  currentPopoverPluginId = plugin.id;

  $('#pluginPopName').textContent = plugin.name;
  $('#pluginPopDesc').textContent = plugin.description || '';
  const iconEl = $('#pluginPopIcon');
  iconEl.setAttribute('data-lucide', plugin.icon || 'puzzle');
  refreshIcons();

  const rect = anchorEl.getBoundingClientRect();
  pluginPopover.style.top  = `${rect.bottom + 6}px`;
  pluginPopover.style.left = `${rect.left}px`;

  pluginPopover.classList.add('open');

  const disableBtn = $('#pluginPopDisable');
  disableBtn.onclick = () => {
    pluginManager.deactivate(plugin.id);
    closePluginPopover();
  };
}

function closePluginPopover() {
  if (!pluginPopover) return;
  pluginPopover.classList.remove('open');
  currentPopoverPluginId = null;
}

document.addEventListener('click', (e) => {
  if (!pluginPopover || !pluginPopover.classList.contains('open')) return;
  if (pluginPopover.contains(e.target)) return;
  if (e.target.closest('.plugin-chip')) return;
  closePluginPopover();
});

// =========================================================
// TIENDA DE PLUGINS (modal)
// =========================================================
function openStore() {
  if (!storeModal) return;
  renderStore();
  storeModal.classList.remove('hidden');
}

function closeStore() {
  if (!storeModal) return;
  storeModal.classList.add('hidden');
}

function renderStore() {
  if (!storeGrid) return;
  storeGrid.innerHTML = '';

  const all = [...pluginManager.registry.values()];

  if (all.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'store-empty';
    empty.textContent = 'No hay plugins disponibles. Añade archivos a la carpeta plugins/ y regístralos en jsplugins.js.';
    storeGrid.appendChild(empty);
    return;
  }

  all.forEach(plugin => {
    const isActive = pluginManager.isActive(plugin.id);

    const card = document.createElement('div');
    card.className = 'store-card' + (isActive ? ' active' : '');
    card.innerHTML = `
      <div class="store-card-head">
        <div class="store-card-icon">
          <i data-lucide="${plugin.icon || 'puzzle'}"></i>
        </div>
        <div class="store-card-meta">
          <div class="store-card-name">${escapeHtml(plugin.name)}</div>
          <div class="store-card-version">v${escapeHtml(plugin.version || '1.0.0')}</div>
        </div>
      </div>
      <div class="store-card-desc">${escapeHtml(plugin.description || 'Sin descripción.')}</div>
      <button class="store-card-btn ${isActive ? 'danger' : ''}" type="button">
        <i data-lucide="${isActive ? 'power-off' : 'plus'}"></i>
        <span>${isActive ? 'Desactivar' : 'Activar'}</span>
      </button>
    `;

    const btn = card.querySelector('.store-card-btn');
    btn.addEventListener('click', () => {
      pluginManager.toggle(plugin.id);
    });

    storeGrid.appendChild(card);
  });

  refreshIcons();
}

// =========================================================
// API PÚBLICA  →  window.CodHestudio
// =========================================================
window.CodHestudio = {
  version: '0.4.0',

  register: (p) => pluginManager.register(p),
  unregister: (id) => pluginManager.unregister(id),
  activate: (id) => pluginManager.activate(id),
  deactivate: (id) => pluginManager.deactivate(id),
  togglePlugin: (id) => pluginManager.toggle(id),
  isPluginActive: (id) => pluginManager.isActive(id),
  listPlugins: () => [...pluginManager.registry.values()],
  listActivePlugins: () => [...pluginManager.active.values()].map(e => e.plugin),

  on: onHook, off: offHook, emit: emitHook,

  ui: {
    addStatusItem: _addStatusItem,
    addToolbarItem: _addToolbarItem,
    prompt: uiPrompt,
  },

  getState: () => state,
  getEditor: () => state.monacoEditor,
  getMonaco: () => window.monaco,
};

// =========================================================
// TEMA
// =========================================================
function applyTheme(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  state.monacoTheme = isDark ? 'cod-dark' : 'cod-light';
  if (state.editorReady && state.monacoEditor) monaco.editor.setTheme(state.monacoTheme);

  const btn = $('#themeToggle');
  if (btn) {
    btn.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}"></i>`;
    btn.title = isDark ? 'Modo claro' : 'Modo oscuro';
    refreshIcons();
  }
  emitHook('theme:change', isDark);
}

function toggleTheme() {
  const isDark = !document.body.classList.contains('dark-mode');
  localStorage.setItem(LS_THEME_KEY, isDark ? 'dark' : 'light');
  applyTheme(isDark);
}

(function initThemeFromStorage() {
  const saved = localStorage.getItem(LS_THEME_KEY);
  const isDark = saved === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  state.monacoTheme = isDark ? 'cod-dark' : 'cod-light';
})();

// =========================================================
// MONACO
// =========================================================
function defineCodThemes() {
  monaco.editor.defineTheme('cod-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '98A2B3', fontStyle: 'italic' },
      { token: 'keyword', foreground: '6941C6', fontStyle: 'bold' },
      { token: 'string', foreground: '027A48' },
      { token: 'number', foreground: 'B54708' },
      { token: 'type', foreground: '175CD3' },
      { token: 'delimiter', foreground: '475467' },
      { token: 'tag', foreground: '6941C6' },
      { token: 'metatag', foreground: 'B42318' },
      { token: 'attribute.name', foreground: 'B54708' },
      { token: 'attribute.value', foreground: '027A48' },
      { token: 'regexp', foreground: 'B42318' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#101828',
      'editorLineNumber.foreground': '#98A2B3',
      'editorLineNumber.activeForeground': '#475467',
      'editor.lineHighlightBackground': '#F7F8FA',
      'editor.lineHighlightBorder': '#00000000',
      'editorCursor.foreground': '#7F56D9',
      'editor.selectionBackground': '#E9D7FE',
      'editor.inactiveSelectionBackground': '#F4EBFF',
      'editorIndentGuide.background1': '#EAECF0',
      'editorIndentGuide.activeBackground1': '#D0D5DD',
      'editorWidget.background': '#FFFFFF',
      'editorWidget.border': '#E4E7EC',
      'editorSuggestWidget.background': '#FFFFFF',
      'editorSuggestWidget.selectedBackground': '#F4EBFF',
      'editorBracketMatch.background': '#F4EBFF',
      'editorBracketMatch.border': '#7F56D9',
      'scrollbarSlider.background': '#D0D5DD80',
    },
  });

  monaco.editor.defineTheme('cod-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '61646B', fontStyle: 'italic' },
      { token: 'keyword', foreground: '9B8AFB', fontStyle: 'bold' },
      { token: 'string', foreground: '75E0A7' },
      { token: 'number', foreground: 'FDB022' },
      { token: 'type', foreground: '84CAFF' },
      { token: 'delimiter', foreground: 'CECFD2' },
      { token: 'tag', foreground: '9B8AFB' },
      { token: 'metatag', foreground: 'FDA29B' },
      { token: 'attribute.name', foreground: 'BDB4FE' },
      { token: 'attribute.value', foreground: '75E0A7' },
      { token: 'regexp', foreground: 'FDA29B' },
    ],
    colors: {
      'editor.background': '#161B26',
      'editor.foreground': '#F5F5F6',
      'editorLineNumber.foreground': '#61646B',
      'editorLineNumber.activeForeground': '#CECFD2',
      'editor.lineHighlightBackground': '#1F242F',
      'editor.lineHighlightBorder': '#00000000',
      'editorCursor.foreground': '#BDB4FE',
      'editor.selectionBackground': '#4A3D5F',
      'editor.inactiveSelectionBackground': '#2A1F3D',
      'editorIndentGuide.background1': '#2A303C',
      'editorIndentGuide.activeBackground1': '#475467',
      'editorWidget.background': '#1F242F',
      'editorWidget.border': '#333741',
      'editorSuggestWidget.background': '#1F242F',
      'editorSuggestWidget.selectedBackground': '#2A1F3D',
      'editorBracketMatch.background': '#2A1F3D',
      'editorBracketMatch.border': '#9B8AFB',
      'scrollbarSlider.background': '#47546780',
    },
  });
}

require.config({ paths: { vs: MONACO_PATH } });

require(['vs/editor/editor.main'], async function () {
  defineCodThemes();
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  } catch (_) {}

  state.monacoEditor = monaco.editor.create($('#monacoContainer'), {
    value: '', language: 'plaintext', theme: state.monacoTheme,
    fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
    fontSize: 14, lineHeight: 22, automaticLayout: true,
    minimap: { enabled: false }, scrollBeyondLastLine: false,
    tabSize: 2, renderWhitespace: 'selection',
    smoothScrolling: true, cursorBlinking: 'smooth',
    padding: { top: 12 },
  });

  state.editorReady = true;
  $('#newProjectBtn').disabled = false;

  applyTheme(document.body.classList.contains('dark-mode'));
  setStatus('Listo', true);

  window.addEventListener('resize', () => {
    if (state.monacoEditor) state.monacoEditor.layout();
  });

  emitHook('editor:ready');
});

// =========================================================
// PROYECTOS
// =========================================================
async function pickFolderAndCreate() {
  if (!('showDirectoryPicker' in window)) {
    alert('Tu navegador no soporta la File System Access API.\n\nUsa Chrome, Edge u Opera de escritorio.');
    return;
  }
  try {
    const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    state.pendingHandle = dirHandle;
    openModal(dirHandle.name);
  } catch (err) {
    if (err.name !== 'AbortError') console.error(err);
  }
}

function openModal(defaultName = '') {
  $('#projectName').value = defaultName;
  renderIconPicker();
  modal.classList.remove('hidden');
  setTimeout(() => $('#projectName').focus(), 60);
}

function closeModal() {
  modal.classList.add('hidden');
  state.pendingHandle = null;
}

function renderIconPicker() {
  iconPicker.innerHTML = '';
  ICONS.forEach((ic, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-option' + (i === 0 ? ' selected' : '');
    btn.dataset.icon = ic;
    btn.innerHTML = `<i data-lucide="${ic}"></i>`;
    btn.addEventListener('click', () => {
      iconPicker.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    iconPicker.appendChild(btn);
  });
  refreshIcons();
}

async function confirmCreateProject() {
  if (!state.pendingHandle) return closeModal();

  const name = $('#projectName').value.trim() || state.pendingHandle.name;
  const icon = iconPicker.querySelector('.icon-option.selected')?.dataset.icon || 'folder';

  setStatus('Leyendo carpeta…', true);

  let tree;
  try { tree = await readDirectory(state.pendingHandle); }
  catch (err) {
    console.error(err);
    setStatus('Error al leer la carpeta', true);
    return closeModal();
  }

  const project = {
    id: crypto.randomUUID(),
    name, icon,
    handle: state.pendingHandle,
    tree, needsPermission: false,
  };

  state.projects.push(project);
  await persistProject(project);

  closeModal();
  renderProjects();
  selectProject(project.id);
  setStatus(`Proyecto "${name}" creado`, true);
  emitHook('project:create', project);
}

async function readDirectory(dirHandle, parentPath = '') {
  const entries = [];
  for await (const entry of dirHandle.values()) {
    const path = parentPath ? `${parentPath}/${entry.name}` : entry.name;

    if (entry.kind === 'directory') {
      let children = [];
      const skipped = SKIP_DIRS.includes(entry.name);
      if (!skipped) {
        try { children = await readDirectory(entry, path); }
        catch { children = []; }
      }
      entries.push({
        kind: 'directory', name: entry.name, path,
        handle: entry, children, expanded: false, skipped,
      });
    } else {
      entries.push({ kind: 'file', name: entry.name, path, handle: entry });
    }
  }
  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return entries;
}

function renderProjects() {
  projectsList.innerHTML = '';

  if (state.projects.length === 0) {
    projectsEmpty.style.display = 'flex';
    projectsList.style.display = 'none';
    return;
  }
  projectsEmpty.style.display = 'none';
  projectsList.style.display = 'flex';

  state.projects.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'project-item' + (state.activeProject?.id === p.id ? ' active' : '');
    li.innerHTML = `
      <i data-lucide="${p.icon}"></i>
      <span>${escapeHtml(p.name)}</span>
      ${p.needsPermission ? '<i data-lucide="lock" class="project-lock"></i>' : ''}
      <button class="project-remove" title="Quitar de la lista (no borra del disco)" type="button">
        <i data-lucide="x"></i>
      </button>
    `;
    li.addEventListener('click', (e) => {
      if (e.target.closest('.project-remove')) {
        e.stopPropagation();
        removeProject(p.id);
      } else {
        selectProject(p.id);
      }
    });
    projectsList.appendChild(li);
  });
  refreshIcons();
}

async function removeProject(id) {
  const p = state.projects.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`¿Quitar "${p.name}" de la lista?\n(No se borra del disco)`)) return;

  state.projects = state.projects.filter(x => x.id !== id);
  if (state.activeProject?.id === id) {
    state.activeProject = null;
    closeAllTabs();
    filetreeTitle.textContent = 'Archivos';
    filetreeList.innerHTML = '';
    filetreeEmpty.style.display = 'flex';
  }
  await dbDelete(STORE_PROJECTS, id);
  renderProjects();
  emitHook('project:remove', id, p);
}

async function selectProject(id) {
  const p = state.projects.find(x => x.id === id);
  if (!p) return;

  if (p.needsPermission) {
    try {
      const perm = await p.handle.queryPermission({ mode: 'readwrite' });
      let granted = perm === 'granted';
      if (!granted) {
        const asked = await p.handle.requestPermission({ mode: 'readwrite' });
        granted = asked === 'granted';
      }
      if (!granted) { setStatus(`Permiso denegado para "${p.name}"`, true); return; }
      p.needsPermission = false;
      renderProjects();
    } catch (err) {
      console.error(err);
      setStatus('Error al pedir permiso', true);
      return;
    }
  }

  if (!p.tree || p.tree.length === 0) {
    setStatus('Leyendo carpeta…', true);
    try { p.tree = await readDirectory(p.handle); }
    catch (err) {
      console.error(err);
      setStatus('Error al leer la carpeta', true);
      return;
    }
  }

  closeAllTabs();
  state.activeProject = p;
  filetreeTitle.textContent = p.name;
  renderProjects();
  renderFileTree();
  setStatus('Listo', true);
  emitHook('project:select', p);
}

// =========================================================
// ÁRBOL DE ARCHIVOS — render
// =========================================================
function renderFileTree() {
  filetreeList.innerHTML = '';

  if (!state.activeProject || state.activeProject.tree.length === 0) {
    filetreeEmpty.style.display = 'flex';
    filetreeList.style.display = 'none';
    return;
  }

  filetreeEmpty.style.display = 'none';
  filetreeList.style.display = 'block';

  renderTreeNodes(state.activeProject.tree, filetreeList, 0);
  refreshIcons();
}

function renderTreeNodes(nodes, container, depth) {
  nodes.forEach((node) => {
    const li = document.createElement('li');
    li.className = 'tree-item';
    li.style.paddingLeft = `${12 + depth * 14}px`;

    if (node.kind === 'directory') {
      const chev = node.expanded ? 'chevron-down' : 'chevron-right';
      li.innerHTML = `
        <i data-lucide="${chev}" class="chev"></i>
        <i data-lucide="folder"></i>
        <span>${escapeHtml(node.name)}</span>
      `;
      li.addEventListener('click', () => {
        node.expanded = !node.expanded;
        renderFileTree();
      });
      container.appendChild(li);

      if (node.expanded) {
        if (node.children?.length) {
          renderTreeNodes(node.children, container, depth + 1);
        } else {
          const empty = document.createElement('li');
          empty.className = 'tree-item';
          empty.style.paddingLeft = `${12 + (depth + 1) * 14}px`;
          empty.style.opacity = '0.5';
          empty.style.fontStyle = 'italic';
          empty.textContent = node.skipped ? '(omitida)' : '(vacía)';
          container.appendChild(empty);
        }
      }
    } else {
      li.innerHTML = `
        <i data-lucide="${iconForFile(node.name)}"></i>
        <span>${escapeHtml(node.name)}</span>
      `;
      if (state.activeTab === node.path) li.classList.add('active');
      li.addEventListener('click', () => openFile(node));
      container.appendChild(li);
    }
    const actions = document.createElement('span');
    actions.className = 'tree-actions';
    li.appendChild(actions);
    emitHook('tree:item', li, node, actions);
  });
}

// =========================================================
// ARCHIVOS / TABS
// =========================================================
function detectMediaKind(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'oga', 'm4a', 'flac', 'aac', 'opus'].includes(ext)) return 'audio';
  return null;
}

async function openFile(node) {
  const mediaKind = detectMediaKind(node.name);
  if (mediaKind) {
    if (__hooks.has('media:open')) {
      emitHook('media:open', node, mediaKind);
    } else {
      const label = mediaKind === 'image' ? 'imágenes' : mediaKind === 'video' ? 'videos' : 'audios';
      setStatus(`Activa un visor de ${label} en la tienda`, true);
    }
    return;
  }

  const existing = state.openTabs.find(t => t.path === node.path);
  if (existing) { setActiveTab(node.path); return; }

  try {
    setStatus(`Abriendo ${node.name}…`, true);
    const file = await node.handle.getFile();

    if (file.size > 2 * 1024 * 1024) {
      setStatus(`${node.name} es demasiado grande (>2MB)`, true);
      return;
    }

    const content = await file.text();
    const lang = detectLanguage(node.name);
    const uri = monaco.Uri.file(node.path);

    let model = monaco.editor.getModel(uri);
    if (model) model.dispose();
    model = monaco.editor.createModel(content, lang, uri);

    const tab = {
      path: node.path, name: node.name,
      model, handle: node.handle, dirty: false,
    };

    model.onDidChangeContent(() => {
      if (!tab.dirty) { tab.dirty = true; renderTabs(); }
      emitHook('model:change', tab);
    });

    state.openTabs.push(tab);
    setActiveTab(node.path);
    setStatus('Listo', true);
    emitHook('file:open', tab);
  } catch (err) {
    console.error(err);
    setStatus('Error al abrir el archivo', true);
  }
}

function setActiveTab(path) {
  state.activeTab = path;
  const tab = state.openTabs.find(t => t.path === path);
  if (!tab) return;

  welcomeEl.style.display = 'none';
  editorWrap.classList.add('visible');
  statusFile.textContent = path;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      state.monacoEditor.setModel(tab.model);
      state.monacoEditor.layout();
      state.monacoEditor.focus();
    });
  });

  renderTabs();
  renderFileTree();
  emitHook('tab:change', tab);
}

function renderTabs() {
  tabsBar.innerHTML = '';
  state.openTabs.forEach((tab) => {
    const el = document.createElement('div');
    el.className = 'tab' + (state.activeTab === tab.path ? ' active' : '');
    el.innerHTML = `
      <i data-lucide="${iconForFile(tab.name)}"></i>
      <span class="tab-name">${escapeHtml(tab.name)}</span>
      ${tab.dirty ? '<span class="dirty">•</span>' : ''}
      <button class="tab-close" title="Cerrar" type="button">
        <i data-lucide="x"></i>
      </button>
    `;
    el.addEventListener('click', (e) => {
      if (e.target.closest('.tab-close')) closeTab(tab.path);
      else setActiveTab(tab.path);
    });
    el.addEventListener('auxclick', (e) => {
      if (e.button === 1) closeTab(tab.path);
    });
    tabsBar.appendChild(el);
  });
  refreshIcons();
  updateSaveButtons();
}

function closeTab(path) {
  const idx = state.openTabs.findIndex(t => t.path === path);
  if (idx === -1) return;
  const tab = state.openTabs[idx];

  if (tab.dirty && !confirm(`"${tab.name}" tiene cambios sin guardar.\n¿Cerrar igual?`)) return;

  tab.model.dispose();
  state.openTabs.splice(idx, 1);
  emitHook('file:close', path);

  if (state.activeTab === path) {
    state.activeTab = null;
    if (state.openTabs.length > 0) {
      const next = state.openTabs[Math.max(0, idx - 1)];
      setActiveTab(next.path);
    } else {
      showWelcome();
    }
  } else {
    renderTabs();
  }
}

function closeAllTabs() {
  state.openTabs.forEach(t => t.model.dispose());
  state.openTabs = [];
  state.activeTab = null;
  if (state.monacoEditor) state.monacoEditor.setModel(null);
  tabsBar.innerHTML = '';
  showWelcome();
  updateSaveButtons();
}

function showWelcome() {
  welcomeEl.style.display = 'flex';
  editorWrap.classList.remove('visible');
  statusFile.textContent = '';
  updateSaveButtons();
}

// =========================================================
// GUARDAR
// =========================================================
function updateSaveButtons() {
  const current = state.openTabs.find(t => t.path === state.activeTab);
  const anyDirty = state.openTabs.some(t => t.dirty);
  saveBtn.disabled    = state.saving || !current || !current.dirty;
  saveAllBtn.disabled = state.saving || !anyDirty;
}

async function saveCurrentFile() {
  if (state.saving) return;
  if (!state.activeTab) return;
  const tab = state.openTabs.find(t => t.path === state.activeTab);
  if (!tab) return;

  if (!tab.dirty) { setStatus('Sin cambios', true); return; }

  state.saving = true;
  updateSaveButtons();
  setStatus(`Guardando ${tab.name}…`, true);

  try {
    const writable = await tab.handle.createWritable();
    await writable.write(tab.model.getValue());
    await writable.close();
    tab.dirty = false;
    renderTabs();
    setStatus(`Guardado ${tab.name}`, true);
    emitHook('file:save', tab);
  } catch (err) {
    console.error(err);
    setStatus('Error al guardar', true);
  } finally {
    state.saving = false;
    updateSaveButtons();
  }
}

async function saveAllFiles() {
  if (state.saving) return;
  const dirtyTabs = state.openTabs.filter(t => t.dirty);
  if (dirtyTabs.length === 0) { setStatus('Sin cambios', true); return; }

  state.saving = true;
  updateSaveButtons();
  setStatus(`Guardando ${dirtyTabs.length} archivo(s)…`, true);

  let ok = 0, fail = 0;
  for (const tab of dirtyTabs) {
    try {
      const writable = await tab.handle.createWritable();
      await writable.write(tab.model.getValue());
      await writable.close();
      tab.dirty = false;
      ok++;
      emitHook('file:save', tab);
    } catch (err) {
      console.error(err);
      fail++;
    }
  }

  renderTabs();
  state.saving = false;
  updateSaveButtons();

  setStatus(fail > 0 ? `Guardados ${ok}, fallaron ${fail}` : `Guardados ${ok} archivo(s)`, true);
}

// =========================================================
// EVENTOS
// =========================================================
$('#newProjectBtn').addEventListener('click', pickFolderAndCreate);
$('#themeToggle').addEventListener('click', toggleTheme);
$('#storeBtn').addEventListener('click', openStore);
saveBtn.addEventListener('click', saveCurrentFile);
saveAllBtn.addEventListener('click', saveAllFiles);
$('#cancelBtn').addEventListener('click', closeModal);
$('#createBtn').addEventListener('click', confirmCreateProject);

// Tienda
$('#storeCloseBtn').addEventListener('click', closeStore);
$('#storeDoneBtn').addEventListener('click', closeStore);
storeModal.addEventListener('click', (e) => {
  if (e.target === storeModal) closeStore();
});

$('#projectName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmCreateProject();
  if (e.key === 'Escape') closeModal();
});

modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;

  if (e.key === 'Escape' && storeModal && !storeModal.classList.contains('hidden')) {
    closeStore();
    return;
  }

  if (mod && !e.shiftKey && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (!state.saving) saveCurrentFile();
  }
  if (mod && e.shiftKey && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (!state.saving) saveAllFiles();
  }
  if (mod && e.key.toLowerCase() === 'w') {
    e.preventDefault();
    if (state.activeTab) closeTab(state.activeTab);
  }
});

window.addEventListener('beforeunload', (e) => {
  if (state.openTabs.some(t => t.dirty)) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// =========================================================
// INIT
// =========================================================
(async function init() {
  refreshIcons();

  try {
    state.db = await openDB();
    await loadSavedProjects();
  } catch (err) {
    console.error('IndexedDB no disponible:', err);
  }

  renderProjects();
  showWelcome();
  applyTheme(document.body.classList.contains('dark-mode'));

  if (typeof window.loadJsPlugins === 'function') {
    setStatus('Cargando plugins…', true);
    try { await window.loadJsPlugins(); }
    catch (e) { console.error('[jsplugins] error:', e); }
  }

  pluginManager.restore();

  renderPluginsBar();
  renderStore();
  setStatus('Listo', true);
})();