/* =========================================================
   Plugin: TrashGang
   Botón de borrar en cada fila del árbol de archivos.
   Se coloca en el contenedor de acciones de la fila, en el
   orden en que se activaron los plugins.
   ========================================================= */

async function __tgFindChild(dir, name) {
  try {
    const handle = await dir.getFileHandle(name);
    return { kind: 'file', handle };
  } catch {}
  try {
    const handle = await dir.getDirectoryHandle(name);
    return { kind: 'directory', handle };
  } catch {}
  return null;
}

async function __tgResolve(root, path) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.some(p => p === '.' || p === '..')) return null;

  let dir = root;
  for (let i = 0; i < parts.length - 1; i++) {
    try { dir = await dir.getDirectoryHandle(parts[i]); }
    catch { return null; }
  }

  const name = parts[parts.length - 1];
  const child = await __tgFindChild(dir, name);
  if (!child) return null;
  return { parent: dir, name, kind: child.kind, handle: child.handle };
}

async function __tgDelete(ctx, path) {
  const project = ctx.actions.getActiveProject();
  if (!project) return;

  const entry = await __tgResolve(project.handle, path);
  if (!entry) {
    ctx.actions.setStatus(`No existe: ${path}`, true);
    return;
  }

  const what = entry.kind === 'directory' ? 'la carpeta' : 'el archivo';
  if (!confirm(`¿Borrar ${what} "${path}"?\nEsta acción no se puede deshacer.`)) return;

  const affected = ctx.actions.getOpenTabs()
    .filter(t => t.path === path || t.path.startsWith(path + '/'));

  if (affected.some(t => t.dirty)) {
    ctx.actions.setStatus('Hay cambios sin guardar en esa ruta. Guárdalos o ciérralos primero', true);
    return;
  }

  affected.forEach(t => ctx.actions.closeTab(t.path));

  try {
    await entry.parent.removeEntry(entry.name, { recursive: entry.kind === 'directory' });
    await ctx.actions.refreshFileTree();
    ctx.actions.setStatus(`Borrado: ${path}`);
  } catch (err) {
    console.error(err);
    ctx.actions.setStatus(`Error al borrar: ${err.message}`, true);
  }
}

CodHestudio.register({
  id: 'trashgang',
  name: 'TrashGang',
  icon: 'trash-2',
  description: 'Botón de borrar en cada archivo o carpeta del árbol.',
  version: '2.1.0',

  activate(ctx) {
    ctx.on('tree:item', (li, node, actions) => {
      if (actions.querySelector(`[data-plugin="${ctx.id}"]`)) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tree-action-btn danger';
      btn.dataset.plugin = ctx.id;
      btn.title = `Borrar ${node.name}`;
      btn.innerHTML = '<i data-lucide="trash-2"></i>';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        __tgDelete(ctx, node.path);
      });

      actions.appendChild(btn);
    });

    ctx.cleanup(() => {
      document.querySelectorAll(`.tree-action-btn[data-plugin="${ctx.id}"]`).forEach(b => b.remove());
    });

    ctx.actions.refreshFileTree();
  },
});
