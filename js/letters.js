import { QUOTES } from './data.js';
import { avColor, initials } from './utils.js';
import { playClick } from './effects.js';

let qIdx = 0;
let touchDeltaX = 0;
let touchStartX = 0;

let lettersBuilt = false;

export function initLetters() {
  if (!lettersBuilt) {
    buildCarousel();
    document.getElementById('letter-prev')?.addEventListener('click', () => goTo(qIdx - 1));
    document.getElementById('letter-next')?.addEventListener('click', () => goTo(qIdx + 1));
    lettersBuilt = true;
  }
  renderQuote(qIdx, false);
}

function buildCarousel() {
  const track = document.getElementById('letters-track');
  const dots = document.getElementById('letters-dots');
  if (!track || !dots) return;

  track.innerHTML = '';
  dots.innerHTML = '<div class="lnav-progress-fill" id="letters-progress-fill"></div>';

  QUOTES.forEach((_, i) => {
    const slide = document.createElement('article');
    slide.className = 'letter-slide';
    slide.innerHTML = `
      <div class="letter-card">
        <div class="letter-from" data-from></div>
        <div class="letter-body" data-body></div>
        <div class="letter-sig">
          <div class="letter-av" data-av></div>
          <div>
            <div class="letter-sname" data-name></div>
            <div class="letter-smeta" data-meta></div>
          </div>
        </div>
      </div>`;
    track.appendChild(slide);

  });

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchDeltaX = 0;
  }, { passive: true });
  track.addEventListener('touchmove', (e) => {
    touchDeltaX = e.changedTouches[0].screenX - touchStartX;
  }, { passive: true });
  track.addEventListener('touchend', () => {
    if (touchDeltaX < -50) goTo(qIdx + 1);
    else if (touchDeltaX > 50) goTo(qIdx - 1);
    touchDeltaX = 0;
  }, { passive: true });
}

function goTo(i) {
  const ni = Math.max(0, Math.min(QUOTES.length - 1, i));
  if (ni === qIdx) return;
  playClick();
  renderQuote(ni, true);
}

function renderQuote(i, animate) {
  qIdx = i;
  const q = QUOTES[i];
  const track = document.getElementById('letters-track');
  if (track) track.style.transform = `translateX(-${i * 100}%)`;

  document.getElementById('letter-progress').textContent = `Letter ${i + 1} of ${QUOTES.length}`;

  document.querySelectorAll('.letter-slide').forEach((slide, j) => {
    if (j !== i) return;
    slide.querySelector('[data-from]').textContent = `// A letter from your senior — ${q.dist}`;
    slide.querySelector('[data-body]').textContent = q.body;
    slide.querySelector('[data-name]').textContent = q.name;
    slide.querySelector('[data-meta]').textContent = `Reg: ${q.reg} · SUST CSE`;
    const av = slide.querySelector('[data-av]');
    av.textContent = initials(q.name);
    av.style.background = q.color || avColor(j);
    if (animate) {
      const card = slide.querySelector('.letter-card');
      card.style.opacity = '0';
      card.style.transform = 'translateY(10px)';
      setTimeout(() => {
        card.style.transition = 'all 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 20);
    }
  });

  const progressFill = document.getElementById('letters-progress-fill');
  if (progressFill) progressFill.style.width = `${((i + 1) / QUOTES.length) * 100}%`;
  document.getElementById('letter-prev').disabled = i === 0;
  document.getElementById('letter-next').disabled = i === QUOTES.length - 1;
}
