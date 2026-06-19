export const AV_COLORS = ['#F4A024', '#27a85a', '#e05a5a', '#5a8ae0', '#a05ae0', '#e0a05a', '#5ae0c8', '#e05ab4'];

export function avColor(i) {
  return AV_COLORS[i % AV_COLORS.length];
}

export function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export const DISTRICT_ALIASES = {
  Chittagong: 'Chattogram',
  Narayangonj: 'Narayanganj',
  Cumilla: 'Comilla',
};

export function mapDistrictName(name) {
  return DISTRICT_ALIASES[name] || name;
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
