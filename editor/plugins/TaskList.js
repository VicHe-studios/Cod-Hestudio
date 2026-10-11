/* =========================================================
   Plugin: Lista de tareas
   Checklist por proyecto. Botón en la barra superior que abre
   la lista: agregas tareas, las marcas como hechas o las borras.
   Se guarda en el navegador.
   ========================================================= */

CodHestudio.register({
  id: 'tasklist',
  name: 'Lista de tareas',
  icon: 'list-checks',
  description: 'Checklist de tareas por proyecto, guardada en el navegador.',
  version: '1.0.0',

  activate(ctx) {
    const STYLE_ID = 'tasks-style';
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .tl-add { display: flex; gap: 8px; margin-top: 14px; }
      .tl-add input {
        flex: 1;
        padding: 9px 12px;
        background: var(--bg-page);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        color: var(--text);
        font-family: var(--font);
        font-size: 0.88rem;
        outline: none;
      }
      .tl-add input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-subtle); background: var(--bg-surface); }
      .tl-list { list-style: none; margin-top: 12px; max-height: 340px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
      .tl-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: var(--r-sm);
        border: 1px solid var(--border);
        background: var(--bg-page);
      }
      .modal-content .tl-item label {
        flex: 1;
        margin: 0;
        display: block;
        font-size: 0.88rem;
        font-weight: 400;
        text-transform: none;
        letter-spacing: normal;
        line-height: 1.4;
        color: var(--text);
        cursor: pointer;
        word-break: break-word;
      }
      .modal-content .tl-item.done label { text-decoration: line-through; color: var(--text-tertiary); }
      .tl-item input[type="checkbox"] {
        appearance: none;
        -webkit-appearance: none;
        flex-shrink: 0;
        margin: 0;
        width: 18px;
        height: 18px;
        border: 1.5px solid var(--border-strong);
        border-radius: 5px;
        background: var(--bg-surface);
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
      }
      .tl-item input[type="checkbox"]:hover { border-color: var(--accent); }
      .tl-item input[type="checkbox"]:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--accent-subtle); }
      .tl-item input[type="checkbox"]:checked {
        background-color: var(--accent);
        border-color: var(--accent);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FFFFFF' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");
        background-size: 12px 12px;
        background-position: center;
        background-repeat: no-repeat;
      }
      .tl-del {
        width: 26px; height: 26px; flex-shrink: 0;
        display: inline-flex; align-items: center; justify-content: center;
        border: none; background: transparent; border-radius: var(--r-xs);
        color: var(--text-tertiary); cursor: pointer;
      }
      .tl-del:hover { background: rgba(180,35,24,0.1); color: var(--danger); }
      .tl-empty { font-size: 0.85rem; color: var(--text-tertiary); font-style: italic; padding: 12px 4px; }
      .tl-count { font-size: 0.75rem; color: var(--text-tertiary); margin-top: 10px; }
    `;
    document.head.appendChild(st);

    function openTasks() {
      const project = ctx.actions.getActiveProject();
      if (!project) {
        ctx.actions.setStatus('Abrí un proyecto primero', true);
        return;
      }
      const key = `tasks:${project.id}`;
      let tasks = ctx.storage.get(key, []);
      const save = () => ctx.storage.set(key, tasks);

      const overlay = document.createElement('div');
      overlay.className = 'modal';
      const box = document.createElement('div');
      box.className = 'modal-content';
      box.style.width = '480px';
      box.innerHTML = `
        <h2>Tareas</h2>
        <p class="modal-desc"></p>
        <div class="tl-add">
          <input type="text" placeholder="Nueva tarea…" maxlength="200" autocomplete="off">
          <button type="button" class="btn btn-primary" data-act="add">Agregar</button>
        </div>
        <ul class="tl-list"></ul>
        <div class="tl-count"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" data-act="close">Cerrar</button>
        </div>
      `;
      box.querySelector('.modal-desc').textContent = project.name;
      const input = box.querySelector('.tl-add input');
      const list = box.querySelector('.tl-list');
      const count = box.querySelector('.tl-count');

      function render() {
        list.innerHTML = '';
        if (tasks.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'tl-empty';
          empty.textContent = 'Sin tareas. Escribe una arriba y pulsa Enter.';
          list.appendChild(empty);
        }
        tasks.forEach((t) => {
          const li = document.createElement('li');
          li.className = 'tl-item' + (t.done ? ' done' : '');

          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = t.done;
          const id = `tl-${t.id}`;
          cb.id = id;

          const label = document.createElement('label');
          label.htmlFor = id;
          label.textContent = t.text;

          const del = document.createElement('button');
          del.type = 'button';
          del.className = 'tl-del';
          del.title = 'Borrar tarea';
          del.textContent = '×';

          cb.addEventListener('change', () => {
            t.done = cb.checked;
            save();
            render();
          });
          del.addEventListener('click', () => {
            tasks = tasks.filter(x => x.id !== t.id);
            save();
            render();
          });

          li.append(cb, label, del);
          list.appendChild(li);
        });
        const done = tasks.filter(t => t.done).length;
        count.textContent = tasks.length ? `${done} de ${tasks.length} hechas` : '';
      }

      function add() {
        const text = input.value.trim();
        if (!text) return;
        tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, done: false });
        input.value = '';
        save();
        render();
        input.focus();
      }

      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
      box.querySelector('[data-act="add"]').addEventListener('click', add);

      function close() {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
      }
      function onKey(e) { if (e.key === 'Escape') close(); }
      box.querySelector('[data-act="close"]').addEventListener('click', close);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      document.addEventListener('keydown', onKey, true);

      overlay.appendChild(box);
      document.body.appendChild(overlay);
      render();
      setTimeout(() => input.focus(), 60);
    }

    ctx.ui.addToolbarItem({
      id: 'tasklist-btn',
      title: 'Lista de tareas del proyecto',
      icon: 'list-checks',
      onClick: openTasks,
    });

    ctx.cleanup(() => document.getElementById(STYLE_ID)?.remove());
  },
});