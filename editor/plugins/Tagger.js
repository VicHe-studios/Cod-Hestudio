/* =========================================================
   Plugin: Tagger
   Botón de renombrar en cada fila del árbol de archivos.
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

async function __tagRename(ctx, path) {
  const project = ctx.actions.getActiveProject();
  if (!project) return;

  const entry = await __tgResolve(project.handle, path);
  if (!entry) {
    ctx.actions.setStatus(`No existe: ${path}`, true);
    return;
  }

  const newName = await ctx.ui.prompt({
    title: 'Renombrar',
    desc: 'Solo el nombre, sin la ruta.',
    placeholder: entry.name,
    defaultValue: entry.name,
  });
  if (!newName || newName === entry.name) return;

  if (/[\\\/]/.test(newName) || newName === '.' || newName === '..') {
    ctx.actions.setStatus('Nombre inválido: no uses / ni \\', true);
    return;
  }

  if (await __tgFindChild(entry.parent, newName)) {
    ctx.actions.setStatus(`Ya existe "${newName}" en esa carpeta`, true);
    return;
  }

  const slash = path.lastIndexOf('/');
  const dirPath = slash === -1 ? '' : path.slice(0, slash);
  const newPath = dirPath ? `${dirPath}/${newName}` : newName;

  const affected = ctx.actions.getOpenTabs()
    .filter(t => t.path === path || t.path.startsWith(path + '/'));

  if (affected.some(t => t.dirty)) {
    ctx.actions.setStatus('Hay cambios sin guardar en esa ruta. Guárdalos o ciérralos primero', true);
    return;
  }

  if (typeof entry.handle.move !== 'function') {
    ctx.actions.setStatus('Tu navegador no soporta renombrar. Usa Chrome o Edge recientes', true);
    return;
  }

  affected.forEach(t => ctx.actions.closeTab(t.path));

  try {
    await entry.handle.move(newName);
    await ctx.actions.refreshFileTree();
    ctx.actions.setStatus(`Renombrado: ${path} → ${newPath}`);
  } catch (err) {
    console.error(err);
    ctx.actions.setStatus(`Error al renombrar: ${err.message}`, true);
  }
}

CodHestudio.register({
  id: 'tagger',
  name: 'Tagger',
  icon: 'tag',
  description: 'Botón de renombrar en cada archivo o carpeta del árbol.',
  version: '2.0.0',

  activate(ctx) {
    ctx.on('tree:item', (li, node, actions) => {
      if (actions.querySelector(`[data-plugin="${ctx.id}"]`)) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tree-action-btn';
      btn.dataset.plugin = ctx.id;
      btn.title = `Renombrar ${node.name}`;
      btn.innerHTML = '<i data-lucide="tag"></i>';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        __tagRename(ctx, node.path);
      });

      actions.appendChild(btn);
    });

    ctx.cleanup(() => {
      document.querySelectorAll(`.tree-action-btn[data-plugin="${ctx.id}"]`).forEach(b => b.remove());
    });

    ctx.actions.refreshFileTree();
  },
});
