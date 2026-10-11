/* =========================================================
   Plugin: Starry
   Ordena tus proyectos arrastrándolos en la lista.
   El orden se guarda en el navegador y se aplica al abrir.
   Requiere el evento "projects:render" de script.js.
   ========================================================= */

CodHestudio.register({
  id: 'starry',
  name: 'Starry',
  icon: 'star',
  description: 'Ordena tus proyectos arrastrándolos en la lista. El orden se recuerda.',
  version: '1.0.0',

  activate(ctx) {
    const STYLE_ID = 'starry-style';
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .project-item.starry-dragging { opacity: 0.45; }
      .project-item.starry-before { box-shadow: inset 0 2px 0 var(--accent); }
      .project-item.starry-after  { box-shadow: inset 0 -2px 0 var(--accent); }
    `;
    document.head.appendChild(st);

    const list = document.getElementById('projectsList');
    let dragging = null;

    function savedOrder() {
      return ctx.storage.get('order', []);
    }

    // Reordena las filas según el orden guardado. Los proyectos nuevos van al final.
    function applyOrder(container) {
      const order = savedOrder();
      const rank = (id) => {
        const i = order.indexOf(id);
        return i === -1 ? Infinity : i;
      };
      const items = [...container.children].filter(li => li.dataset.projectId);
      items.sort((a, b) => rank(a.dataset.projectId) - rank(b.dataset.projectId));
      items.forEach(li => {
        li.draggable = true;
        container.appendChild(li);
      });
    }

    function saveOrderFromDom() {
      const ids = [...list.children]
        .map(li => li.dataset.projectId)
        .filter(Boolean);
      ctx.storage.set('order', ids);
    }

    function clearIndicators() {
      list.querySelectorAll('.starry-before, .starry-after')
        .forEach(li => li.classList.remove('starry-before', 'starry-after'));
    }

    function onDragStart(e) {
      const li = e.target.closest('.project-item');
      if (!li || !li.dataset.projectId) return;
      dragging = li;
      li.classList.add('starry-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', li.dataset.projectId);
    }

    function onDragOver(e) {
      const li = e.target.closest('.project-item');
      if (!dragging || !li || li === dragging) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const r = li.getBoundingClientRect();
      const before = e.clientY < r.top + r.height / 2;
      clearIndicators();
      li.classList.add(before ? 'starry-before' : 'starry-after');
    }

    function onDrop(e) {
      const li = e.target.closest('.project-item');
      if (!dragging || !li || li === dragging) return;
      e.preventDefault();
      const r = li.getBoundingClientRect();
      const before = e.clientY < r.top + r.height / 2;
      list.insertBefore(dragging, before ? li : li.nextSibling);
      clearIndicators();
      saveOrderFromDom();
    }

    function onDragEnd() {
      if (dragging) dragging.classList.remove('starry-dragging');
      dragging = null;
      clearIndicators();
    }

    list.addEventListener('dragstart', onDragStart);
    list.addEventListener('dragover', onDragOver);
    list.addEventListener('drop', onDrop);
    list.addEventListener('dragend', onDragEnd);

    ctx.on('projects:render', (container) => applyOrder(container));

    // Aplica el orden guardado a la lista que ya está dibujada
    applyOrder(list);

    ctx.cleanup(() => {
      list.removeEventListener('dragstart', onDragStart);
      list.removeEventListener('dragover', onDragOver);
      list.removeEventListener('drop', onDrop);
      list.removeEventListener('dragend', onDragEnd);
      list.querySelectorAll('.project-item').forEach(li => { li.draggable = false; });
      clearIndicators();
      document.getElementById(STYLE_ID)?.remove();
    });
  },
});
