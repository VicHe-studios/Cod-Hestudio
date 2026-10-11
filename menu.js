// =============================================================
//  Cod-Hestudio · Lobby
//  - Carga de iconos Lucide
//  - Animación de entrada con IntersectionObserver
//  - Año dinámico en el pie
// =============================================================

(function () {
  'use strict';

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (_) {}
    }
  }

  function setYear() {
    const el = document.getElementById('cYear');
    if (el) el.textContent = new Date().getFullYear();
  }

  // Bloques que se revelan al entrar en pantalla, con un pequeño retardo escalonado
  function initReveal() {
    const targets = [
      document.querySelector('.c-hero'),
      document.querySelector('.c-options'),
      document.querySelector('.c-values'),
      document.querySelector('.c-credits'),
      document.querySelector('.c-footer')
    ].filter(Boolean);

    if (targets.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(t => t.classList.add('is-visible'));
      return;
    }

    targets.forEach((el, i) => {
      el.classList.add('c-reveal');
      el.style.transitionDelay = (i * 60) + 'ms';
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => io.observe(el));
  }

  // Modo claro/oscuro: lo toma del editor (clave cod-hestudio-theme)
  function applyTheme(value) {
    document.documentElement.classList.toggle('dark', value === 'dark');
  }

  function initTheme() {
    try { applyTheme(localStorage.getItem('cod-hestudio-theme')); } catch (_) {}
    window.addEventListener('storage', (e) => {
      if (e.key === 'cod-hestudio-theme') applyTheme(e.newValue);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setYear();
    refreshIcons();
    initReveal();
    window.addEventListener('load', refreshIcons);
  });
})();