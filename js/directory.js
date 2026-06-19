import { SENIORS } from './data.js';
import { getContactStatus, getSeniorEmail } from './auth.js';
import { escapeHtml, avColor } from './utils.js';
import { playClick } from './effects.js';

let currentList = SENIORS;
let filtersBound = false;
let districtDropdownBound = false;
let modalBound = false;
let contactUpdatesBound = false;

const MAP_PIN_ICON = `
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M8 14.2c2.7-3.1 4-5.3 4-7.3A4 4 0 1 0 4 6.9c0 2 1.3 4.2 4 7.3Z" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="8" cy="6.6" r="1.45" fill="currentColor"/>
  </svg>`;

export function initDirectory() {
  buildDistrictFilter();
  initDistrictDropdown();
  bindDirectoryFilters();
  bindSeniorModal();
  bindContactUpdates();
  filterCards();
  updatePrivacyNote();
}

function buildDistrictFilter() {
  const sel = document.getElementById('district-filter');
  if (!sel || sel.options.length > 1) return;
  [...new Set(SENIORS.map((s) => s.district))].sort().forEach((d) => {
    const o = document.createElement('option');
    o.value = d;
    o.textContent = d;
    sel.appendChild(o);
  });
}

function bindDirectoryFilters() {
  if (filtersBound) return;
  filtersBound = true;
  document.getElementById('search-input')?.addEventListener('input', filterCards);
  document.getElementById('district-filter')?.addEventListener('change', filterCards);
  document.getElementById('filter-reset')?.addEventListener('click', resetFilters);
}

function initDistrictDropdown() {
  const wrapper = document.querySelector('[data-district-select]');
  const select = document.getElementById('district-filter');
  const trigger = document.getElementById('district-filter-trigger');
  const label = document.getElementById('district-filter-label');
  const menu = document.getElementById('district-filter-menu');
  if (!wrapper || !select || !trigger || !label || !menu) return;

  renderDistrictOptions();
  syncDistrictDropdown();

  if (districtDropdownBound) return;
  districtDropdownBound = true;

  trigger.addEventListener('click', () => {
    wrapper.classList.contains('open') ? closeDistrictDropdown() : openDistrictDropdown();
  });

  trigger.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openDistrictDropdown();
      focusSelectedDistrictOption();
    }
  });

  menu.addEventListener('click', (e) => {
    const option = e.target.closest('[data-value]');
    if (!option) return;
    select.value = option.dataset.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    syncDistrictDropdown();
    closeDistrictDropdown();
    trigger.focus();
  });

  menu.addEventListener('keydown', (e) => {
    const options = [...menu.querySelectorAll('.district-select-option')];
    const current = document.activeElement;
    const index = Math.max(0, options.indexOf(current));

    if (e.key === 'Escape') {
      e.preventDefault();
      closeDistrictDropdown();
      trigger.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      options[Math.min(index + 1, options.length - 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      options[Math.max(index - 1, 0)]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      options[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      options[options.length - 1]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      current?.click();
    }
  });

  select.addEventListener('change', syncDistrictDropdown);

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) closeDistrictDropdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDistrictDropdown();
  });
}

function renderDistrictOptions() {
  const select = document.getElementById('district-filter');
  const menu = document.getElementById('district-filter-menu');
  if (!select || !menu) return;

  menu.innerHTML = '';
  [...select.options].forEach((option) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'district-select-option';
    btn.setAttribute('role', 'option');
    btn.dataset.value = option.value;
    btn.textContent = option.textContent;
    menu.appendChild(btn);
  });
}

function syncDistrictDropdown() {
  const select = document.getElementById('district-filter');
  const label = document.getElementById('district-filter-label');
  const menu = document.getElementById('district-filter-menu');
  if (!select || !label || !menu) return;

  const selected = select.options[select.selectedIndex];
  label.textContent = selected?.textContent || 'All districts';

  menu.querySelectorAll('.district-select-option').forEach((option) => {
    const isSelected = option.dataset.value === select.value;
    option.classList.toggle('selected', isSelected);
    option.setAttribute('aria-selected', String(isSelected));
  });
}

function openDistrictDropdown() {
  const wrapper = document.querySelector('[data-district-select]');
  const trigger = document.getElementById('district-filter-trigger');
  wrapper?.classList.add('open');
  trigger?.setAttribute('aria-expanded', 'true');
}

function closeDistrictDropdown() {
  const wrapper = document.querySelector('[data-district-select]');
  const trigger = document.getElementById('district-filter-trigger');
  wrapper?.classList.remove('open');
  trigger?.setAttribute('aria-expanded', 'false');
}

function focusSelectedDistrictOption() {
  const selected = document.querySelector('.district-select-option.selected');
  const first = document.querySelector('.district-select-option');
  (selected || first)?.focus();
}

function filterCards() {
  const q = document.getElementById('search-input')?.value.trim().toLowerCase() || '';
  const d = document.getElementById('district-filter')?.value || '';
  currentList = SENIORS.filter((s) => {
    const txt = `${s.name} ${s.nickname} ${s.reg} ${s.district}`.toLowerCase();
    return (!q || txt.includes(q)) && (!d || s.district === d);
  });
  renderCards(currentList);
  updateFilterState(q, d);
}

function resetFilters() {
  const input = document.getElementById('search-input');
  const select = document.getElementById('district-filter');
  if (input) input.value = '';
  if (select) {
    select.value = '';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    filterCards();
  }
  syncDistrictDropdown();
}

function updateFilterState(q, d) {
  const reset = document.getElementById('filter-reset');
  const count = document.getElementById('senior-count');
  const active = Boolean(q || d);
  if (reset) reset.disabled = !active;
  if (count) {
    count.textContent = active
      ? `${currentList.length} of ${SENIORS.length} seniors · filtered`
      : `${SENIORS.length} seniors · SUST CSE`;
  }
}

function bindContactUpdates() {
  if (contactUpdatesBound) return;
  contactUpdatesBound = true;
  window.addEventListener('senior-contacts-updated', () => {
    renderCards(currentList);
    updatePrivacyNote();
  });
}

function updatePrivacyNote() {
  const note = document.getElementById('privacy-note');
  if (!note) return;
  const status = getContactStatus();
  note.textContent = status.message;
  note.hidden = !status.message;
  note.classList.toggle('unavailable', status.state === 'unavailable');
}

function getCardHint(s) {
  const status = getContactStatus();
  if (status.state === 'available' && getSeniorEmail(s.reg)) return 'View verified email';
  if (status.state === 'loading') return 'Loading email access';
  if (status.state === 'unavailable') return 'Email unavailable right now';
  return 'View public profile';
}

function renderCards(list) {
  const div = document.getElementById('dir-view');
  if (!div) return;
  div.innerHTML = '';

  if (list.length === 0) {
    div.innerHTML = '<p class="empty-note">No seniors match this search. Try a different name, reg, or district.</p>';
    return;
  }

  list.forEach((s, i) => {
    const col = avColor(i);
    const card = document.createElement('div');
    card.className = 'senior-card';
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="sc-top">
        <div class="sc-av" style="background:${col}">${escapeHtml(s.initials)}</div>
        <div>
          <div class="sc-name">${escapeHtml(s.name)}</div>
          <div class="sc-nick">${escapeHtml(s.nickname)}</div>
        </div>
      </div>
      <div class="sc-row"><span class="sc-icon sc-icon-pin">${MAP_PIN_ICON}</span>${escapeHtml(s.district)}</div>
      <div class="sc-row"><span class="sc-icon">#</span>${escapeHtml(s.reg)}</div>
      <div class="sc-hint">${escapeHtml(getCardHint(s))}</div>`;
    card.addEventListener('click', () => openSeniorModal(s, col));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSeniorModal(s, col);
      }
    });
    div.appendChild(card);
  });
}

function bindSeniorModal() {
  if (modalBound) return;
  modalBound = true;

  document.querySelectorAll('[data-close-senior]').forEach((el) => {
    el.addEventListener('click', closeSeniorModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSeniorModal();
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '';
}

function setLink(id, value, hrefPrefix) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value || '';
  el.href = value ? `${hrefPrefix}${value}` : '#';
}

function setContactField(fieldId, linkId, value, hrefPrefix) {
  const field = document.getElementById(fieldId);
  if (field) field.hidden = !value;
  setLink(linkId, value, hrefPrefix);
}

function setContactNote(value) {
  const note = document.getElementById('sd-contact-note');
  if (!note) return;
  note.textContent = value || '';
  note.hidden = !value;
}

function openSeniorModal(s, color) {
  playClick();
  const modal = document.getElementById('senior-modal');
  const avatar = document.getElementById('sd-avatar');
  if (!modal) return;

  if (avatar) {
    avatar.textContent = s.initials || '';
    avatar.style.background = color;
  }

  setText('sd-name', s.name);
  setText('sd-nick', s.nickname);
  setText('sd-district', s.district);
  setText('sd-reg', s.reg);

  const email = getSeniorEmail(s.reg);
  const status = getContactStatus();
  setContactField('sd-email-field', 'sd-email', email, 'mailto:');
  setContactNote(email ? '' : status.message);

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('.sd-close')?.focus();
}

function closeSeniorModal() {
  const modal = document.getElementById('senior-modal');
  if (!modal?.classList.contains('open')) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}
