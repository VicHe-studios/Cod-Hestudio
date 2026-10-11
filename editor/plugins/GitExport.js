/* =========================================================
   Plugin: GitHub Export
   Sube el proyecto activo a un repositorio de GitHub con un
   token de grano fino limitado a ese repositorio (permiso
   Contents: lectura y escritura). Solo sube lo que cambió,
   usando la API de Git (blobs, árboles y commits).

   Modos: manual, cada 10, 30 o 60 minutos.
   - Manual: puede borrar en GitHub lo que ya no existe en el
     proyecto, pidiendo confirmación con la lista.
   - Automático: nunca borra. Solo informa cuántos archivos
     quedaron pendientes de borrado.

   Sube lo que está guardado en disco. Los cambios sin guardar
   se avisan y no se suben.
   ========================================================= */

const __geSkip = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.cache'];
const __geModes = { manual: 'manual', '10': 'cada 10 min', '30': 'cada 30 min', '60': 'cada hora' };

function __geFriendly(status, msg) {
  if (status === 401) return 'Token inválido o vencido';
  if (status === 403) return 'Sin permiso o límite de la API de GitHub alcanzado';
  if (status === 404) return 'No encontrado: revisa el repositorio y la rama';
  if (status === 409) return 'Conflicto al actualizar la rama';
  if (status === 422) return `GitHub rechazó la operación: ${msg || ''}`;
  return msg || `Error ${status}`;
}

async function __geFetch(token, method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return null;
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(__geFriendly(res.status, data.message));
    err.status = res.status;
    throw err;
  }
  return data;
}

function __geBase64(bytes) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

// SHA-1 con el formato de Git: así sabemos si un archivo cambió sin subirlo
async function __geBlobSha(bytes) {
  const header = new TextEncoder().encode(`blob ${bytes.length}\0`);
  const all = new Uint8Array(header.length + bytes.length);
  all.set(header);
  all.set(bytes, header.length);
  const hash = await crypto.subtle.digest('SHA-1', all);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function __geScan(dirHandle, prefix = '', out = []) {
  for await (const entry of dirHandle.values()) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === 'directory') {
      if (__geSkip.includes(entry.name)) continue;
      await __geScan(entry, path, out);
    } else {
      out.push({ path, handle: entry });
    }
  }
  return out;
}

async function __geResolveRepo(token, repoInput, createIfMissing) {
  const me = await __geFetch(token, 'GET', '/user');
  let owner = me.login;
  let name = repoInput.trim();
  if (name.includes('/')) [owner, name] = name.split('/');
  if (!name) throw new Error('Escribe el nombre del repositorio');

  try {
    await __geFetch(token, 'GET', `/repos/${owner}/${name}`);
  } catch (err) {
    if (err.status !== 404 || !createIfMissing) throw err;
    if (owner !== me.login) throw new Error('Solo puedo crear repositorios en tu cuenta');
    await __geFetch(token, 'POST', '/user/repos', { name, private: true, auto_init: false });
  }
  return { owner, name };
}

async function __geSync(ctx, project, cfg, manual, message) {
  const token = cfg.token;
  const { owner, name } = await __geResolveRepo(token, cfg.repo, cfg.createIfMissing);
  const base = `/repos/${owner}/${name}`;
  const branch = (cfg.branch || 'main').trim();

  // Estado remoto actual
  let headSha = null;
  let baseTree = null;
  const remote = new Map();
  try {
    const ref = await __geFetch(token, 'GET', `${base}/git/ref/heads/${branch}`);
    headSha = ref.object.sha;
    const commit = await __geFetch(token, 'GET', `${base}/git/commits/${headSha}`);
    baseTree = commit.tree.sha;
    const tree = await __geFetch(token, 'GET', `${base}/git/trees/${baseTree}?recursive=1`);
    for (const e of tree.tree) if (e.type === 'blob') remote.set(e.path, e.sha);
  } catch (err) {
    if (err.status !== 404) throw err;
    headSha = null;
    baseTree = null;
    remote.clear();
  }

  // Estado local: hash de cada archivo
  const files = await __geScan(project.handle);
  if (files.length === 0) throw new Error('El proyecto no tiene archivos');

  const local = new Map();
  for (const f of files) {
    const bytes = new Uint8Array(await (await f.handle.getFile()).arrayBuffer());
    local.set(f.path, await __geBlobSha(bytes));
  }

  const changed = files.filter(f => remote.get(f.path) !== local.get(f.path));

  // Archivos en GitHub que ya no están en el proyecto
  const missing = [...remote.keys()].filter(p => !local.has(p) && !__geSkip.includes(p.split('/')[0]));
  let deletions = [];
  if (cfg.deleteMissing && missing.length && manual) {
    const list = missing.slice(0, 10).join('\n');
    const more = missing.length > 10 ? `\n…y ${missing.length - 10} más` : '';
    if (confirm(`Se borrarán en GitHub ${missing.length} archivo(s) que ya no están en el proyecto:\n\n${list}${more}\n\n¿Continuar?`)) {
      deletions = missing;
    }
  }
  const pendingDeletes = cfg.deleteMissing && !manual ? missing.length : (cfg.deleteMissing ? missing.length - deletions.length : 0);

  if (changed.length === 0 && deletions.length === 0) {
    return { nothing: true, changed: 0, deleted: 0, pendingDeletes };
  }

  // Subir blobs cambiados, de 5 en 5
  const entries = [];
  let done = 0;
  for (let i = 0; i < changed.length; i += 5) {
    const batch = changed.slice(i, i + 5);
    const shas = await Promise.all(batch.map(async (f) => {
      const bytes = new Uint8Array(await (await f.handle.getFile()).arrayBuffer());
      const res = await __geFetch(token, 'POST', `${base}/git/blobs`, {
        content: __geBase64(bytes),
        encoding: 'base64',
      });
      return res.sha;
    }));
    batch.forEach((f, j) => entries.push({ path: f.path, mode: '100644', type: 'blob', sha: shas[j] }));
    done += batch.length;
    ctx.actions.setStatus(`GitHub: subiendo ${done}/${changed.length}…`, true);
  }

  // Borrados: sha null elimina el archivo del árbol
  deletions.forEach(p => entries.push({ path: p, mode: '100644', type: 'blob', sha: null }));

  const treeBody = { tree: entries };
  if (baseTree) treeBody.base_tree = baseTree;
  const newTree = await __geFetch(token, 'POST', `${base}/git/trees`, treeBody);

  const commit = await __geFetch(token, 'POST', `${base}/git/commits`, {
    message,
    tree: newTree.sha,
    parents: headSha ? [headSha] : [],
  });

  if (headSha) {
    await __geFetch(token, 'PATCH', `${base}/git/refs/heads/${branch}`, { sha: commit.sha, force: false });
  } else {
    await __geFetch(token, 'POST', `${base}/git/refs`, { ref: `refs/heads/${branch}`, sha: commit.sha });
  }

  return { nothing: false, changed: changed.length, deleted: deletions.length, pendingDeletes };
}

CodHestudio.register({
  id: 'githubexport',
  name: 'GitHub Export',
  icon: 'cloud-upload',
  description: 'Sube el proyecto a GitHub con token clásico: manual o cada 10, 30 o 60 minutos.',
  version: '1.0.0',

  activate(ctx) {
    const STYLE_ID = 'ge-style';
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .ge-field { margin-top: 12px; }
      .ge-field label { display: block; font-size: 0.72rem; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
      .ge-input {
        width: 100%;
        padding: 9px 12px;
        background: var(--bg-page);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        color: var(--text);
        font-family: var(--font);
        font-size: 0.88rem;
        outline: none;
      }
      .ge-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-subtle); background: var(--bg-surface); }
      .ge-check { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary); cursor: pointer; }
      .ge-hint { margin-top: 6px; font-size: 0.74rem; color: var(--text-tertiary); line-height: 1.45; }
      .ge-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0 26px; align-items: start; }
      .ge-col { min-width: 0; }
      @media (max-width: 760px) { .ge-cols { grid-template-columns: 1fr; } }
      .ge-warn { margin-top: 12px; padding: 10px 12px; border-radius: var(--r-sm); background: var(--accent-subtle); border: 1px solid var(--accent-border); font-size: 0.76rem; color: var(--text-secondary); line-height: 1.5; }
    `;
    document.head.appendChild(st);

    const statusItem = ctx.ui.addStatusItem({
      id: 'githubexport-status',
      title: 'Exportar a GitHub',
      text: 'GitHub',
      icon: 'cloud-upload',
      onClick: () => openConfig(),
    });

    let timer = null;
    let running = false;

    function cfgKey(project) { return `repo:${project.id}`; }

    // El token vive en sessionStorage (se borra al cerrar la pestaña).
    // Solo se guarda en localStorage si el usuario marca "recordar".
    const SESSION_TOKEN_KEY = 'cod-hestudio:github-token';

    function getToken() {
      return sessionStorage.getItem(SESSION_TOKEN_KEY) || ctx.storage.get('token', '');
    }

    function saveToken(token, remember) {
      try { sessionStorage.setItem(SESSION_TOKEN_KEY, token); } catch {}
      if (remember) ctx.storage.set('token', token);
      else ctx.storage.remove('token');
    }

    function getCfg(project) {
      return {
        token: getToken(),
        rememberToken: ctx.storage.get('remember-token', false),
        repo: '',
        branch: 'main',
        mode: 'manual',
        createIfMissing: false,
        deleteMissing: true,
        lastSync: null,
        ...ctx.storage.get(cfgKey(project), {}),
      };
    }

    function saveCfg(project, cfg) {
      const { token, rememberToken, ...rest } = cfg;
      ctx.storage.set('remember-token', !!rememberToken);
      saveToken(token, !!rememberToken);
      ctx.storage.set(cfgKey(project), rest);
    }

    function refreshStatus() {
      const project = ctx.actions.getActiveProject();
      if (!project) {
        statusItem.update({ text: 'GitHub', title: 'Abre un proyecto para exportarlo' });
        return;
      }
      const cfg = getCfg(project);
      if (!cfg.token || !cfg.repo) {
        statusItem.update({ text: 'GitHub · sin configurar', title: 'Configurar exportación' });
        return;
      }
      const last = cfg.lastSync ? ` · último ${new Date(cfg.lastSync).toLocaleTimeString()}` : '';
      statusItem.update({
        text: `GitHub · ${__geModes[cfg.mode]}${last}`,
        title: `Repositorio ${cfg.repo} (rama ${cfg.branch})`,
      });
    }

    function schedule() {
      clearInterval(timer);
      timer = null;
      const project = ctx.actions.getActiveProject();
      if (!project) return;
      const cfg = getCfg(project);
      if (cfg.mode === 'manual' || !cfg.token || !cfg.repo) return;
      timer = setInterval(() => run(false), Number(cfg.mode) * 60 * 1000);
    }

    async function run(manual) {
      const project = ctx.actions.getActiveProject();
      if (!project) {
        if (manual) ctx.actions.setStatus('Abrí un proyecto primero', true);
        return;
      }
      const cfg = getCfg(project);
      if (!cfg.token || !cfg.repo) {
        if (manual) openConfig();
        return;
      }
      if (running) return;

      running = true;
      statusItem.update({ text: 'GitHub · subiendo…' });

      const dirty = ctx.actions.getOpenTabs().filter(t => t.dirty).length;
      const stamp = new Date().toLocaleString();
      const message = `${manual ? 'Sync manual' : 'Sync automático'} desde Cod-Hestudio · ${project.name} · ${stamp}`;

      try {
        const r = await __geSync(ctx, project, cfg, manual, message);
        cfg.lastSync = new Date().toISOString();
        saveCfg(project, cfg);

        const notes = [];
        if (r.pendingDeletes) notes.push(`${r.pendingDeletes} archivo(s) en GitHub no se borraron (solo el sync manual borra)`);
        if (dirty) notes.push(`${dirty} con cambios sin guardar no se subieron`);
        const extra = notes.length ? ` · ${notes.join(' · ')}` : '';

        if (r.nothing) {
          ctx.actions.setStatus(`GitHub: sin cambios${extra}`, !!extra);
        } else {
          ctx.actions.setStatus(`GitHub: ${r.changed} subido(s), ${r.deleted} borrado(s)${extra}`, !!extra);
        }
      } catch (err) {
        console.error(err);
        ctx.actions.setStatus(`GitHub: ${err.message}`, true);
      } finally {
        running = false;
        refreshStatus();
      }
    }

    function openConfig() {
      const project = ctx.actions.getActiveProject();
      if (!project) {
        ctx.actions.setStatus('Abrí un proyecto primero', true);
        return;
      }
      const cfg = getCfg(project);

      const overlay = document.createElement('div');
      overlay.className = 'modal';
      const box = document.createElement('div');
      box.className = 'modal-content';
      box.style.width = '860px';
      box.innerHTML = `
        <h2>Exportar a GitHub</h2>
        <p class="modal-desc">Proyecto: <strong></strong></p>

        <div class="ge-cols">
        <div class="ge-col">
        <div class="ge-field">
          <label>Token de grano fino (un solo repositorio)</label>
          <input class="ge-input" type="password" autocomplete="off" spellcheck="false" id="ge-token">
          <div class="ge-hint">Créalo en GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens. Límitalo solo a este repositorio y dale permiso <strong>Contents: Read and write</strong>. No necesita ningún otro permiso.</div>
        </div>

        <div class="ge-field">
          <label>Repositorio</label>
          <input class="ge-input" type="text" autocomplete="off" spellcheck="false" id="ge-repo" placeholder="mi-proyecto o usuario/mi-proyecto">
        </div>

        <div class="ge-field">
          <label>Rama</label>
          <input class="ge-input" type="text" autocomplete="off" spellcheck="false" id="ge-branch" placeholder="main">
        </div>

        </div>
        <div class="ge-col">
        <div class="ge-field">
          <label>Frecuencia</label>
          <select class="ge-input" id="ge-mode">
            <option value="manual">Manual</option>
            <option value="10">Cada 10 minutos</option>
            <option value="30">Cada 30 minutos</option>
            <option value="60">Cada hora</option>
          </select>
        </div>

        <label class="ge-check"><input type="checkbox" id="ge-create"> Crear el repositorio si no existe (requiere un token con más permisos)</label>
        <label class="ge-check"><input type="checkbox" id="ge-delete"> Borrar en GitHub lo que ya no está en el proyecto (solo en sync manual)</label>

        <label class="ge-check"><input type="checkbox" id="ge-remember"> Recordar el token en este navegador</label>

        <div class="ge-warn">
          Por defecto el token se borra al cerrar la pestaña. Si lo recuerdas, queda guardado en este navegador, y cualquier script de este sitio podría leerlo. Por eso usa siempre un token limitado a un solo repositorio, y revócalo si dejas de usar esta función.
        </div>

        </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" data-act="cancel">Cancelar</button>
          <button type="button" class="btn btn-secondary" data-act="save">Guardar</button>
          <button type="button" class="btn btn-primary" data-act="sync">Subir ahora</button>
        </div>
      `;
      box.querySelector('.modal-desc strong').textContent = project.name;
      box.querySelector('#ge-token').value = cfg.token;
      box.querySelector('#ge-repo').value = cfg.repo;
      box.querySelector('#ge-branch').value = cfg.branch;
      box.querySelector('#ge-mode').value = cfg.mode;
      box.querySelector('#ge-create').checked = !!cfg.createIfMissing;
      box.querySelector('#ge-delete').checked = !!cfg.deleteMissing;
      box.querySelector('#ge-remember').checked = !!cfg.rememberToken;

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      function close() {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
      }
      function onKey(e) { if (e.key === 'Escape') close(); }

      function readForm() {
        return {
          token: box.querySelector('#ge-token').value.trim(),
          repo: box.querySelector('#ge-repo').value.trim(),
          branch: box.querySelector('#ge-branch').value.trim() || 'main',
          mode: box.querySelector('#ge-mode').value,
          createIfMissing: box.querySelector('#ge-create').checked,
          deleteMissing: box.querySelector('#ge-delete').checked,
          rememberToken: box.querySelector('#ge-remember').checked,
          lastSync: cfg.lastSync,
        };
      }

      function save() {
        const next = readForm();
        if (!next.token || !next.repo) {
          ctx.actions.setStatus('Escribe el token y el repositorio', true);
          return null;
        }
        saveCfg(project, next);
        schedule();
        refreshStatus();
        return next;
      }

      box.querySelector('[data-act="cancel"]').addEventListener('click', close);
      box.querySelector('[data-act="save"]').addEventListener('click', () => {
        if (save()) {
          ctx.actions.setStatus('Configuración de GitHub guardada');
          close();
        }
      });
      box.querySelector('[data-act="sync"]').addEventListener('click', () => {
        if (save()) {
          close();
          run(true);
        }
      });
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      document.addEventListener('keydown', onKey, true);
    }

    // Botón en la barra inferior, junto a Guardar
    const actionsBox = document.querySelector('.statusbar-actions');
    const saveBtnEl = document.getElementById('saveBtn');
    const ghBtn = document.createElement('button');
    ghBtn.type = 'button';
    ghBtn.id = 'githubexport-btn';
    ghBtn.className = 'statusbar-btn';
    ghBtn.title = 'Exportar proyecto a GitHub';
    ghBtn.innerHTML = '<i data-lucide="cloud-upload"></i><span class="statusbar-btn-label">GitHub</span>';
    ghBtn.addEventListener('click', () => openConfig());
    if (actionsBox) actionsBox.insertBefore(ghBtn, saveBtnEl || actionsBox.firstChild);
    if (window.lucide) lucide.createIcons();

    ctx.cleanup(() => ghBtn.remove());

    ctx.on('project:select', () => { refreshStatus(); schedule(); });

    refreshStatus();
    schedule();

    ctx.cleanup(() => {
      clearInterval(timer);
      document.getElementById(STYLE_ID)?.remove();
    });
  },
});