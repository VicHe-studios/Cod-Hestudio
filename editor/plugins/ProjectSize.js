/* =========================================================
   Plugin: Peso del proyecto
   Muestra en la barra de estado el peso total del proyecto
   activo y su número de archivos. Al pasar el cursor se ven
   las extensiones que más ocupan. Clic para recalcular.
   ========================================================= */

const __psSkip = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.cache'];

function __psFormat(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function __psScan(dir, prefix = '', out = []) {
  for await (const entry of dir.values()) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === 'directory') {
      if (__psSkip.includes(entry.name)) continue;
      await __psScan(entry, path, out);
    } else {
      out.push({ path, handle: entry });
    }
  }
  return out;
}

CodHestudio.register({
  id: 'projectsize',
  name: 'Peso del proyecto',
  icon: 'hard-drive',
  description: 'Muestra el peso y el número de archivos del proyecto en la barra de estado.',
  version: '1.0.0',

  activate(ctx) {
    const item = ctx.ui.addStatusItem({
      id: 'projectsize-status',
      title: 'Peso del proyecto (clic para recalcular)',
      text: 'Peso: —',
      icon: 'hard-drive',
      onClick: () => measure(),
    });

    let timer = null;
    let running = false;

    async function measure() {
      const project = ctx.actions.getActiveProject();
      if (!project) {
        item.update({ text: 'Peso: —', title: 'Abre un proyecto' });
        return;
      }
      if (running) return;
      running = true;
      item.update({ text: 'Peso: calculando…' });

      try {
        const files = await __psScan(project.handle);
        let total = 0;
        const byExt = new Map();

        for (const f of files) {
          const size = (await f.handle.getFile()).size;
          total += size;
          const dot = f.path.lastIndexOf('.');
          const ext = dot > 0 ? f.path.slice(dot + 1).toLowerCase() : '(sin extensión)';
          byExt.set(ext, (byExt.get(ext) || 0) + size);
        }

        const top = [...byExt.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([ext, size]) => `.${ext}: ${__psFormat(size)}`)
          .join('\n');

        item.update({
          text: `Peso: ${__psFormat(total)} · ${files.length} archivo(s)`,
          title: `Peso del proyecto (clic para recalcular)\n${top || 'Sin archivos'}`,
        });
      } catch (err) {
        console.error(err);
        item.update({ text: 'Peso: error', title: err.message });
      } finally {
        running = false;
      }
    }

    // Recalcula después de cambios, con una pausa para no leer el disco en cada tecla
    function scheduleMeasure() {
      clearTimeout(timer);
      timer = setTimeout(measure, 800);
    }

    ctx.on('project:select', scheduleMeasure);
    ctx.on('tree:refresh', scheduleMeasure);
    ctx.on('file:save', scheduleMeasure);

    measure();

    ctx.cleanup(() => clearTimeout(timer));
  },
});
