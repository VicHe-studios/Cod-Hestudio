/* =========================================================
   Plugin: MD Lover
   Vista previa de Markdown en una ventana aparte. Se actualiza
   mientras escribes. Usa marked y DOMPurify desde jsDelivr
   (versiones fijas). Las imágenes locales se incrustan.
   Requiere permitir popups para este sitio.
   ========================================================= */

const __mdLibs = {
  marked: 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js',
  purify: 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',
};

function __mdLoadScript(src) {
  return new Promise((resolve, reject) => {
    // Monaco define una función global `define` (AMD). Si está presente, la librería
    // no se registra como global, así que la ocultamos mientras carga.
    const savedDefine = window.define;
    window.define = undefined;
    const restore = () => { window.define = savedDefine; };

    const s = document.createElement('script');
    s.src = src;
    s.onload = () => { restore(); resolve(); };
    s.onerror = () => { restore(); reject(new Error(`No se pudo cargar ${src}`)); };
    document.head.appendChild(s);
  });
}

async function __mdEnsureLibs() {
  if (!window.marked) await __mdLoadScript(__mdLibs.marked);
  if (!window.DOMPurify) await __mdLoadScript(__mdLibs.purify);
}

function __mdJoin(baseDir, rel) {
  const parts = [...(baseDir ? baseDir.split('/') : []), ...rel.split('/')];
  const out = [];
  for (const p of parts) {
    if (!p || p === '.') continue;
    if (p === '..') out.pop();
    else out.push(p);
  }
  return out.join('/');
}

function __mdDir(path) {
  return path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
}

async function __mdResolveFile(root, path) {
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return null;
  let dir = root;
  for (let i = 0; i < parts.length - 1; i++) {
    try { dir = await dir.getDirectoryHandle(parts[i]); }
    catch { return null; }
  }
  try { return await dir.getFileHandle(parts[parts.length - 1]); }
  catch { return null; }
}

function __mdReadDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function __mdRender(root, mdPath, text) {
  await __mdEnsureLibs();
  const raw = window.marked.parse(text, { gfm: true });
  const clean = window.DOMPurify.sanitize(raw);

  const wrap = document.createElement('div');
  wrap.innerHTML = clean;

  const dir = __mdDir(mdPath);
  for (const img of wrap.querySelectorAll('img[src]')) {
    const src = img.getAttribute('src');
    if (/^(https?:|data:|blob:|\/\/)/i.test(src)) continue;
    const clean = src.split(/[?#]/)[0].replace(/^\/+/, '');
    const handle = await __mdResolveFile(root, __mdJoin(src.startsWith('/') ? '' : dir, clean));
    if (handle) img.src = await __mdReadDataURL(await handle.getFile());
  }
  return wrap.innerHTML;
}

const __mdCss = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px 20px;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: #FFFFFF;
    color: #101828;
    line-height: 1.65;
  }
  article { max-width: 780px; margin: 0 auto; }
  h1, h2, h3 { line-height: 1.25; margin: 1.4em 0 0.6em; }
  h1 { font-size: 2rem; border-bottom: 1px solid #E4E7EC; padding-bottom: 0.3em; }
  h2 { font-size: 1.5rem; border-bottom: 1px solid #E4E7EC; padding-bottom: 0.25em; }
  p, ul, ol { margin: 0 0 1em; }
  a { color: #6941C6; }
  code {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 0.88em;
    background: #F2F4F7;
    padding: 0.15em 0.35em;
    border-radius: 4px;
  }
  pre {
    background: #F2F4F7;
    padding: 14px 16px;
    border-radius: 8px;
    overflow-x: auto;
  }
  pre code { background: none; padding: 0; }
  blockquote {
    margin: 0 0 1em;
    padding: 0 1em;
    border-left: 3px solid #D0D5DD;
    color: #475467;
  }
  table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
  th, td { border: 1px solid #E4E7EC; padding: 8px 10px; text-align: left; }
  th { background: #F7F8FA; }
  img { max-width: 100%; height: auto; border-radius: 6px; }
  hr { border: none; border-top: 1px solid #E4E7EC; margin: 2em 0; }
`;

function __mdDocument(title, body) {
  const t = String(title).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t}</title><style>${__mdCss}</style></head>
<body><article>${body}</article></body></html>`;
}

CodHestudio.register({
  id: 'mdlover',
  name: 'MD Lover',
  icon: 'file-text',
  description: 'Vista previa de Markdown en una ventana aparte, que se actualiza mientras escribes.',
  version: '1.0.0',

  activate(ctx) {
    let win = null;
    let currentPath = null;
    let timer = null;

    function currentMdTab() {
      const tab = ctx.actions.getActiveTab();
      return tab && /\.(md|markdown)$/i.test(tab.path) ? tab : null;
    }

    async function paint(text, path) {
      const project = ctx.actions.getActiveProject();
      if (!win || win.closed || !project) return;
      try {
        const body = await __mdRender(project.handle, path, text);
        const y = win.scrollY || 0;
        win.document.open();
        win.document.write(__mdDocument(path, body));
        win.document.close();
        win.document.title = `Vista previa · ${path}`;
        win.scrollTo(0, y);
      } catch (err) {
        console.error(err);
        ctx.actions.setStatus(`Error en la vista previa: ${err.message}`, true);
      }
    }

    async function openPreview() {
      const project = ctx.actions.getActiveProject();
      if (!project) {
        ctx.actions.setStatus('Abrí un proyecto primero', true);
        return;
      }
      const tab = currentMdTab();
      if (!tab) {
        ctx.actions.setStatus('Abre un archivo .md para verlo', true);
        return;
      }

      if (!win || win.closed) {
        win = window.open('', 'cod-mdlover', 'width=900,height=760');
        if (!win) {
          ctx.actions.setStatus('El navegador bloqueó la ventana. Permite popups para este sitio', true);
          return;
        }
      }

      currentPath = tab.path;
      await paint(tab.model.getValue(), tab.path);
      ctx.actions.setStatus(`Vista previa Markdown: ${tab.path}`);
    }

    ctx.ui.addToolbarItem({
      id: 'mdlover-btn',
      title: 'Vista previa de Markdown',
      icon: 'file-text',
      onClick: openPreview,
    });

    // Actualiza mientras escribes (con pausa de 400 ms)
    ctx.on('model:change', (tab) => {
      if (!win || win.closed || !currentPath || tab.path !== currentPath) return;
      clearTimeout(timer);
      timer = setTimeout(() => paint(tab.model.getValue(), tab.path), 400);
    });

    ctx.cleanup(() => {
      clearTimeout(timer);
      if (win && !win.closed) win.close();
      win = null;
    });
  },
});