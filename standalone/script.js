const desktopMotion = matchMedia('(min-width: 1000px) and (prefers-reduced-motion: no-preference)');
const mobileMotion = matchMedia('(max-width: 760px) and (min-height: 540px) and (prefers-reduced-motion: no-preference)');

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
  if (!desktopMotion.matches && !mobileMotion.matches) return;
  if (hero && desktopMotion.matches) {
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
    let index = 0;
    if (mobileMotion.matches) {
      // Swap just before the next heading enters the reading area below the image.
      const readingLine = stageBounds.bottom + 36;
      stories.forEach((story, i) => {
        if (story.querySelector('h3').getBoundingClientRect().top <= readingLine) index = i;
      });
    } else {
      const readingLine = stageBounds.top + stageBounds.height / 2;
      let closest = Infinity;
      stories.forEach((story, i) => {
        const bounds = story.getBoundingClientRect();
        const distance = Math.abs(bounds.top + bounds.height / 2 - readingLine);
        if (distance < closest) { closest = distance; index = i; }
      });
    }
    if (index !== activeIndex) {
      frames.forEach((frame, i) => frame.classList.toggle('is-active', i === index));
      stories.forEach((story, i) => story.classList.toggle('is-current', i === index));
      stage.dataset.active = stories[index].dataset.system;
      activeIndex = index;
    }
  }
}
function scheduleScroll() {
  if (pending || (!desktopMotion.matches && !mobileMotion.matches)) return;
  pending = true;
  requestAnimationFrame(renderScroll);
}
function updateScrollMode() {
  document.documentElement.classList.toggle('scroll-ready', desktopMotion.matches || mobileMotion.matches);
  scheduleScroll();
}
addEventListener('scroll', scheduleScroll, { passive: true });
addEventListener('resize', scheduleScroll, { passive: true });
desktopMotion.addEventListener('change', updateScrollMode);
mobileMotion.addEventListener('change', updateScrollMode);
document.fonts?.ready.then(scheduleScroll);
updateScrollMode();
