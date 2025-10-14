// save.js — simple localStorage wrapper (NO modules; exposes window.save)
(function () {
  'use strict';

  const KEY = 'resim_save_v2';

  function saveGame(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('save failed', e); }
  }

  function loadSave() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch { return null; }
  }

  function resetSave() {
    try { localStorage.removeItem(KEY); }
    catch (e) { console.warn('reset failed', e); }
  }

  window.save = { saveGame, loadSave, resetSave, KEY };
})();
