/* =========================================================
   Plugin: Carpet
   Crea carpetas dentro del proyecto activo. Pantalla con
   carpeta destino arriba y nombre abajo.
   ========================================================= */

CodHestudio.register({
  id: 'carpet',
  name: 'Carpet',
  icon: 'folder-plus',
  description: 'Crea carpetas nuevas dentro del proyecto activo, en la carpeta que elijas.',
  version: '1.2.0',

  activate(ctx) {
    ctx.ui.addToolbarItem({
      id: 'carpet-btn',
      title: 'Crear carpeta',
      icon: 'folder-plus',
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
          title: 'Nueva carpeta',
          desc: 'Elige dónde se creará y escribe su nombre.',
          nameLabel: 'Nombre de la carpeta',
          namePlaceholder: 'mi-carpeta',
        });
        if (!result) return;

        try {
          await ctx.actions.createFolder(result.parent, result.name);
          ctx.actions.setStatus(`Carpeta "${result.name}" creada en ${result.parent || 'la raíz'}`);
        } catch (err) {
          console.error(err);
          ctx.actions.setStatus(`Error: ${err.message}`, true);
        }
      },
    });
  },
});
