/* =========================================================
   Plugin: Noty
   Notas rápidas por proyecto. Botón en la barra superior que
   abre una ventana con un bloc de notas. Se guarda solo.
   ========================================================= */

CodHestudio.register({
  id: 'noty',
  name: 'Noty',
  icon: 'sticky-note',
  description: 'Notas rápidas por proyecto, guardadas en el navegador.',
  version: '1.0.0',

  activate(ctx) {
    const STYLE_ID = 'noty-style';
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .noty-area {
        width: 100%;
        min-height: 260px;
        resize: vertical;
        padding: 12px;
        background: var(--bg-page);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        color: var(--text);
        font-family: var(--font-mono);
        font-size: 0.85rem;
        line-height: 1.6;
        outline: none;
      }
      .noty-area:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-subtle); background: var(--bg-surface); }
      .noty-meta { margin-top: 8px; font-size: 0.72rem; color: var(--text-tertiary); }
    `;
    document.head.appendChild(st);

    let timer = null;

    function openNotes() {
      const project = ctx.actions.getActiveProject();
      if (!project) {
        ctx.actions.setStatus('Abrí un proyecto primero', true);
        return;
      }
      const key = `notes:${project.id}`;
      const saved = ctx.storage.get(key, { text: '', updated: null });

      const overlay = document.createElement('div');
      overlay.className = 'modal';
      const box = document.createElement('div');
      box.className = 'modal-content';
      box.style.width = '560px';
      box.innerHTML = `
        <h2>Notas</h2>
        <p class="modal-desc"></p>
        <textarea class="noty-area" spellcheck="false" placeholder="Escribe aquí tus notas de este proyecto…"></textarea>
        <div class="noty-meta"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" data-act="close">Cerrar</button>
        </div>
      `;
      box.querySelector('.modal-desc').textContent = project.name;
      const area = box.querySelector('.noty-area');
      const meta = box.querySelector('.noty-meta');
      area.value = saved.text || '';
      const showMeta = (when) => {
        meta.textContent = when ? `Guardado ${new Date(when).toLocaleString()}` : 'Sin guardar aún';
      };
      showMeta(saved.updated);

      let pending = null;
      const persist = () => {
        const updated = new Date().toISOString();
        ctx.storage.set(key, { text: area.value, updated });
        showMeta(updated);
      };
      area.addEventListener('input', () => {
        clearTimeout(pending);
        pending = setTimeout(persist, 400);
      });

      function close() {
        clearTimeout(pending);
        if (area.value !== (saved.text || '')) persist();
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
      }
      function onKey(e) { if (e.key === 'Escape') close(); }

      box.querySelector('[data-act="close"]').addEventListener('click', close);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      document.addEventListener('keydown', onKey, true);

      overlay.appendChild(box);
      document.body.appendChild(overlay);
      setTimeout(() => area.focus(), 60);
    }

    ctx.ui.addToolbarItem({
      id: 'noty-btn',
      title: 'Notas rápidas del proyecto',
      icon: 'sticky-note',
      onClick: openNotes,
    });

    ctx.cleanup(() => {
      clearTimeout(timer);
      document.getElementById(STYLE_ID)?.remove();
    });
  },
});
