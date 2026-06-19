import { JUNIOR_DB } from './data.js';

let juniorName = '';

export function getJuniorName() {
  return juniorName;
}

export function resolveJuniorFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const roll = params.get('junior') || params.get('roll') || params.get('id');
  const nameParam = params.get('name');
  if (roll && JUNIOR_DB[roll]) {
    juniorName = JUNIOR_DB[roll].name;
  } else if (nameParam) {
    juniorName = nameParam;
  }
  return juniorName;
}
