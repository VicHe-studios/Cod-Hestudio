/* =========================================================
   Plugin: Archive
   Crea archivos vacíos dentro del proyecto activo. Pantalla
   con carpeta destino arriba y nombre abajo.
   ========================================================= */

CodHestudio.register({
  id: 'archive',
  name: 'Archive',
  icon: 'file-plus',
  description: 'Crea archivos nuevos dentro del proyecto activo, en la carpeta que elijas.',
  version: '1.2.0',

  activate(ctx) {
    ctx.ui.addToolbarItem({
      id: 'archive-btn',
      title: 'Crear archivo',
      icon: 'file-plus',
      onClick: async () => {
        if (!ctx.actions.getActiveProject()) {
          ctx.actions.setStatus('Abrí un proyecto primero', true);
          return;
        }
        if (!window.CodDialog) {
          ctx.actions.setStatus('Falta CodDialog.js en jsplugins.js', true);
          return;
        }

        const result = await window.CodDialog.createEntry(ctx, {
          title: 'Nuevo archivo',
          desc: 'Elige dónde se creará y escribe su nombre con extensión.',
          nameLabel: 'Nombre del archivo',
          namePlaceholder: 'index.html',
        });
        if (!result) return;

        try {
          await ctx.actions.createFile(result.parent, result.name, '');
          ctx.actions.setStatus(`Archivo "${result.name}" creado en ${result.parent || 'la raíz'}`);
        } catch (err) {
          console.error(err);
          ctx.actions.setStatus(`Error: ${err.message}`, true);
        }
      },
    });
  },
});
