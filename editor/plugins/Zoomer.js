/* =========================================================
   Plugin: Zoomer
   Cambia el tamaño de la letra del editor Monaco desde la
   barra de estado: A− (reducir), valor (elegir) y A+ (aumentar).
   El tamaño se guarda entre sesiones.
   ========================================================= */

CodHestudio.register({
  id: 'zoomer',
  name: 'Zoomer',
  icon: 'zoom-in',
  description: 'Cambia el tamaño de la letra del editor desde la barra de estado.',
  version: '1.0.0',

  activate(ctx) {
    const MIN = 8;
    const MAX = 36;
    const DEFAULT = 14;

    function clamp(n) {
      const v = Math.round(Number(n));
      if (!Number.isFinite(v)) return DEFAULT;
      return Math.min(MAX, Math.max(MIN, v));
    }

    let size = clamp(ctx.storage.get('size', DEFAULT));

    function apply() {
      const ed = ctx.actions.getEditor();
      if (ed) ed.updateOptions({ fontSize: size, lineHeight: Math.round(size * 1.57) });
      valueItem.update({ text: `${size}px` });
    }

    function setSize(n) {
      size = clamp(n);
      ctx.storage.set('size', size);
      apply();
    }

    ctx.ui.addStatusItem({
      id: 'zoom-out',
      title: 'Reducir texto',
      text: 'A−',
      onClick: () => setSize(size - 1),
    });

    const valueItem = ctx.ui.addStatusItem({
      id: 'zoom-value',
      title: 'Elegir tamaño de letra',
      text: `${size}px`,
      onClick: async () => {
        const v = await ctx.ui.prompt({
          title: 'Tamaño de letra',
          desc: `Entre ${MIN} y ${MAX} píxeles.`,
          placeholder: String(DEFAULT),
          defaultValue: String(size),
        });
        if (v) setSize(v);
      },
    });

    ctx.ui.addStatusItem({
      id: 'zoom-in',
      title: 'Aumentar texto',
      text: 'A+',
      onClick: () => setSize(size + 1),
    });

    ctx.on('editor:ready', apply);
    apply();

    ctx.cleanup(() => {
      const ed = ctx.actions.getEditor();
      if (ed) ed.updateOptions({ fontSize: DEFAULT, lineHeight: 22 });
    });
  },
});
