import { initCodeRain, spawnConfetti } from './effects.js';
import { filmCut, bindLogoScreen, setInitS2, updateBottomNav } from './navigation.js';
import { resolveJuniorFromUrl, getJuniorName } from './personalization.js';
import { initLetters } from './letters.js';
import { initDirectory } from './directory.js';
import { initMap, switchView } from './map.js';

export function initS2() {
  const s2 = document.getElementById('s2');
  s2?.classList.remove('s2-anim');
  void s2?.offsetWidth;
  s2?.classList.add('s2-anim');
  const nd = document.getElementById('junior-name-display');
  const name = getJuniorName();
  if (nd && name) {
    nd.textContent = `Welcome, ${name} 🎉`;
    nd.style.opacity = '1';
  }
  spawnConfetti();
}

export function initS3() {
  initLetters();
}

export function initS4() {
  initDirectory();
  initMap();
  switchView('map', true);
}

function bindNavigation() {
  bindLogoScreen();
  setInitS2(initS2);

  document.getElementById('btn-to-letters')?.addEventListener('click', () => {
    filmCut('s3', initS3);
  });

  document.getElementById('btn-to-connect')?.addEventListener('click', () => {
    filmCut('s4', initS4);
  });

  document.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => {
      const target = el.dataset.goto;
      const inits = { s1: null, s2: initS2, s3: initS3, s4: initS4 };
      filmCut(target, inits[target] || null);
    });
  });

  document.getElementById('vt-dir')?.addEventListener('click', () => switchView('dir'));
  document.getElementById('vt-map')?.addEventListener('click', () => switchView('map'));
}

function boot() {
  initCodeRain();
  bindNavigation();
  resolveJuniorFromUrl();

  const params = new URLSearchParams(window.location.search);
  const roll = params.get('junior') || params.get('roll') || params.get('id');
  if (roll && getJuniorName()) {
    filmCut('s2', initS2);
  } else {
    updateBottomNav('s1');
  }
}

boot();
