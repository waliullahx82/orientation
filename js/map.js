import { SENIORS, DISTRICTS_MAP } from './data.js';
import { avColor, mapDistrictName, escapeHtml } from './utils.js';
import { playClick } from './effects.js';

function isTouchMapMode() {
  return window.matchMedia?.('(hover: none), (pointer: coarse)').matches || false;
}

export function initMap() {
  buildMap();
  document.querySelector('.mp-close')?.addEventListener('click', closeMapPanel);
}

function buildMap() {
  const svg = document.getElementById('bd-svg');
  if (!svg || svg.dataset.built) return;
  svg.dataset.built = '1';

  svg.innerHTML = `
    <defs>
      <pattern id="mgrid" width="22" height="22" patternUnits="userSpaceOnUse">
        <path d="M22 0L0 0 0 22" fill="none" stroke="rgba(244,160,36,0.04)" stroke-width=".5"/>
      </pattern>
    </defs>
    <rect width="520" height="560" fill="url(#mgrid)"/>
    <g id="map-districts-group"></g>
    <g id="map-markers-group"></g>`;

  const distGroup = document.getElementById('map-districts-group');
  const markerGroup = document.getElementById('map-markers-group');

  const byDist = {};
  SENIORS.forEach((s) => {
    const key = mapDistrictName(s.district);
    if (!byDist[key]) byDist[key] = [];
    byDist[key].push(s);
  });

  DISTRICTS_MAP.forEach((d, di) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d.path);
    path.setAttribute('class', 'district-path');
    const count = byDist[d.name]?.length || 0;

    path.style.fill = count > 0 ? 'rgba(244, 160, 36, 0.08)' : 'rgba(255, 255, 255, 0.02)';
    path.style.stroke = count > 0 ? 'rgba(244, 160, 36, 0.28)' : 'rgba(244, 160, 36, 0.08)';

    path.addEventListener('mouseenter', (e) => {
      path.style.fill = 'rgba(244, 160, 36, 0.2)';
      path.style.stroke = 'var(--saffron)';
      showMapTooltip(e, d.name, count);
    });

    path.addEventListener('mouseleave', () => {
      path.style.fill = count > 0 ? 'rgba(244, 160, 36, 0.08)' : 'rgba(255, 255, 255, 0.02)';
      path.style.stroke = count > 0 ? 'rgba(244, 160, 36, 0.28)' : 'rgba(244, 160, 36, 0.08)';
      hideTooltip();
    });

    path.addEventListener('click', () => openMapPanel(d.name, byDist[d.name] || []));
    distGroup.appendChild(path);

    if (count > 0) {
      const col = avColor(di);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'map-marker');
      const { cx, cy } = d;
      g.innerHTML = `
        <circle class="marker-pulse" cx="${cx}" cy="${cy}" r="5" fill="none" stroke="${col}" stroke-width="1" style="animation-delay:${(di * 0.3) % 3}s"/>
        <circle cx="${cx}" cy="${cy}" r="4" fill="${col}" opacity="0.9"/>
        <circle cx="${cx}" cy="${cy}" r="10" fill="transparent"/>`;
      g.addEventListener('mouseenter', (e) => {
        showMapTooltip(e, d.name, count);
      });
      g.addEventListener('mouseleave', hideTooltip);
      g.addEventListener('click', () => openMapPanel(d.name, byDist[d.name]));
      markerGroup.appendChild(g);
    }
  });
}

function showMapTooltip(e, dist, count) {
  if (isTouchMapMode()) {
    hideTooltip();
    return;
  }

  const tt = document.getElementById('map-tooltip');
  if (!tt) return;
  tt.innerHTML = `
    <div class="mt-name">${escapeHtml(dist)}</div>
    <div class="mt-reg">${count} senior${count !== 1 ? 's' : ''}</div>`;
  tt.style.left = `${e.offsetX + 12}px`;
  tt.style.top = `${e.offsetY - 10}px`;
  tt.classList.add('show');
}

function hideTooltip() {
  document.getElementById('map-tooltip')?.classList.remove('show');
}

function openMapPanel(dist, list) {
  playClick();
  hideTooltip();
  const label = document.getElementById('mp-dist-label');
  const cards = document.getElementById('mp-cards');
  if (!label || !cards) return;

  label.textContent = `${dist.toUpperCase()} // ${list.length} senior${list.length !== 1 ? 's' : ''}`;
  cards.innerHTML = '';

  if (list.length === 0) {
    cards.innerHTML = '<p class="empty-note">No seniors from this district.</p>';
  } else {
    list.forEach((s, i) => {
      const col = avColor(i);
      const div = document.createElement('div');
      div.className = 'mp-card';
      div.innerHTML = `
        <div class="mp-card-top">
          <div class="mp-av" style="background:${col}">${escapeHtml(s.initials)}</div>
          <div><div class="mp-name">${escapeHtml(s.name)}</div><div class="mp-reg">${escapeHtml(s.reg)}</div></div>
        </div>
        <div class="mp-info">📱 ${escapeHtml(s.mobile)}<br>✉ ${escapeHtml(s.email)}</div>`;
      cards.appendChild(div);
    });
  }

  document.getElementById('map-panel')?.classList.add('open');
}

function closeMapPanel() {
  document.getElementById('map-panel')?.classList.remove('open');
}

export function switchView(v, silent = false) {
  if (!silent) playClick();
  hideTooltip();
  document.getElementById('vt-dir')?.classList.toggle('on', v === 'dir');
  document.getElementById('vt-map')?.classList.toggle('on', v === 'map');
  const dirView = document.getElementById('dir-view');
  const mapView = document.getElementById('map-view');
  const searchBar = document.getElementById('search-bar');
  if (dirView) dirView.style.display = v === 'dir' ? '' : 'none';
  if (mapView) mapView.style.display = v === 'map' ? 'block' : 'none';
  if (searchBar) searchBar.style.display = v === 'dir' ? '' : 'none';


}
