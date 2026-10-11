/* =========================================================
   Plugin: Clocker
   Muestra la hora en la barra de estado. Al pasar el cursor
   aparece la fecha completa. Clic para mostrar u ocultar los
   segundos (se recuerda entre sesiones).
   ========================================================= */

CodHestudio.register({
  id: 'clocker',
  name: 'Clocker',
  icon: 'clock',
  description: 'Muestra la hora en la barra de estado. Clic para mostrar u ocultar los segundos.',
  version: '1.0.0',

  activate(ctx) {
    let showSeconds = ctx.storage.get('seconds', true);

    const item = ctx.ui.addStatusItem({
      id: 'clocker-status',
      title: 'Hora actual',
      text: '--:--',
      icon: 'clock',
      onClick: () => {
        showSeconds = !showSeconds;
        ctx.storage.set('seconds', showSeconds);
        tick();
      },
    });

    function tick() {
      const now = new Date();
      item.update({
        text: now.toLocaleTimeString('es', {
          hour: '2-digit',
          minute: '2-digit',
          second: showSeconds ? '2-digit' : undefined,
        }),
        title: now.toLocaleDateString('es', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        }),
      });
    }

    tick();
    const id = setInterval(tick, 1000);
    ctx.cleanup(() => clearInterval(id));
  },
});