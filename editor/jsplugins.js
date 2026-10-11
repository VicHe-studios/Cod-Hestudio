/* =========================================================
   JsPlugins · Loader de plugins para Cod-Hestudio
   ---------------------------------------------------------
   Cada plugin es un archivo .js en la carpeta `plugins/`.
   Al cargarse, llama a CodHestudio.register({...}) y queda
   disponible para activarse desde la tienda.
   CodDialog.js y MediaKit.js son utilidades compartidas:
   van primero.
   ========================================================= */

window.JS_PLUGINS_CONFIG = {
  basePath: 'plugins/',
  files: [
    'CodDialog.js',
    'MediaKit.js',
    'Carpet.js',
    'Archive.js',
    'TrashGang.js',
    'Tagger.js',
    'TheReader.js',
    'Templates.js',
    'Zoomer.js',
    'Searchering.js',
    'MovingTruck.js',
    'Preview.js',
    'ImageViewer.js',
    'VideoViewer.js',
    'AudioViewer.js',
    'MDLover.js',
    'VisualCode.js',
    'GitExport.js',
    'Zipper.js',
    'ProjectSize.js',
    'Noty.js',
    'TaskList.js',
    'Clocker.js',
    'Ambiental.js',
    'Starry.js',
    'Pinner.js',
  ],
};

function __loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => resolve(src);
    s.onerror = () => reject(new Error(`No se pudo cargar: ${src}`));
    document.head.appendChild(s);
  });
}

window.loadJsPlugins = async function loadJsPlugins() {
  const cfg = window.JS_PLUGINS_CONFIG || {};
  const base = cfg.basePath || 'plugins/';
  const files = Array.isArray(cfg.files) ? cfg.files : [];

  const results = [];
  for (const file of files) {
    const src = base + file;
    try {
      await __loadScript(src);
      results.push({ file, ok: true });
    } catch (e) {
      console.error(`[jsplugins] error cargando ${src}`, e);
      results.push({ file, ok: false, error: e });
    }
  }

  const ok = results.filter(r => r.ok).length;
  console.log(`[jsplugins] cargados ${ok}/${results.length} plugins`);
  return results;
};
