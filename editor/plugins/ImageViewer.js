/* =========================================================
   Plugin: Visor de imágenes
   Abre PNG, JPG, GIF, WEBP y otros en una ventana flotante.
   ========================================================= */

CodHestudio.register({
  id: 'imageviewer',
  name: 'Visor de imágenes',
  icon: 'image',
  description: 'Abre imágenes del proyecto en una ventana de vista previa.',
  version: '1.0.0',

  activate(ctx) {
    ctx.on('media:open', (node, kind) => {
      if (kind !== 'image' || !window.CodMedia) return;

      window.CodMedia.open(node, (url, api) => {
        const img = document.createElement('img');
        img.alt = node.name;
        img.src = url;
        img.addEventListener('load', () => {
          api.setDetail(`${img.naturalWidth} × ${img.naturalHeight} px`);
        });
        return img;
      });
    });
  },
});
