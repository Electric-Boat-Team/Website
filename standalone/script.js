const desktopMotion = matchMedia('(min-width: 1000px) and (prefers-reduced-motion: no-preference)');

const hero = document.querySelector('.hero');
const stories = [...document.querySelectorAll('.engineering-story')];
const clamp = value => Math.max(0, Math.min(1, value));

const stage = document.querySelector('.engineering-stage');
const frames = [...document.querySelectorAll('.stage-frame')];
let activeIndex = -1;
let heroProgress = -1;

let pending = false;
function renderScroll() {
  pending = false;
  if (!desktopMotion.matches) return;
  if (hero) {
    const bounds = hero.getBoundingClientRect();
    const progress = clamp(-bounds.top / bounds.height);
    if (progress !== heroProgress) {
      hero.style.setProperty('--hero-pan', `${-progress * 32}px`);
      hero.style.setProperty('--hero-scale', `${1.04 + progress * .06}`);
      heroProgress = progress;
    }
  }
  if (stage) {
    const stageBounds = stage.getBoundingClientRect();
    const readingLine = stageBounds.top + stageBounds.height / 2;
    let closest = Infinity;
    let index = 0;
    stories.forEach((story, i) => {
      const bounds = story.getBoundingClientRect();
      const distance = Math.abs(bounds.top + bounds.height / 2 - readingLine);
      if (distance < closest) { closest = distance; index = i; }
    });
    if (index !== activeIndex) {
      frames.forEach((frame, i) => {
        frame.classList.toggle('is-active', i === index);
        frame.setAttribute('aria-hidden', String(i !== index));
      });
      activeIndex = index;
    }
  }
}
function scheduleScroll() {
  if (pending || !desktopMotion.matches) return;
  pending = true;
  requestAnimationFrame(renderScroll);
}
function updateScrollMode() {
  document.documentElement.classList.toggle('scroll-ready', desktopMotion.matches);
  scheduleScroll();
}
addEventListener('scroll', scheduleScroll, { passive: true });
addEventListener('resize', scheduleScroll, { passive: true });
desktopMotion.addEventListener('change', updateScrollMode);
document.fonts?.ready.then(scheduleScroll);
updateScrollMode();
