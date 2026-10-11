/* =========================================================
   Plugin: Moving Truck
   Botón de mover en cada fila del árbol. Eliges la carpeta
   de destino y el nombre viene prellenado (puedes cambiarlo).
   Requiere Chrome o Edge recientes (FileSystemHandle.move).
   ========================================================= */

async function __mtFindChild(dir, name) {
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

async function __mtResolve(root, path) {
  if (!path) return { parent: null, name: '', kind: 'directory', handle: root };
  const parts = path.split('/').filter(Boolean);
  if (parts.some(p => p === '.' || p === '..')) return null;

  let dir = root;
  for (let i = 0; i < parts.length - 1; i++) {
    try { dir = await dir.getDirectoryHandle(parts[i]); }
    catch { return null; }
  }

  const name = parts[parts.length - 1];
  const child = await __mtFindChild(dir, name);
  if (!child) return null;
  return { parent: dir, name, kind: child.kind, handle: child.handle };
}

async function __mtMove(ctx, node) {
  const project = ctx.actions.getActiveProject();
  if (!project) return;
  if (!window.CodDialog) {
    ctx.actions.setStatus('Falta CodDialog.js en jsplugins.js', true);
    return;
  }

  const currentParent = node.path.includes('/')
    ? node.path.slice(0, node.path.lastIndexOf('/'))
    : '';

  const result = await window.CodDialog.createEntry(ctx, {
    title: `Mover "${node.name}"`,
    desc: 'Elige la carpeta de destino. Puedes cambiar el nombre si quieres.',
    nameLabel: 'Nombre',
    namePlaceholder: node.name,
    defaultName: node.name,
    defaultFolder: currentParent,
    currentPath: node.path,
    excludePath: node.kind === 'directory' ? node.path : null,
    okLabel: 'Mover',
  });
  if (!result) return;

  const dest = result.parent;
  const newName = result.name;
  if (dest === currentParent && newName === node.name) return;

  const destPath = dest ? `${dest}/${newName}` : newName;
  if (ctx.actions.findNodeByPath(destPath)) {
    ctx.actions.setStatus(`Ya existe "${destPath}" en el destino`, true);
    return;
  }

  const src = await __mtResolve(project.handle, node.path);
  const destEntry = await __mtResolve(project.handle, dest);
  if (!src) { ctx.actions.setStatus(`No existe: ${node.path}`, true); return; }
  if (!destEntry || destEntry.kind !== 'directory') {
    ctx.actions.setStatus(`La carpeta destino no existe: ${dest}`, true);
    return;
  }

  const affected = ctx.actions.getOpenTabs()
    .filter(t => t.path === node.path || t.path.startsWith(node.path + '/'));

  if (affected.some(t => t.dirty)) {
    ctx.actions.setStatus('Hay cambios sin guardar en esa ruta. Guárdalos o ciérralos primero', true);
    return;
  }

  if (typeof src.handle.move !== 'function') {
    ctx.actions.setStatus('Tu navegador no soporta mover. Usa Chrome o Edge recientes', true);
    return;
  }

  affected.forEach(t => ctx.actions.closeTab(t.path));

  try {
    await src.handle.move(destEntry.handle, newName);
    await ctx.actions.refreshFileTree();
    ctx.actions.setStatus(`Movido: ${node.path} → ${destPath}`);
  } catch (err) {
    console.error(err);
    ctx.actions.setStatus(`Error al mover: ${err.message}`, true);
  }
}

CodHestudio.register({
  id: 'movingtruck',
  name: 'Moving Truck',
  icon: 'truck',
  description: 'Botón de mover en cada archivo o carpeta del árbol.',
  version: '1.0.0',

  activate(ctx) {
    ctx.on('tree:item', (li, node, actions) => {
      if (actions.querySelector(`[data-plugin="${ctx.id}"]`)) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tree-action-btn';
      btn.dataset.plugin = ctx.id;
      btn.title = `Mover ${node.name}`;
      btn.innerHTML = '<i data-lucide="truck"></i>';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        __mtMove(ctx, node);
      });

      actions.appendChild(btn);
    });

    ctx.cleanup(() => {
      document.querySelectorAll(`.tree-action-btn[data-plugin="${ctx.id}"]`).forEach(b => b.remove());
    });

    ctx.actions.refreshFileTree();
  },
});