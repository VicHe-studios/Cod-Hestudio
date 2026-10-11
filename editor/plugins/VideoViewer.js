/* =========================================================
   Plugin: Visor de videos
   Abre MP4, WEBM y MOV en una ventana flotante con controles.
   ========================================================= */

function __vvTime(sec) {
  if (!Number.isFinite(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

CodHestudio.register({
  id: 'videoviewer',
  name: 'Visor de videos',
  icon: 'video',
  description: 'Reproduce videos del proyecto en una ventana flotante.',
  version: '1.0.0',

  activate(ctx) {
    ctx.on('media:open', (node, kind) => {
      if (kind !== 'video' || !window.CodMedia) return;

      window.CodMedia.open(node, (url, api) => {
        const video = document.createElement('video');
        video.controls = true;
        video.preload = 'metadata';
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          api.setDetail(
            [`${video.videoWidth} × ${video.videoHeight}`, __vvTime(video.duration)]
              .filter(Boolean).join(' · ')
          );
        });
        return video;
      });
    });
  },
});
