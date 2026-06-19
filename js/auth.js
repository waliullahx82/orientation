const STORAGE_KEY = 'sust-cse-orientation-session';

let session = null;
let seniorContacts = {};
let contactStatus = 'locked';
let contactMessage = 'Verify your registration number to view senior emails.';

function notifyContactUpdate() {
  window.dispatchEvent(new CustomEvent('senior-contacts-updated'));
}

function isFutureDate(value) {
  const time = Date.parse(value);
  return Number.isFinite(time) && time > Date.now();
}

function normalizeSession(value) {
  if (!value || typeof value !== 'object') return null;
  const name = String(value.name || '').trim();
  const token = String(value.token || '').trim();
  const expiresAt = String(value.expiresAt || '').trim();
  if (!name || !token || !isFutureDate(expiresAt)) return null;
  return { name, token, expiresAt };
}

function readStoredSession() {
  try {
    return normalizeSession(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
  } catch (_) {
    return null;
  }
}

function writeStoredSession(nextSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  } catch (_) {
    /* storage may be unavailable */
  }
}

function clearStoredSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {
    /* storage may be unavailable */
  }
}

export function getJuniorName() {
  return session?.name || '';
}

export function getSession() {
  return session;
}

export function isVerified() {
  return Boolean(normalizeSession(session));
}

export function getSeniorContacts() {
  return seniorContacts;
}

export function getSeniorEmail(reg) {
  return seniorContacts[reg] || '';
}

export function getContactStatus() {
  return { state: contactStatus, message: contactMessage };
}

export function restoreSession() {
  session = readStoredSession();
  if (!session) {
    seniorContacts = {};
    contactStatus = 'locked';
    contactMessage = 'Verify your registration number to view senior emails.';
    clearStoredSession();
    notifyContactUpdate();
  }
  return session;
}

export async function submitReg(reg) {
  const cleanedReg = String(reg || '').replace(/\D/g, '');
  if (!cleanedReg) {
    return {
      ok: false,
      message: 'Enter your registration number to continue.',
    };
  }

  const response = await fetch('/api/verify-junior', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reg: cleanedReg }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    return {
      ok: false,
      message: data.message || 'We could not verify that registration number. Please try again.',
    };
  }

  const nextSession = normalizeSession(data);
  if (!nextSession) {
    return {
      ok: false,
      message: 'Verification worked, but the session response was incomplete. Please try again.',
    };
  }

  session = nextSession;
  writeStoredSession(session);
  return { ok: true, session };
}

export async function loadSeniorContacts() {
  if (!isVerified()) {
    seniorContacts = {};
    contactStatus = 'locked';
    contactMessage = 'Verify your registration number to view senior emails.';
    notifyContactUpdate();
    return { ok: false, contacts: seniorContacts };
  }

  contactStatus = 'loading';
  contactMessage = 'Loading verified senior emails...';
  notifyContactUpdate();

  try {
    const response = await fetch('/api/senior-contacts', {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok || !data.contacts || typeof data.contacts !== 'object') {
      seniorContacts = {};
      contactStatus = response.status === 401 ? 'locked' : 'unavailable';
      contactMessage = 'Email unavailable right now.';
      if (response.status === 401) clearStoredSession();
      notifyContactUpdate();
      return { ok: false, contacts: seniorContacts };
    }

    seniorContacts = data.contacts;
    contactStatus = 'available';
    contactMessage = '';
    notifyContactUpdate();
    return { ok: true, contacts: seniorContacts };
  } catch (_) {
    seniorContacts = {};
    contactStatus = 'unavailable';
    contactMessage = 'Email unavailable right now.';
    notifyContactUpdate();
    return { ok: false, contacts: seniorContacts };
  }
}
