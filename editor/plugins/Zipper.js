/* =========================================================
   Plugin: Zipper
   Empaqueta el proyecto activo en un .zip y lo descarga.
   Usa JSZip desde jsDelivr (versión fija). Omite node_modules,
   .git, dist, build y otras carpetas de caché, igual que el sync.
   Usa lo que está guardado en disco.
   ========================================================= */

const __zpSkip = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.cache'];
const __zpLib = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

function __zpLoadLib() {
  if (window.JSZip) return Promise.resolve();
  return new Promise((resolve, reject) => {
    // Monaco define una función global `define` (AMD). Si está presente, JSZip
    // se registra como módulo y no como window.JSZip, así que la ocultamos un momento.
    const savedDefine = window.define;
    window.define = undefined;
    const restore = () => { window.define = savedDefine; };

    const s = document.createElement('script');
    s.src = __zpLib;
    s.onload = () => {
      restore();
      if (window.JSZip) resolve();
      else reject(new Error('JSZip no se registró en la página'));
    };
    s.onerror = () => {
      restore();
      reject(new Error('No se pudo cargar JSZip'));
    };
    document.head.appendChild(s);
  });
}

async function __zpScan(dir, prefix = '', out = []) {
  for await (const entry of dir.values()) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === 'directory') {
      if (__zpSkip.includes(entry.name)) continue;
      await __zpScan(entry, path, out);
    } else {
      out.push({ path, handle: entry });
    }
  }
  return out;
}

CodHestudio.register({
  id: 'zipper',
  name: 'Zipper',
  icon: 'file-archive',
  description: 'Empaqueta el proyecto activo en un archivo .zip para descargarlo.',
  version: '1.0.0',

  activate(ctx) {
    let busy = false;

    async function zipProject() {
      const project = ctx.actions.getActiveProject();
      if (!project) {
        ctx.actions.setStatus('Abrí un proyecto primero', true);
        return;
      }
      if (busy) return;
      busy = true;

      try {
        ctx.actions.setStatus('Preparando .zip…', true);
        await __zpLoadLib();

        const files = await __zpScan(project.handle);
        if (files.length === 0) throw new Error('El proyecto no tiene archivos');

        const zip = new window.JSZip();
        let done = 0;
        for (const f of files) {
          const bytes = await (await f.handle.getFile()).arrayBuffer();
          zip.file(f.path, bytes);
          done++;
          if (done % 25 === 0) ctx.actions.setStatus(`Empaquetando ${done}/${files.length}…`, true);
        }

        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        const dirty = ctx.actions.getOpenTabs().filter(t => t.dirty).length;
        const note = dirty ? ` · ${dirty} con cambios sin guardar no se incluyeron` : '';
        ctx.actions.setStatus(`ZIP creado: ${files.length} archivo(s)${note}`, !!note);
      } catch (err) {
        console.error(err);
        ctx.actions.setStatus(`Error al crear el .zip: ${err.message}`, true);
      } finally {
        busy = false;
      }
    }

    // Botón en la barra inferior, junto a GitHub y antes de Guardar
    const actionsBox = document.querySelector('.statusbar-actions');
    const saveBtnEl = document.getElementById('saveBtn');
    const zipBtn = document.createElement('button');
    zipBtn.type = 'button';
    zipBtn.id = 'zipper-btn';
    zipBtn.className = 'statusbar-btn';
    zipBtn.title = 'Descargar proyecto como .zip';
    zipBtn.innerHTML = '<i data-lucide="file-archive"></i><span class="statusbar-btn-label">ZIP</span>';
    zipBtn.addEventListener('click', zipProject);
    if (actionsBox) actionsBox.insertBefore(zipBtn, saveBtnEl || actionsBox.firstChild);
    if (window.lucide) lucide.createIcons();

    ctx.cleanup(() => zipBtn.remove());
  },
});