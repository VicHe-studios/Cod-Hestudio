/* =========================================================
   Plugin: VisualCode
   Temas de color con modo claro y oscuro para cada uno:
   Wuu, Hybrid, Github Lover, Cuarzo Rosado, Oficina, Floral,
   Café Latte, En busca del tema perdido y Bizzaras Desventuras.
   El botón de paleta abre la lista: elige el tema y su modo.
   El botón de luna de la barra cambia el modo del tema activo,
   igual que en el tema base. "Original" vuelve a Cod-Hestudio.
   ========================================================= */

const __vcThemes = {
  'wuu': {
    name: 'Wuu',
    light: {
      light: true,
      bg: 'F0F0F0', surface: 'FFFFFF', subtle: 'F5F5F5', muted: 'E8E8E8',
      border: 'E0E0E0', strong: 'D4D4D4',
      text: '525252', sec: '737373', ter: 'A3A3A3', dis: 'D4D4D4',
      accent: '00BCD4', hover: '0097A7', accentSubtle: 'E0F7FA',
      accentBorder: '80DEEA', accentText: '0097A7',
      success: '027A48', danger: 'B42318',
      syn: { comment: 'A3A3A3', keyword: '0097A7', string: '027A48', number: 'B54708', type: '175CD3', tag: '00BCD4', attr: 'B54708' },
    },
    dark: {
      light: false,
      bg: '0F1115', surface: '171A20', subtle: '1C2029', muted: '242934',
      border: '2E3440', strong: '3E4656',
      text: 'E6E6E6', sec: 'B0B0B0', ter: '8A8A8A', dis: '5A5A5A',
      accent: '00BCD4', hover: '26C6DA', accentSubtle: '0E2E33',
      accentBorder: '006064', accentText: '4DD0E1',
      success: '75E0A7', danger: 'FDA29B',
      syn: { comment: '6B7280', keyword: '26C6DA', string: '75E0A7', number: 'FDB022', type: '84CAFF', tag: '4DD0E1', attr: 'FDB022' },
    },
  },

  'hybrid': {
    name: 'Hybrid',
    light: {
      light: true,
      bg: 'F5F5F7', surface: 'FFFFFF', subtle: 'F7F7F9', muted: 'EDEDF2',
      border: 'E2E2EA', strong: 'C8C8D2',
      text: '17171C', sec: '4A4A56', ter: '7A7A88', dis: 'B4B4C0',
      accent: 'B0445F', hover: '8A2E47', accentSubtle: 'F8E6EB',
      accentBorder: 'E0A0B0', accentText: '8A2E47',
      success: '1E8A56', danger: 'B42318',
      syn: { comment: '9A9AA8', keyword: 'B0445F', string: '2F7A8C', number: '8A5A1E', type: '1F2A5C', tag: '2F7A8C', attr: 'B0445F' },
    },
    dark: {
      light: false,
      bg: '0A0A0C', surface: '17171C', subtle: '1A1A20', muted: '26262E',
      border: '26262E', strong: '3A3A44',
      text: 'FFFFFF', sec: 'B4B4C0', ter: '8E8E9A', dis: '62626E',
      accent: 'B0445F', hover: 'C95772', accentSubtle: '1A0B10',
      accentBorder: '6B1F34', accentText: 'C95772',
      success: '75E0A7', danger: 'FDA29B',
      syn: { comment: '62626E', keyword: 'C95772', string: '64B5C8', number: 'B4B4C0', type: 'E8E8F0', tag: '64B5C8', attr: 'C95772' },
    },
  },

  'github-lover': {
    name: 'Github Lover',
    light: {
      light: true,
      bg: 'FFFFFF', surface: 'FFFFFF', subtle: 'F6F8FA', muted: 'EAEEF2',
      border: 'D0D7DE', strong: 'AFB8C1',
      text: '1F2328', sec: '59636E', ter: '656D76', dis: '8C959F',
      accent: '0969DA', hover: '0550AE', accentSubtle: 'DDF4FF',
      accentBorder: '54AEFF', accentText: '0550AE',
      success: '1A7F37', danger: 'CF222E',
      syn: { comment: '656D76', keyword: 'CF222E', string: '0A3069', number: '0550AE', type: '8250DF', tag: '116329', attr: '0550AE' },
    },
    dark: {
      light: false,
      bg: '0D1117', surface: '161B22', subtle: '21262D', muted: '30363D',
      border: '30363D', strong: '484F58',
      text: 'E6EDF3', sec: '8B949E', ter: '6E7681', dis: '484F58',
      accent: '58A6FF', hover: '79C0FF', accentSubtle: '0D2D6B',
      accentBorder: '1F4CA8', accentText: '79C0FF',
      success: '3FB950', danger: 'F85149',
      syn: { comment: '8B949E', keyword: 'A371F7', string: '79C0FF', number: 'D29922', type: '58A6FF', tag: '3FB950', attr: '79C0FF' },
    },
  },

  'busca-tema-perdido': {
    name: 'En busca del tema perdido',
    light: {
      light: true,
      bg: 'F1E4C8', surface: 'FBF3DE', subtle: 'F6ECD4', muted: 'EDDDBB',
      border: 'D4BA85', strong: 'C2A670',
      text: '2A1E10', sec: '523F25', ter: '705A35', dis: '967A4A',
      accent: 'B8702A', hover: 'C98A3E', accentSubtle: 'F7EEDA',
      accentBorder: 'D0A965', accentText: '7A4416',
      success: '027A48', danger: 'B91C1C',
      syn: { comment: '967A4A', keyword: '7A4416', string: '9A5A1E', number: 'B91C1C', type: '5C3210', tag: '7A4416', attr: 'B9863F' },
    },
    dark: {
      light: false,
      bg: '1E1609', surface: '2A200F', subtle: '322813', muted: '3B2F18',
      border: '5C4A26', strong: '7A6236',
      text: 'F1E4C8', sec: 'D0B88A', ter: 'A88E5F', dis: '6E5A35',
      accent: 'D08A3E', hover: 'E0A25A', accentSubtle: '3A2A10',
      accentBorder: '7A4416', accentText: 'E9B878',
      success: '8BD39A', danger: 'E88F7D',
      syn: { comment: '8A7548', keyword: 'E0A25A', string: 'C9D98A', number: 'F08A6B', type: 'E9C58A', tag: 'D08A3E', attr: 'E9B878' },
    },
  },

  'bizzaras-desventuras': {
    name: 'Bizzaras Desventuras',
    light: {
      light: true,
      bg: 'FDF4FF', surface: 'FFFFFF', subtle: 'FAF0FE', muted: 'F3E2FA',
      border: 'E9C9F5', strong: 'C084FC',
      text: '2A1148', sec: '5B3A8A', ter: '8B6BB8', dis: 'B8A4D6',
      accent: 'C026D3', hover: 'A21CAF', accentSubtle: 'FBE8FF',
      accentBorder: 'E879F9', accentText: '86198F',
      success: '16A34A', danger: 'DC2626',
      syn: { comment: '9B7FC4', keyword: 'C026D3', string: '0E7490', number: 'B45309', type: '6D28D9', tag: 'A21CAF', attr: 'B45309' },
    },
    dark: {
      light: false,
      bg: '120A2E', surface: '1E1148', subtle: '251556', muted: '2A1259',
      border: '33206F', strong: '4A3290',
      text: 'FFFFFF', sec: 'C9BEEF', ter: 'A898DA', dis: '7A66B8',
      accent: 'D946EF', hover: 'E879F9', accentSubtle: '2A1259',
      accentBorder: '701A75', accentText: 'F0ABFC',
      success: '4ADE80', danger: 'F87171',
      syn: { comment: '7A66B8', keyword: 'D946EF', string: '22D3EE', number: 'FACC15', type: 'F0ABFC', tag: 'E879F9', attr: 'FACC15' },
    },
  },
  'cuarzo-rosado': {
    name: 'Cuarzo Rosado',
    light: {
      light: true,
      bg: 'FFF9FB', surface: 'FFFFFF', subtle: 'FEF0F5', muted: 'FCE7F3',
      border: 'EADCE4', strong: 'D8C3D2',
      text: '33202D', sec: '624659', ter: '806076', dis: 'A88EA1',
      accent: 'EC4899', hover: 'DB2777', accentSubtle: 'FDF2F8',
      accentBorder: 'F9A8D4', accentText: 'BE185D',
      success: '027A48', danger: 'B42318',
      syn: { comment: 'A88EA1', keyword: 'BE185D', string: '7E22CE', number: 'B45309', type: '6D28D9', tag: 'DB2777', attr: 'B45309' },
    },
    dark: {
      light: false,
      bg: '1A0F16', surface: '221420', subtle: '2A1A27', muted: '33202F',
      border: '4B2F42', strong: '6B4560',
      text: 'FDF2F8', sec: 'E9D5E0', ter: 'C9A8BC', dis: '8A6A7E',
      accent: 'EC4899', hover: 'F472B6', accentSubtle: '3A1B30',
      accentBorder: '831843', accentText: 'F9A8D4',
      success: '75E0A7', danger: 'FDA29B',
      syn: { comment: '8A6A7E', keyword: 'F472B6', string: 'C084FC', number: 'FDB022', type: 'F0ABFC', tag: 'EC4899', attr: 'FBCFE8' },
    },
  },

  'oficina': {
    name: 'Oficina',
    light: {
      light: true,
      bg: 'F5F5F7', surface: 'FFFFFF', subtle: 'F7F7F8', muted: 'EDEDF0',
      border: 'DCDCE0', strong: 'A0A0A8',
      text: '1F1F23', sec: '4A4A52', ter: '7A7A82', dis: 'B0B0B8',
      accent: '3E3E44', hover: '2A2A30', accentSubtle: 'EDEDF0',
      accentBorder: 'A8A8B3', accentText: '1F1F23',
      success: '027A48', danger: 'B42318',
      syn: { comment: '8A8A94', keyword: '3E3E44', string: '2F5D50', number: '7A4B1E', type: '3E4A7A', tag: '1F1F23', attr: '7A4B1E' },
    },
    dark: {
      light: false,
      bg: '0E0E10', surface: '1F1F23', subtle: '171719', muted: '2A2A2E',
      border: '2A2A2E', strong: '3A3A40',
      text: 'F5F5F8', sec: 'A0A0A8', ter: '7A7A82', dis: '58585E',
      accent: 'A8A8B3', hover: 'C8C8D0', accentSubtle: '232327',
      accentBorder: '4A4A52', accentText: 'E8E8EC',
      success: '75E0A7', danger: 'FDA29B',
      syn: { comment: '58585E', keyword: 'C8C8D0', string: 'A8A8B3', number: 'E0E0E6', type: 'F5F5F8', tag: 'A0A0A8', attr: 'C0C0C8' },
    },
  },

  'floral': {
    name: 'Floral',
    light: {
      light: true,
      bg: 'F7FDF9', surface: 'FFFFFF', subtle: 'F0FDF4', muted: 'DCFCE7',
      border: 'BBF7D0', strong: '86EFAC',
      text: '14532D', sec: '166534', ter: '16A34A', dis: '4ADE80',
      accent: 'EC4899', hover: 'DB2777', accentSubtle: 'FCE7F3',
      accentBorder: 'F9A8D4', accentText: 'BE185D',
      success: '16A34A', danger: 'B42318',
      syn: { comment: '16A34A', keyword: 'BE185D', string: '15803D', number: 'DB2777', type: '166534', tag: '15803D', attr: 'DB2777' },
    },
    dark: {
      light: false,
      bg: '0B1A12', surface: '102419', subtle: '15301F', muted: '1B3D28',
      border: '245A36', strong: '2F7A46',
      text: 'DCFCE7', sec: '86EFAC', ter: '3FA66B', dis: '2E6B45',
      accent: 'EC4899', hover: 'F472B6', accentSubtle: '3A1828',
      accentBorder: '9D174D', accentText: 'F9A8D4',
      success: '4ADE80', danger: 'FDA29B',
      syn: { comment: '3FA66B', keyword: 'F472B6', string: '86EFAC', number: 'FDB022', type: '6EE7B7', tag: '4ADE80', attr: 'F9A8D4' },
    },
  },

  'cafe-latte': {
    name: 'Café Latte',
    light: {
      light: true,
      bg: 'FAF6F0', surface: 'FFFFFF', subtle: 'F7F1E8', muted: 'EFE4D5',
      border: 'E0CEB5', strong: 'C9AF90',
      text: '271F17', sec: '564432', ter: '745A42', dis: '9E8266',
      accent: 'A0704A', hover: '855A3A', accentSubtle: 'F5EBE0',
      accentBorder: 'D9BC9E', accentText: '6B4830',
      success: '027A48', danger: 'B42318',
      syn: { comment: '9E8266', keyword: '6B4830', string: '855A3A', number: '9A4B1B', type: '564432', tag: 'A0704A', attr: '855A3A' },
    },
    dark: {
      light: false,
      bg: '17110B', surface: '221A12', subtle: '2A2016', muted: '352A1E',
      border: '4A3B2B', strong: '6B5540',
      text: 'F5EBE0', sec: 'E0CEB5', ter: 'C39B78', dis: '8A6E55',
      accent: 'C39B78', hover: 'D9BC9E', accentSubtle: '3A2C1C',
      accentBorder: '6B4830', accentText: 'E9C9A6',
      success: '8BD39A', danger: 'E88F7D',
      syn: { comment: '8A6E55', keyword: 'D9BC9E', string: 'E0CEB5', number: 'E8A87C', type: 'C39B78', tag: 'C39B78', attr: 'E9C9A6' },
    },
  },
};

// Nombre y clase de cada combinación tema + modo
function __vcId(key, mode) { return `${key}-${mode}`; }
function __vcModeName(mode) { return mode === 'light' ? 'Claro' : 'Oscuro'; }

function __vcCss(id, p) {
  const shadow = p.light
    ? ['0 1px 2px rgba(0,0,0,0.06)', '0 1px 3px rgba(0,0,0,0.10)', '0 4px 12px rgba(0,0,0,0.12)', '0 12px 32px rgba(0,0,0,0.16)']
    : ['0 1px 2px rgba(0,0,0,0.3)', '0 1px 3px rgba(0,0,0,0.4)', '0 4px 8px -2px rgba(0,0,0,0.4)', '0 12px 16px -4px rgba(0,0,0,0.4)'];
  const v = `
    --bg-page: #${p.bg};
    --bg-surface: #${p.surface};
    --bg-subtle: #${p.subtle};
    --bg-muted: #${p.muted};
    --border: #${p.border};
    --border-strong: #${p.strong};
    --text: #${p.text};
    --text-secondary: #${p.sec};
    --text-tertiary: #${p.ter};
    --text-disabled: #${p.dis};
    --accent: #${p.accent};
    --accent-hover: #${p.hover};
    --accent-subtle: #${p.accentSubtle};
    --accent-border: #${p.accentBorder};
    --accent-text: #${p.accentText};
    --success: #${p.success};
    --danger: #${p.danger};
    --sh-xs: ${shadow[0]};
    --sh-sm: ${shadow[1]};
    --sh-md: ${shadow[2]};
    --sh-lg: ${shadow[3]};
  `;
  return `body.cod-theme-${id} { ${v} }`;
}

function __vcMonacoTheme(p) {
  const s = p.syn;
  return {
    base: p.light ? 'vs' : 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: s.comment, fontStyle: 'italic' },
      { token: 'keyword', foreground: s.keyword, fontStyle: 'bold' },
      { token: 'string', foreground: s.string },
      { token: 'number', foreground: s.number },
      { token: 'type', foreground: s.type },
      { token: 'delimiter', foreground: p.sec },
      { token: 'tag', foreground: s.tag },
      { token: 'attribute.name', foreground: s.attr },
      { token: 'attribute.value', foreground: s.string },
    ],
    colors: {
      'editor.background': `#${p.surface}`,
      'editor.foreground': `#${p.text}`,
      'editorLineNumber.foreground': `#${p.dis}`,
      'editorLineNumber.activeForeground': `#${p.sec}`,
      'editor.lineHighlightBackground': `#${p.subtle}`,
      'editor.lineHighlightBorder': '#00000000',
      'editorCursor.foreground': `#${p.accent}`,
      'editor.selectionBackground': `#${p.accentBorder}`,
      'editor.inactiveSelectionBackground': `#${p.accentSubtle}`,
      'editorIndentGuide.background1': `#${p.muted}`,
      'editorIndentGuide.activeBackground1': `#${p.strong}`,
      'editorWidget.background': `#${p.subtle}`,
      'editorWidget.border': `#${p.border}`,
      'editorSuggestWidget.background': `#${p.subtle}`,
      'editorSuggestWidget.selectedBackground': `#${p.accentSubtle}`,
      'editorBracketMatch.background': `#${p.accentSubtle}`,
      'editorBracketMatch.border': `#${p.accent}`,
      'scrollbarSlider.background': `#${p.strong}80`,
    },
  };
}

CodHestudio.register({
  id: 'visualcode',
  name: 'VisualCode',
  icon: 'palette',
  description: 'Temas de color con modo claro y oscuro: Wuu, Hybrid, Github Lover, Cuarzo Rosado, Oficina, Floral, Café Latte, En busca del tema perdido y Bizzaras Desventuras.',
  version: '2.0.0',

  activate(ctx) {
    const STYLE_ID = 'vc-style';
    const st = document.createElement('style');
    st.id = STYLE_ID;
    const cssParts = [];
    for (const [key, theme] of Object.entries(__vcThemes)) {
      cssParts.push(__vcCss(__vcId(key, 'light'), theme.light));
      cssParts.push(__vcCss(__vcId(key, 'dark'), theme.dark));
    }
    st.textContent = cssParts.join('\n') + `
      .vc-list { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
      .vc-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: var(--bg-page);
        border: 1px solid var(--border);
        border-radius: var(--r);
      }
      .vc-row.selected { border-color: var(--accent); }
      .vc-name { flex: 1; font-weight: 500; font-size: 0.88rem; color: var(--text); }
      .vc-modes { display: flex; gap: 8px; }
      .vc-mode {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        color: var(--text-secondary);
        font-family: var(--font);
        font-size: 0.78rem;
        cursor: pointer;
        transition: all 0.15s;
      }
      .vc-mode:hover { border-color: var(--border-strong); }
      .vc-mode.active { border-color: var(--accent); background: var(--accent-subtle); color: var(--accent-text); }
      .vc-swatches { display: inline-flex; gap: 2px; }
      .vc-swatches span { width: 11px; height: 11px; border-radius: 3px; border: 1px solid rgba(128,128,128,0.35); }
      .vc-orig { font-size: 0.78rem; color: var(--text-tertiary); }
    `;
    document.head.appendChild(st);

    // Estado: clave del tema o null (Original). El modo lo decide el botón de luna de la app.
    let current = null;
    const saved = ctx.storage.get('theme', null);
    const savedKey = saved && typeof saved === 'object' ? saved.key : saved;
    if (typeof savedKey === 'string' && __vcThemes[savedKey]) current = savedKey;
    const modeNow = () => (document.body.classList.contains('dark-mode') ? 'dark' : 'light');

    function defineMonaco() {
      const m = window.monaco;
      if (!m) return;
      for (const [key, theme] of Object.entries(__vcThemes)) {
        m.editor.defineTheme(`cod-vc-${__vcId(key, 'light')}`, __vcMonacoTheme(theme.light));
        m.editor.defineTheme(`cod-vc-${__vcId(key, 'dark')}`, __vcMonacoTheme(theme.dark));
      }
    }

    function clearClasses() {
      [...document.body.classList]
        .filter(c => c.startsWith('cod-theme-'))
        .forEach(c => document.body.classList.remove(c));
    }

    function applyTheme(key) {
      current = key && __vcThemes[key] ? key : null;
      clearClasses();

      if (current) {
        const id = __vcId(current, modeNow());
        document.body.classList.add(`cod-theme-${id}`);
        if (window.monaco) window.monaco.editor.setTheme(`cod-vc-${id}`);
      } else if (window.monaco) {
        window.monaco.editor.setTheme(ctx.state.monacoTheme);
      }
      ctx.storage.set('theme', current);
    }

    function openPicker() {
      const overlay = document.createElement('div');
      overlay.className = 'modal';

      const box = document.createElement('div');
      box.className = 'modal-content';
      box.innerHTML = `<h2>Temas de color</h2>
        <p class="modal-desc">Elige un tema. Se aplica en claro u oscuro según el botón de luna de la barra.</p>`;

      const list = document.createElement('div');
      list.className = 'vc-list';

      function swatchesOf(p) {
        return `<span class="vc-swatches">
          <span style="background:#${p.bg}"></span>
          <span style="background:#${p.surface}"></span>
          <span style="background:#${p.accent}"></span>
          <span style="background:#${p.text}"></span>
        </span>`;
      }

      function render() {
        list.innerHTML = '';

        // Original: vuelve a los colores de Cod-Hestudio y sigue el botón de luna de la app
        const orig = document.createElement('div');
        orig.className = 'vc-row' + (current === null ? ' selected' : '');
        orig.innerHTML = `<span class="vc-name">Original de Cod-Hestudio</span><span class="vc-orig">${current === null ? 'Activo' : ''}</span>`;
        orig.addEventListener('click', () => { applyTheme(null); render(); });
        list.appendChild(orig);

        for (const [key, theme] of Object.entries(__vcThemes)) {
          const isActive = current === key;
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'vc-row' + (isActive ? ' selected' : '');
          row.innerHTML = `${swatchesOf(theme[modeNow()])}<span class="vc-name"></span><span class="vc-orig">${isActive ? 'Activo' : ''}</span>`;
          row.querySelector('.vc-name').textContent = theme.name;
          row.addEventListener('click', () => { applyTheme(key); render(); });
          list.appendChild(row);
        }
      }

      const actions = document.createElement('div');
      actions.className = 'modal-actions';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'btn btn-secondary';
      cancel.textContent = 'Cerrar';
      cancel.addEventListener('click', () => close());
      actions.appendChild(cancel);

      box.append(list, actions);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      render();

      function close() {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
      }
      function onKey(e) { if (e.key === 'Escape') close(); }
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      document.addEventListener('keydown', onKey, true);
    }

    ctx.ui.addToolbarItem({
      id: 'visualcode-btn',
      title: 'Temas de color',
      icon: 'palette',
      onClick: openPicker,
    });

    // El botón de luna de la app cambia el modo del tema activo, igual que en el tema base
    ctx.on('theme:change', () => {
      if (current) applyTheme(current);
    });

    ctx.on('editor:ready', () => {
      defineMonaco();
      applyTheme(current);
    });

    defineMonaco();
    applyTheme(current);

    ctx.cleanup(() => {
      document.getElementById(STYLE_ID)?.remove();
      clearClasses();
      if (window.monaco) window.monaco.editor.setTheme(ctx.state.monacoTheme);
    });
  },
});