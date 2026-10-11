/* =========================================================
   Plugin: Preview
   Abre la página HTML del proyecto en una ventana aparte.
   CSS, JS e imágenes locales se incrustan para que se vea
   completa. Se actualiza sola cada vez que guardas.
   Requiere permitir popups para este sitio.
   ========================================================= */

const __pvTagRe = /<script\b[^>]*\ssrc=["'][^"']+["'][^>]*>\s*<\/script>|<link\b[^>]*>|<img\b[^>]*>/gi;

function __pvIsLocal(url) {
  return !/^(https?:|data:|blob:|\/\/|#|mailto:|javascript:)/i.test(url);
}

function __pvJoin(baseDir, rel) {
  const parts = [...(baseDir ? baseDir.split('/') : []), ...rel.split('/')];
  const out = [];
  for (const p of parts) {
    if (!p || p === '.') continue;
    if (p === '..') out.pop();
    else out.push(p);
  }
  return out.join('/');
}

function __pvDir(path) {
  return path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
}

async function __pvResolveFile(root, path) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  let dir = root;
  for (let i = 0; i < parts.length - 1; i++) {
    try { dir = await dir.getDirectoryHandle(parts[i]); }
    catch { return null; }
  }
  try { return await dir.getFileHandle(parts[parts.length - 1]); }
  catch { return null; }
}

function __pvReadDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function __pvBuild(root, html, pagePath) {
  const baseDir = __pvDir(pagePath);
  let out = '';
  let last = 0;

  for (const m of html.matchAll(__pvTagRe)) {
    const full = m[0];
    out += html.slice(last, m.index);
    last = m.index + full.length;

    const attr = full.match(/\s(href|src)=["']([^"']+)["']/i);
    const rawUrl = attr ? attr[2] : '';
    const cleanUrl = rawUrl.split(/[?#]/)[0];

    if (!cleanUrl || !__pvIsLocal(cleanUrl)) { out += full; continue; }

    const isRoot = cleanUrl.startsWith('/');
    const path = __pvJoin(isRoot ? '' : baseDir, cleanUrl.replace(/^\/+/, ''));
    const handle = await __pvResolveFile(root, path);
    if (!handle) { out += full; continue; }

    const file = await handle.getFile();

    if (full.startsWith('<script')) {
      const type = full.match(/\stype=["']([^"']+)["']/i);
      out += `<script${type ? ` type="${type[1]}"` : ''}>\n${await file.text()}\n</script>`;
    } else if (full.startsWith('<link')) {
      if (/rel=["']?stylesheet/i.test(full)) {
        out += `<style>\n${await file.text()}\n</style>`;
      } else {
        out += full;
      }
    } else {
      const dataUrl = await __pvReadDataURL(file);
      out += full.replace(rawUrl, dataUrl);
    }
  }

  out += html.slice(last);
  return out;
}

CodHestudio.register({
  id: 'preview',
  name: 'Preview',
  icon: 'app-window',
  description: 'Abre el proyecto en una ventana de vista previa y la actualiza al guardar.',
  version: '1.0.0',

  activate(ctx) {
    let win = null;
    let currentPage = null;

    function pickPage(project) {
      const tab = ctx.actions.getActiveTab();
      if (tab && /\.html?$/i.test(tab.path)) return tab.path;

      const index = project.tree.find(n => n.kind === 'file' && n.name.toLowerCase() === 'index.html');
      if (index) return index.path;

      const firstHtml = project.tree.find(n => n.kind === 'file' && /\.html?$/i.test(n.name));
      return firstHtml ? firstHtml.path : null;
    }

    async function writeInto(w, project, pagePath) {
      const handle = await __pvResolveFile(project.handle, pagePath);
      if (!handle) return;
      const html = await (await handle.getFile()).text();
      const built = await __pvBuild(project.handle, html, pagePath);
      w.document.open();
      w.document.write(built);
      w.document.close();
    }

    async function openPreview() {
      const project = ctx.actions.getActiveProject();
      if (!project) {
        ctx.actions.setStatus('Abrí un proyecto primero', true);
        return;
      }

      const pagePath = pickPage(project);
      if (!pagePath) {
        ctx.actions.setStatus('No hay ninguna página HTML en el proyecto', true);
        return;
      }

      // Se abre la ventana antes de leer archivos para no perder el clic del usuario
      if (!win || win.closed) {
        win = window.open('', 'cod-preview', 'width=1040,height=720');
        if (!win) {
          ctx.actions.setStatus('El navegador bloqueó la ventana. Permite popups para este sitio', true);
          return;
        }
      }

      currentPage = pagePath;
      try {
        await writeInto(win, project, pagePath);
        win.document.title = `Vista previa · ${pagePath}`;
        ctx.actions.setStatus(`Vista previa: ${pagePath}`);
      } catch (err) {
        console.error(err);
        ctx.actions.setStatus(`Error en la vista previa: ${err.message}`, true);
      }
    }

    // Botón de ejecución en la barra inferior, como primer botón del grupo
    const actionsBox = document.querySelector('.statusbar-actions');
    const previewBtn = document.createElement('button');
    previewBtn.type = 'button';
    previewBtn.id = 'preview-btn';
    previewBtn.className = 'statusbar-btn';
    previewBtn.title = 'Vista previa del proyecto';
    previewBtn.innerHTML = '<i data-lucide="play"></i><span class="statusbar-btn-label">Preview</span>';
    previewBtn.addEventListener('click', openPreview);
    if (actionsBox) actionsBox.insertBefore(previewBtn, actionsBox.firstChild);
    if (window.lucide) lucide.createIcons();

    ctx.on('file:save', async () => {
      if (!win || win.closed || !currentPage) return;
      const project = ctx.actions.getActiveProject();
      if (!project) return;
      try { await writeInto(win, project, currentPage); }
      catch (err) { console.error(err); }
    });

    ctx.cleanup(() => {
      previewBtn.remove();
      if (win && !win.closed) win.close();
      win = null;
    });
  },
});