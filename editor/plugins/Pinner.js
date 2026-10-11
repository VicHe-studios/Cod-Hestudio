/* =========================================================
   Plugin: Pinner
   Fija hasta 3 archivos por proyecto. Al abrir el proyecto,
   sus archivos fijados se abren solos en pestañas.
   Botón de chincheta en cada archivo del árbol.
   ========================================================= */

const __pnMax = 3;

CodHestudio.register({
  id: 'pinner',
  name: 'Pinner',
  icon: 'pin',
  description: 'Fija hasta 3 archivos por proyecto. Se abren solos al entrar al proyecto.',
  version: '1.0.0',

  activate(ctx) {
    const STYLE_ID = 'pinner-style';
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `.tree-action-btn.pinned { color: var(--accent-text); }`;
    document.head.appendChild(st);

    const pinsKey = (projectId) => `pins:${projectId}`;
    const getPins = (projectId) => ctx.storage.get(pinsKey(projectId), []);
    const setPins = (projectId, pins) => ctx.storage.set(pinsKey(projectId), pins);

    // Botón de chincheta en cada archivo del árbol
    ctx.on('tree:item', (li, node, actions) => {
      if (node.kind !== 'file') return;
      if (actions.querySelector(`[data-plugin="${ctx.id}"]`)) return;

      const project = ctx.actions.getActiveProject();
      if (!project) return;
      const pinned = getPins(project.id).includes(node.path);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tree-action-btn' + (pinned ? ' pinned' : '');
      btn.dataset.plugin = ctx.id;
      btn.title = pinned ? 'Quitar de fijados' : 'Fijar (se abre al entrar al proyecto)';
      btn.innerHTML = '<i data-lucide="pin"></i>';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePin(project.id, node.path, btn);
      });

      actions.appendChild(btn);
    });

    function togglePin(projectId, path, btn) {
      const pins = getPins(projectId);
      const i = pins.indexOf(path);
      if (i !== -1) {
        pins.splice(i, 1);
        btn.classList.remove('pinned');
        btn.title = 'Fijar (se abre al entrar al proyecto)';
        ctx.actions.setStatus(`Quitado de fijados: ${path}`);
      } else {
        if (pins.length >= __pnMax) {
          ctx.actions.setStatus(`Máximo ${__pnMax} archivos fijados por proyecto`, true);
          return;
        }
        pins.push(path);
        btn.classList.add('pinned');
        btn.title = 'Quitar de fijados';
        ctx.actions.setStatus(`Fijado: ${path}`);
      }
      setPins(projectId, pins);
    }

    // Al entrar a un proyecto, abre sus archivos fijados
    ctx.on('project:select', async (project) => {
      const pins = getPins(project.id);
      const alive = [];
      for (const path of pins) {
        const node = ctx.actions.findNodeByPath(path);
        if (node && node.kind === 'file') {
          alive.push(path);
          await ctx.actions.openFile(node);
        }
      }
      // Limpia de la lista los archivos que ya no existen
      if (alive.length !== pins.length) setPins(project.id, alive);
    });

    ctx.cleanup(() => {
      document.querySelectorAll(`.tree-action-btn[data-plugin="${ctx.id}"]`).forEach(b => b.remove());
      document.getElementById(STYLE_ID)?.remove();
    });

    ctx.actions.refreshFileTree();
  },
});
