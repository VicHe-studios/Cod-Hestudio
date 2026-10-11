/* =========================================================
   Plugin: Ambiental
   Cinco sonidos ambientales generados en el navegador con
   Web Audio (sin archivos de audio):
   Lluvia, Olas, Viento, Fogata y Bosque.
   Puedes tener varios sonando a la vez. Se detienen al
   desactivar el plugin. El primer clic activa el audio
   (así lo exige Chrome).
   ========================================================= */

let __amAudio = null;     // AudioContext compartido
let __amMaster = null;    // volumen general
const __amPlaying = new Map(); // id -> { inst, out }

function __amCtx(volume) {
  if (!__amAudio) {
    __amAudio = new (window.AudioContext || window.webkitAudioContext)();
    __amMaster = __amAudio.createGain();
    __amMaster.gain.value = volume;
    __amMaster.connect(__amAudio.destination);
  }
  if (__amAudio.state === 'suspended') __amAudio.resume();
  return __amAudio;
}

// Ruido blanco o marrón de 3 segundos, en bucle
function __amNoise(ctx, type) {
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'brown') {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else {
      d[i] = w;
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.start();
  return src;
}

// Oscilador lento que modula un parámetro (por ejemplo, el volumen)
function __amLfo(ctx, rate, depth, target) {
  const lfo = ctx.createOscillator();
  lfo.frequency.value = rate;
  const amp = ctx.createGain();
  amp.gain.value = depth;
  lfo.connect(amp).connect(target);
  lfo.start();
  return { lfo, amp };
}

function __amBuildRain(ctx, out) {
  const src = __amNoise(ctx, 'white');
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 4000;
  bp.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.value = 0.35;
  src.connect(bp).connect(g).connect(out);
  const lfo = __amLfo(ctx, 0.3, 0.05, g.gain);
  return {
    stop() {
      src.stop(); lfo.lfo.stop();
      [src, bp, g, lfo.lfo, lfo.amp].forEach(n => n.disconnect());
    },
  };
}

function __amBuildOcean(ctx, out) {
  const src = __amNoise(ctx, 'brown');
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  const g = ctx.createGain();
  g.gain.value = 0.5;
  src.connect(lp).connect(g).connect(out);
  const lfo = __amLfo(ctx, 0.09, 0.35, g.gain); // olas: el volumen sube y baja despacio
  return {
    stop() {
      src.stop(); lfo.lfo.stop();
      [src, lp, g, lfo.lfo, lfo.amp].forEach(n => n.disconnect());
    },
  };
}

function __amBuildWind(ctx, out) {
  const src = __amNoise(ctx, 'brown');
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 500;
  bp.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = 0.6;
  src.connect(bp).connect(g).connect(out);
  const lfo = __amLfo(ctx, 0.05, 250, bp.frequency); // el viento cambia de tono
  return {
    stop() {
      src.stop(); lfo.lfo.stop();
      [src, bp, g, lfo.lfo, lfo.amp].forEach(n => n.disconnect());
    },
  };
}

function __amBuildFire(ctx, out) {
  const timers = new Set();
  const live = new Set();

  // Base grave de la llama
  const rumble = __amNoise(ctx, 'brown');
  const rlp = ctx.createBiquadFilter();
  rlp.type = 'lowpass';
  rlp.frequency.value = 300;
  const rg = ctx.createGain();
  rg.gain.value = 0.4;
  rumble.connect(rlp).connect(rg).connect(out);

  // Un chasquido corto de ruido con caída rápida, ya horneado en un buffer
  const burstLen = Math.floor(ctx.sampleRate * 0.05);
  const burst = ctx.createBuffer(1, burstLen, ctx.sampleRate);
  const bd = burst.getChannelData(0);
  for (let i = 0; i < burstLen; i++) {
    bd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
  }

  function crackle() {
    const s = ctx.createBufferSource();
    s.buffer = burst;
    const cg = ctx.createGain();
    cg.gain.value = 0.2 + Math.random() * 0.5;
    s.connect(cg).connect(out);
    s.start();
    live.add(s);
    s.onended = () => { live.delete(s); cg.disconnect(); s.disconnect(); };
  }

  function scheduleCrackle() {
    const t = setTimeout(() => {
      timers.delete(t);
      crackle();
      scheduleCrackle();
    }, 60 + Math.random() * 300);
    timers.add(t);
  }
  scheduleCrackle();

  return {
    stop() {
      timers.forEach(clearTimeout);
      live.forEach(s => { try { s.stop(); } catch {} });
      rumble.stop();
      [rumble, rlp, rg].forEach(n => n.disconnect());
    },
  };
}

function __amBuildForest(ctx, out) {
  const timers = new Set();
  const live = new Set();

  // Brisa suave de fondo
  const src = __amNoise(ctx, 'brown');
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  const g = ctx.createGain();
  g.gain.value = 0.25;
  src.connect(lp).connect(g).connect(out);
  const lfo = __amLfo(ctx, 0.04, 0.12, g.gain);

  // Pájaros: trinos cortos con subida y bajada de tono
  function chirp() {
    const t0 = ctx.currentTime;
    const f0 = 2200 + Math.random() * 1600;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(f0 * (1.2 + Math.random() * 0.4), t0 + 0.08);
    o.frequency.exponentialRampToValueAtTime(f0 * 1.05, t0 + 0.18);
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0, t0);
    cg.gain.linearRampToValueAtTime(0.12, t0 + 0.02);
    cg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
    o.connect(cg).connect(out);
    o.start(t0);
    o.stop(t0 + 0.22);
    live.add(o);
    o.onended = () => { live.delete(o); cg.disconnect(); o.disconnect(); };
  }

  function scheduleChirp() {
    const t = setTimeout(() => {
      timers.delete(t);
      const notes = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < notes; i++) setTimeout(chirp, i * 180);
      scheduleChirp();
    }, 1200 + Math.random() * 3300);
    timers.add(t);
  }
  scheduleChirp();

  return {
    stop() {
      timers.forEach(clearTimeout);
      live.forEach(o => { try { o.stop(); } catch {} });
      src.stop(); lfo.lfo.stop();
      [src, lp, g, lfo.lfo, lfo.amp].forEach(n => n.disconnect());
    },
  };
}

const __amSounds = [
  { id: 'lluvia', name: 'Lluvia', desc: 'Lluvia suave sobre el techo', build: __amBuildRain },
  { id: 'olas', name: 'Olas', desc: 'Oleaje lento en la playa', build: __amBuildOcean },
  { id: 'viento', name: 'Viento', desc: 'Brisa que sopla entre los árboles', build: __amBuildWind },
  { id: 'fuego', name: 'Fogata', desc: 'Fuego crepitando en la chimenea', build: __amBuildFire },
  { id: 'bosque', name: 'Bosque', desc: 'Brisa suave con pájaros', build: __amBuildForest },
];

CodHestudio.register({
  id: 'ambiental',
  name: 'Ambiental',
  icon: 'headphones',
  description: 'Cinco sonidos ambientales generados con Web Audio: lluvia, olas, viento, fogata y bosque.',
  version: '1.0.0',

  activate(ctx) {
    const STYLE_ID = 'am-style';
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .am-list { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
      .am-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: var(--bg-page);
        border: 1px solid var(--border);
        border-radius: var(--r);
      }
      .am-row.on { border-color: var(--accent); background: var(--accent-subtle); }
      .am-info { flex: 1; min-width: 0; }
      .am-name { font-size: 0.9rem; font-weight: 600; color: var(--text); }
      .am-desc { font-size: 0.74rem; color: var(--text-tertiary); margin-top: 2px; }
      .am-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 12px;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        color: var(--text-secondary);
        font-family: var(--font);
        font-size: 0.78rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .am-btn:hover { border-color: var(--border-strong); color: var(--text); }
      .am-btn.on { border-color: var(--accent); color: var(--accent-text); }
      .am-volume { display: flex; align-items: center; gap: 12px; margin-top: 16px; font-size: 0.78rem; color: var(--text-secondary); }
      .am-volume input { flex: 1; accent-color: var(--accent); cursor: pointer; }
    `;
    document.head.appendChild(st);

    const volume = ctx.storage.get('volume', 0.6);

    const statusItem = ctx.ui.addStatusItem({
      id: 'ambiental-status',
      title: 'Sonidos ambientales',
      text: 'Ambiente',
      icon: 'headphones',
      onClick: () => openPanel(),
    });

    function refreshStatus() {
      const n = __amPlaying.size;
      statusItem.update({
        text: n ? `Ambiente · ${n}` : 'Ambiente',
        title: n ? `${n} sonido(s) activo(s)` : 'Sonidos ambientales',
      });
    }

    function play(sound) {
      if (__amPlaying.has(sound.id)) return;
      const audio = __amCtx(ctx.storage.get('volume', 0.6));
      const out = audio.createGain();
      out.gain.value = 1;
      out.connect(__amMaster);
      const inst = sound.build(audio, out);
      __amPlaying.set(sound.id, { inst, out });
      refreshStatus();
    }

    function stop(id) {
      const entry = __amPlaying.get(id);
      if (!entry) return;
      entry.inst.stop();
      entry.out.disconnect();
      __amPlaying.delete(id);
      refreshStatus();
    }

    function openPanel() {
      const overlay = document.createElement('div');
      overlay.className = 'modal';
      const box = document.createElement('div');
      box.className = 'modal-content';
      box.style.width = '520px';
      box.innerHTML = `
        <h2>Sonidos ambientales</h2>
        <p class="modal-desc">Puedes combinar varios. Se siguen oyendo aunque cierres esta ventana.</p>
        <div class="am-list"></div>
        <div class="am-volume">
          <span>Volumen</span>
          <input type="range" min="0" max="100" step="1">
          <span class="am-vol-value"></span>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" data-act="close">Cerrar</button>
        </div>
      `;

      const list = box.querySelector('.am-list');
      const slider = box.querySelector('input[type="range"]');
      const volText = box.querySelector('.am-vol-value');

      slider.value = Math.round(ctx.storage.get('volume', 0.6) * 100);
      volText.textContent = `${slider.value}%`;
      slider.addEventListener('input', () => {
        const v = Number(slider.value) / 100;
        volText.textContent = `${slider.value}%`;
        ctx.storage.set('volume', v);
        if (__amMaster) __amMaster.gain.value = v;
      });

      function render() {
        list.innerHTML = '';
        __amSounds.forEach((sound) => {
          const on = __amPlaying.has(sound.id);
          const row = document.createElement('div');
          row.className = 'am-row' + (on ? ' on' : '');
          row.innerHTML = `
            <div class="am-info">
              <div class="am-name"></div>
              <div class="am-desc"></div>
            </div>
            <button type="button" class="am-btn${on ? ' on' : ''}">
              <i data-lucide="${on ? 'pause' : 'play'}"></i>
              <span>${on ? 'Pausar' : 'Reproducir'}</span>
            </button>
          `;
          row.querySelector('.am-name').textContent = sound.name;
          row.querySelector('.am-desc').textContent = sound.desc;
          row.querySelector('.am-btn').addEventListener('click', () => {
            if (__amPlaying.has(sound.id)) stop(sound.id);
            else play(sound);
            render();
          });
          list.appendChild(row);
        });
        if (window.lucide) lucide.createIcons();
      }

      const onKey = (e) => { if (e.key === 'Escape') close(); };
      function close() {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
      }
      box.querySelector('[data-act="close"]').addEventListener('click', close);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      document.addEventListener('keydown', onKey, true);

      overlay.appendChild(box);
      document.body.appendChild(overlay);
      render();
    }

    ctx.ui.addToolbarItem({
      id: 'ambiental-btn',
      title: 'Sonidos ambientales',
      icon: 'headphones',
      onClick: openPanel,
    });

    refreshStatus();

    ctx.cleanup(() => {
      [...__amPlaying.keys()].forEach(stop);
      if (__amAudio) {
        __amAudio.close();
        __amAudio = null;
        __amMaster = null;
      }
      document.getElementById(STYLE_ID)?.remove();
    });
  },
});