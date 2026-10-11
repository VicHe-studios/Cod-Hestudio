/* =========================================================
   MediaKit · utilidad compartida (no es un plugin)
   Ventana flotante para ver imágenes, videos y audios.

   Uso: CodMedia.open(node, (url, api) => elementoHTML)
     url         → URL temporal del archivo
     api.setDetail(texto) → texto extra en la cabecera
   ========================================================= */
(function () {
  const STYLE_ID = 'cod-media-style';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .cm-overlay {
        position: fixed;
        inset: 0;
        background: rgba(16, 24, 40, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        z-index: 950;
      }
      .cm-panel {
        width: min(900px, 100%);
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--r-xl);
        box-shadow: var(--sh-lg);
        overflow: hidden;
        animation: modalIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .cm-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
      }
      .cm-title { min-width: 0; display: flex; flex-direction: column; }
      .cm-name {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cm-info { font-size: 0.72rem; color: var(--text-tertiary); margin-top: 2px; }
      .cm-close {
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        border-radius: var(--r-sm);
        color: var(--text-tertiary);
        cursor: pointer;
      }
      .cm-close:hover { background: var(--bg-page); color: var(--text); }
      .cm-body {
        flex: 1;
        min-height: 200px;
        overflow: auto;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-page);
      }
      .cm-body img,
      .cm-body video {
        max-width: 100%;
        max-height: 72vh;
        border-radius: var(--r-sm);
      }
      .cm-body audio { width: min(560px, 100%); }
    `;
    document.head.appendChild(st);
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async function open(node, build) {
    ensureStyle();

    const file = await node.handle.getFile();
    const url = URL.createObjectURL(file);

    const overlay = document.createElement('div');
    overlay.className = 'cm-overlay';
    overlay.innerHTML = `
      <div class="cm-panel">
        <div class="cm-head">
          <div class="cm-title">
            <span class="cm-name"></span>
            <span class="cm-info"></span>
          </div>
          <button class="cm-close" type="button" title="Cerrar">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="cm-body"></div>
      </div>
    `;

    const infoEl = overlay.querySelector('.cm-info');
    overlay.querySelector('.cm-name').textContent = node.name;

    const sizeText = formatSize(file.size);
    const api = {
      setDetail(text) {
        infoEl.textContent = [text, sizeText].filter(Boolean).join(' · ');
      },
    };
    api.setDetail('');

    const el = build(url, api);
    overlay.querySelector('.cm-body').appendChild(el);
    document.body.appendChild(overlay);
    if (window.lucide) lucide.createIcons();

    function close() {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      URL.revokeObjectURL(url);
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    overlay.querySelector('.cm-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey, true);

    return { close };
  }

  window.CodMedia = { open, formatSize };
})();
