/* =========================================================
   CodDialog · utilidad compartida (no es un plugin)
   Pantalla con desplegable de carpeta arriba y campo de
   nombre abajo. Por defecto usa la raíz del proyecto o la
   carpeta del archivo activo.

   Uso: await window.CodDialog.createEntry(ctx, { ... })
   Opciones:
     title, desc, nameLabel, namePlaceholder  → textos
     pickOnly     → true: solo elegir carpeta, sin nombre
     defaultFolder → carpeta preseleccionada ('' = raíz)
     excludePath  → ruta a ocultar (ella y sus subcarpetas)
     okLabel      → texto del botón de confirmar
     defaultName  → nombre prellenado en el campo
     currentPath  → ruta actual del elemento; si el destino es
                    esa misma ruta, no se marca como duplicado
   Devuelve { parent, name } (o { parent } con pickOnly),
   o null si se cancela.
   ========================================================= */
(function () {
  const STYLE_ID = 'cod-dialog-style';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .cod-select {
        width: 100%;
        padding: 9px 12px;
        background: var(--bg-page);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        color: var(--text);
        font-family: var(--font);
        font-size: 0.88rem;
        outline: none;
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .cod-select:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-subtle);
        background: var(--bg-surface);
      }
      .cod-dialog-error {
        min-height: 1em;
        margin-top: 6px;
        font-size: 0.74rem;
        color: var(--danger);
      }
    `;
    document.head.appendChild(st);
  }

  function collectFolders(nodes, out) {
    for (const n of nodes) {
      if (n.kind === 'directory' && !n.skipped) {
        out.push(n.path);
        collectFolders(n.children || [], out);
      }
    }
    return out;
  }

  function createEntry(ctx, opts) {
    const {
      title = 'Nuevo',
      desc = '',
      nameLabel = 'Nombre',
      namePlaceholder = '',
      pickOnly = false,
      defaultFolder: forcedDefault,
      excludePath = null,
      okLabel = 'Crear',
      defaultName = '',
      currentPath = null,
    } = opts || {};

    ensureStyle();

    const project = ctx.actions.getActiveProject();
    let folders = project ? collectFolders(project.tree, []) : [];
    if (excludePath) {
      folders = folders.filter(p => p !== excludePath && !p.startsWith(excludePath + '/'));
    }
    folders.sort((a, b) => a.localeCompare(b));

    let defaultFolder = forcedDefault;
    if (defaultFolder === undefined) {
      const activeTab = ctx.actions.getActiveTab();
      defaultFolder = activeTab && activeTab.path.includes('/')
        ? activeTab.path.slice(0, activeTab.path.lastIndexOf('/'))
        : '';
    }

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal';

      const box = document.createElement('div');
      box.className = 'modal-content';

      const h2 = document.createElement('h2');
      h2.textContent = title;

      const p = document.createElement('p');
      p.className = 'modal-desc';
      p.textContent = desc;

      const labelFolder = document.createElement('label');
      labelFolder.textContent = 'Carpeta destino';

      const select = document.createElement('select');
      select.className = 'cod-select';

      const rootOpt = document.createElement('option');
      rootOpt.value = '';
      rootOpt.textContent = '/ (raíz del proyecto)';
      select.appendChild(rootOpt);

      folders.forEach((path) => {
        const opt = document.createElement('option');
        opt.value = path;
        opt.textContent = path;
        select.appendChild(opt);
      });
      select.value = (defaultFolder === '' || folders.includes(defaultFolder)) ? defaultFolder : '';

      const labelName = document.createElement('label');
      labelName.textContent = nameLabel;

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = namePlaceholder;
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.maxLength = 120;
      input.value = defaultName;

      const error = document.createElement('div');
      error.className = 'cod-dialog-error';

      const actions = document.createElement('div');
      actions.className = 'modal-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.textContent = 'Cancelar';

      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = 'btn btn-primary';
      okBtn.textContent = okLabel;

      actions.append(cancelBtn, okBtn);
      box.append(h2, p, labelFolder, select);
      if (!pickOnly) box.append(labelName, input, error);
      box.append(actions);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      let done = false;
      const close = (result) => {
        if (done) return;
        done = true;
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
        resolve(result);
      };

      const submit = () => {
        const parent = select.value;

        if (pickOnly) {
          close({ parent });
          return;
        }

        const name = input.value.trim();
        if (!name) { error.textContent = 'Escribe un nombre'; input.focus(); return; }
        if (/[\\\/]/.test(name) || name === '.' || name === '..') {
          error.textContent = 'No uses / ni \\ en el nombre';
          input.focus();
          return;
        }

        const fullPath = parent ? `${parent}/${name}` : name;
        if (fullPath !== currentPath && ctx.actions.findNodeByPath(fullPath)) {
          error.textContent = `Ya existe "${fullPath}"`;
          input.focus();
          return;
        }

        close({ parent, name });
      };

      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(null); }
        else if (e.key === 'Enter') { e.preventDefault(); submit(); }
      };

      cancelBtn.addEventListener('click', () => close(null));
      okBtn.addEventListener('click', submit);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
      input.addEventListener('input', () => { error.textContent = ''; });
      document.addEventListener('keydown', onKey, true);

      setTimeout(() => (pickOnly ? select : input).focus(), 60);
    });
  }

  window.CodDialog = { createEntry };
})();