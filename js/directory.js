import { SENIORS } from './data.js';
import { escapeHtml, avColor } from './utils.js';
import { playClick } from './effects.js';

export function initDirectory() {
  buildDistrictFilter();
  initDistrictDropdown();
  bindSeniorModal();
  renderCards(SENIORS);
  document.getElementById('search-input')?.addEventListener('input', filterCards);
  document.getElementById('district-filter')?.addEventListener('change', filterCards);
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

let districtDropdownBound = false;

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
  const q = document.getElementById('search-input')?.value.toLowerCase() || '';
  const d = document.getElementById('district-filter')?.value || '';
  const filtered = SENIORS.filter((s) => {
    const txt = (s.name + s.nickname + s.reg + s.district).toLowerCase();
    return (!q || txt.includes(q)) && (!d || s.district === d);
  });
  renderCards(filtered);
}

function renderCards(list) {
  const div = document.getElementById('dir-view');
  const count = document.getElementById('senior-count');
  if (!div) return;
  if (count) count.textContent = `${list.length} seniors · SUST CSE`;
  div.innerHTML = '';

  if (list.length === 0) {
    div.innerHTML = '<p class="empty-note">No seniors match your search.</p>';
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
      <div class="sc-row"><span class="sc-icon">📍</span>${escapeHtml(s.district)}</div>
      <div class="sc-row"><span class="sc-icon">#</span>${escapeHtml(s.reg)}</div>
      <div class="sc-hint">View full details</div>`;
    card.addEventListener('click', () => {
      openSeniorModal(s, col);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSeniorModal(s, col);
      }
    });
    div.appendChild(card);
  });
}

let modalBound = false;

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
  setLink('sd-phone', s.mobile, 'tel:');
  setLink('sd-email', s.email, 'mailto:');

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeSeniorModal() {
  const modal = document.getElementById('senior-modal');
  if (!modal?.classList.contains('open')) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}
