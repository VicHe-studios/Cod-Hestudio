/* =========================================================
   Plugin: Visor de audios
   Reproduce MP3, WAV, OGG, M4A y FLAC en una ventana flotante.
   ========================================================= */

function __avTime(sec) {
  if (!Number.isFinite(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

CodHestudio.register({
  id: 'audioviewer',
  name: 'Visor de audios',
  icon: 'music',
  description: 'Reproduce audios del proyecto en una ventana flotante.',
  version: '1.0.0',

  activate(ctx) {
    ctx.on('media:open', (node, kind) => {
      if (kind !== 'audio' || !window.CodMedia) return;

      window.CodMedia.open(node, (url, api) => {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'metadata';
        audio.src = url;
        audio.addEventListener('loadedmetadata', () => {
          api.setDetail(__avTime(audio.duration));
        });
        return audio;
      });
    });
  },
});
