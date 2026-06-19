import { initCodeRain, spawnConfetti } from './effects.js';
import { filmCut, bindLogoScreen, setInitS2, updateBottomNav } from './navigation.js';
import { getJuniorName } from './personalization.js';
import { isVerified, loadSeniorContacts, restoreSession, submitReg } from './auth.js';
import { initLetters } from './letters.js';
import { initDirectory } from './directory.js';
import { initMap, switchView } from './map.js';

let regFormBound = false;
let contactsRequested = false;

function ensureContactsLoaded() {
  if (!isVerified() || contactsRequested) return;
  contactsRequested = true;
  loadSeniorContacts().then(() => {
    initDirectory();
  });
}

export function initS2() {
  const s2 = document.getElementById('s2');
  s2?.classList.remove('s2-anim');
  void s2?.offsetWidth;
  s2?.classList.add('s2-anim');

  const nd = document.getElementById('junior-name-display');
  const name = getJuniorName();
  if (nd && name) {
    nd.textContent = `Welcome, ${name}`;
    nd.style.opacity = '1';
  }

  ensureContactsLoaded();
  spawnConfetti();
}

export function initS3() {
  if (!isVerified()) {
    filmCut('s-reg', initRegScreen);
    return;
  }
  ensureContactsLoaded();
  initLetters();
}

export function initS4() {
  if (!isVerified()) {
    filmCut('s-reg', initRegScreen);
    return;
  }
  ensureContactsLoaded();
  initDirectory();
  initMap();
  switchView('map', true);
}

export function initRegScreen() {
  const input = document.getElementById('reg-input');
  const message = document.getElementById('reg-message');
  const submit = document.getElementById('reg-submit');
  if (input) input.focus();
  if (message) {
    message.textContent = '';
    message.classList.remove('error', 'success');
  }
  if (submit) submit.disabled = false;
}

function setRegMessage(text, state = '') {
  const message = document.getElementById('reg-message');
  if (!message) return;
  message.textContent = text;
  message.classList.toggle('error', state === 'error');
  message.classList.toggle('success', state === 'success');
}

function bindRegForm() {
  if (regFormBound) return;
  regFormBound = true;

  document.getElementById('reg-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('reg-input');
    const submit = document.getElementById('reg-submit');
    const reg = input?.value || '';

    if (submit) submit.disabled = true;
    setRegMessage('Checking your registration...', 'success');

    try {
      const result = await submitReg(reg);
      if (!result.ok) {
        setRegMessage(result.message, 'error');
        if (submit) submit.disabled = false;
        input?.focus();
        return;
      }

      setRegMessage(`Verified. Welcome, ${result.session.name}.`, 'success');
      contactsRequested = false;
      ensureContactsLoaded();
      setTimeout(() => filmCut('s2', initS2), 350);
    } catch (_) {
      setRegMessage('Verification is unavailable right now. Please try again in a moment.', 'error');
      if (submit) submit.disabled = false;
    }
  });
}

function bindNavigation() {
  bindRegForm();
  bindLogoScreen(() => (isVerified()
    ? { target: 's2', init: initS2 }
    : { target: 's-reg', init: initRegScreen }));
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
      if (target !== 's1' && !isVerified()) {
        filmCut('s-reg', initRegScreen);
        return;
      }

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
  restoreSession();

  if (isVerified()) {
    ensureContactsLoaded();
    filmCut('s2', initS2);
  } else {
    updateBottomNav('s1');
  }
}

boot();
