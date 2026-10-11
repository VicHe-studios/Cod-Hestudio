/* =========================================================
   Plugin: TheReader
   Muestra líneas, palabras y caracteres del archivo activo
   en la barra de estado.
   ========================================================= */

CodHestudio.register({
  id: 'thereader',
  name: 'TheReader',
  icon: 'book-open',
  description: 'Muestra líneas, palabras y caracteres del archivo activo en la barra de estado.',
  version: '1.0.0',

  activate(ctx) {
    const item = ctx.ui.addStatusItem({
      id: 'thereader-status',
      title: 'Estadísticas del archivo activo',
      text: '—',
      icon: 'book-open',
    });

    const refresh = () => {
      const tab = ctx.actions.getActiveTab();
      if (!tab) {
        item.update({ text: '—', title: 'Sin archivo abierto' });
        return;
      }
      const text = tab.model.getValue();
      const trimmed = text.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      const lines = tab.model.getLineCount();
      item.update({
        text: `${lines} líneas · ${words} palabras · ${text.length} car.`,
        title: tab.path,
      });
    };

    ctx.on('editor:ready', refresh);
    ctx.on('file:open', refresh);
    ctx.on('model:change', refresh);
    ctx.on('tab:change', refresh);
    ctx.on('file:close', refresh);

    refresh();
  },
});
