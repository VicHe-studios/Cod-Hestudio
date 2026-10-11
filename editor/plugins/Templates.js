/* =========================================================
   Plugin: Templates
   Crea una página HTML nueva con una plantilla de inicio.
   Eliges la carpeta y el nombre en la misma pantalla.
   ========================================================= */

function __tplEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function __tplHtml(title) {
  const t = __tplEscape(title);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #F7F8FA;
      color: #101828;
    }
    main { text-align: center; padding: 24px; }
    h1 { font-size: 2rem; margin-bottom: 8px; }
    p { color: #475467; }
  </style>
</head>
<body>
  <main>
    <h1>${t}</h1>
    <p>Empieza a escribir aquí.</p>
  </main>
</body>
</html>
`;
}

CodHestudio.register({
  id: 'templates',
  name: 'Templates',
  icon: 'file-code-2',
  description: 'Crea una página HTML nueva con plantilla de inicio.',
  version: '1.0.0',

  activate(ctx) {
    ctx.ui.addToolbarItem({
      id: 'templates-btn',
      title: 'Nueva página HTML con plantilla',
      icon: 'file-code-2',
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
          title: 'Nueva página HTML',
          desc: 'Crea una página con plantilla de inicio. Elige la carpeta y el nombre.',
          nameLabel: 'Nombre del archivo',
          namePlaceholder: 'index.html',
        });
        if (!result) return;

        let name = result.name;
        if (!/\.html?$/i.test(name)) name += '.html';

        const fullPath = result.parent ? `${result.parent}/${name}` : name;
        if (ctx.actions.findNodeByPath(fullPath)) {
          ctx.actions.setStatus(`Ya existe "${fullPath}". No se sobrescribe`, true);
          return;
        }

        const title = name.replace(/\.html?$/i, '');

        try {
          await ctx.actions.createFile(result.parent, name, __tplHtml(title));
          const node = ctx.actions.findNodeByPath(fullPath);
          if (node) ctx.actions.openFile(node);
          ctx.actions.setStatus(`Página "${name}" creada`);
        } catch (err) {
          console.error(err);
          ctx.actions.setStatus(`Error: ${err.message}`, true);
        }
      },
    });
  },
});
