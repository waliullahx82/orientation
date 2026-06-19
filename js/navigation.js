import { playClick } from './effects.js';

const SCREEN_MAP = { s1: 0, 's-reg': 0, s2: 1, s3: 2, s4: 3 };

export function filmCut(targetId, cb) {
  playClick();
  const fade = document.getElementById('film-fade');
  fade?.classList.add('in');
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    document.getElementById(targetId)?.classList.add('active');
    updateBottomNav(targetId);
    cb?.();
    setTimeout(() => fade?.classList.remove('in'), 100);
  }, 460);
}

export function updateBottomNav(sid) {
  document.querySelectorAll('.bnav-dot').forEach((d, i) => {
    d.classList.toggle('on', i === SCREEN_MAP[sid]);
  });
}

export function bindLogoScreen(getLogoTarget = () => ({ target: 's2', init: initS2FromApp })) {
  document.getElementById('s1')?.addEventListener('click', () => {
    const next = getLogoTarget();
    filmCut(next.target, next.init || null);
  });
}

// Set by app.js to avoid circular imports
let initS2FromApp = () => {};

export function setInitS2(fn) {
  initS2FromApp = fn;
}
