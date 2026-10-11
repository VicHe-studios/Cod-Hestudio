/* =========================================================
   Plugin: Searchering
   Buscador de archivos en el panel de archivos, debajo del
   título del proyecto.
   Escribe parte del nombre; Enter abre el primer resultado.
   ========================================================= */

CodHestudio.register({
  id: 'searchering',
  name: 'Searchering',
  icon: 'search',
  description: 'Buscador de archivos en el panel de archivos.',
  version: '1.0.0',

  activate(ctx) {
    const STYLE_ID = 'sr-style';
    if (!document.getElementById(STYLE_ID)) {
      const st = document.createElement('style');
      st.id = STYLE_ID;
      st.textContent = `
        .sr-box {
          flex-shrink: 0;
          border-bottom: 1px solid var(--border);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sr-input-wrap { position: relative; }
        .sr-input-wrap [data-lucide] {
          position: absolute;
          left: 9px;
          top: 50%;
          transform: translateY(-50%);
          width: 14px;
          height: 14px;
          color: var(--text-tertiary);
          pointer-events: none;
        }
        .sr-input-wrap input {
          width: 100%;
          padding: 7px 10px 7px 30px;
          background: var(--bg-page);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          color: var(--text);
          font-family: var(--font);
          font-size: 0.8rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .sr-input-wrap input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-subtle);
          background: var(--bg-surface);
        }
        .sr-results {
          list-style: none;
          max-height: 30vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .sr-results:empty { display: none; }
        .sr-results li {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          padding: 5px 6px;
          border-radius: var(--r-xs);
          cursor: pointer;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }
        .sr-results li:hover { background: var(--bg-page); color: var(--text); }
        .sr-results li [data-lucide] { width: 13px; height: 13px; flex-shrink: 0; }
        .sr-name {
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sr-path {
          margin-left: auto;
          max-width: 50%;
          font-size: 0.68rem;
          color: var(--text-tertiary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sr-empty {
          cursor: default !important;
          color: var(--text-tertiary) !important;
          font-style: italic;
        }
      `;
      document.head.appendChild(st);
    }

    const box = document.createElement('div');
    box.className = 'sr-box';
    box.innerHTML = `
      <div class="sr-input-wrap">
        <i data-lucide="search"></i>
        <input type="text" placeholder="Buscar archivo…" autocomplete="off" spellcheck="false">
      </div>
      <ul class="sr-results"></ul>
    `;

    const header = document.querySelector('.filetree-header');
    const filetree = document.querySelector('.filetree');
    if (header) header.after(box);
    else if (filetree) filetree.prepend(box);

    const input = box.querySelector('input');
    const list = box.querySelector('.sr-results');
    let results = [];

    function collectFiles(nodes, out) {
      for (const n of nodes) {
        if (n.kind === 'file') out.push(n);
        else if (n.children?.length) collectFiles(n.children, out);
      }
      return out;
    }

    function render() {
      list.innerHTML = '';
      results = [];

      const q = input.value.trim().toLowerCase();
      const project = ctx.actions.getActiveProject();
      if (!q || !project) return;

      results = collectFiles(project.tree, [])
        .filter(n => n.name.toLowerCase().includes(q))
        .sort((a, b) => a.path.localeCompare(b.path))
        .slice(0, 50);

      if (results.length === 0) {
        const li = document.createElement('li');
        li.className = 'sr-empty';
        li.textContent = 'Sin resultados';
        list.appendChild(li);
      }

      results.forEach((node) => {
        const li = document.createElement('li');
        li.innerHTML = `<i data-lucide="file"></i>`;

        const name = document.createElement('span');
        name.className = 'sr-name';
        name.textContent = node.name;

        const path = document.createElement('span');
        path.className = 'sr-path';
        const folder = node.path.includes('/') ? node.path.slice(0, node.path.lastIndexOf('/')) : '';
        path.textContent = folder;

        li.append(name, path);
        li.addEventListener('click', () => ctx.actions.openFile(node));
        list.appendChild(li);
      });

      if (window.lucide) lucide.createIcons();
    }

    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && results[0]) {
        e.preventDefault();
        ctx.actions.openFile(results[0]);
      } else if (e.key === 'Escape') {
        input.value = '';
        render();
      }
    });

    ctx.on('project:select', () => {
      input.value = '';
      render();
    });

    if (window.lucide) lucide.createIcons();

    ctx.cleanup(() => {
      box.remove();
      document.getElementById(STYLE_ID)?.remove();
    });
  },
});