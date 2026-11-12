const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const mobile = matchMedia('(max-width: 760px)');
const desktop = matchMedia('(min-width: 1000px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

if (menuButton && navigation) {
  document.documentElement.classList.add('menu-ready');
  menuButton.hidden = false;
  const closeMenu = () => {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.querySelector('span').textContent = '+';
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('span').textContent = open ? '-' : '+';
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a') && mobile.matches) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  mobile.addEventListener('change', closeMenu);
}

const hero = document.querySelector('.hero');
const stories = [...document.querySelectorAll('.engineering-story')];
const clamp = value => Math.max(0, Math.min(1, value));

const stage = document.querySelector('.engineering-stage');
const frames = [...document.querySelectorAll('.stage-frame')];
let activeIndex = -1;
document.documentElement.classList.add('scroll-ready', 'motion-ready');

let pending = false;
function renderScroll() {
  pending = false;
  if (hero) {
    const bounds = hero.getBoundingClientRect();
    const progress = clamp(-bounds.top / bounds.height);
    hero.style.setProperty('--hero-pan', reducedMotion.matches ? '0px' : `${-progress * 32}px`);
    hero.style.setProperty('--hero-scale', reducedMotion.matches ? '1' : `${1.04 + progress * .06}`);
  }
  if (stage && desktop.matches) {
    const stageBounds = stage.getBoundingClientRect();
    const readingLine = stageBounds.top + stageBounds.height / 2;
    let closest = Infinity;
    let index = 0;
    stories.forEach((story, i) => {
      const copy = story.querySelector('.story-copy').getBoundingClientRect();
      const distance = Math.abs(copy.top + copy.height / 2 - readingLine);
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
  if (pending) return;
  pending = true;
  requestAnimationFrame(renderScroll);
}
addEventListener('scroll', scheduleScroll, { passive: true });
addEventListener('resize', scheduleScroll, { passive: true });
reducedMotion.addEventListener('change', scheduleScroll);
desktop.addEventListener('change', scheduleScroll);
document.fonts?.ready.then(scheduleScroll);
scheduleScroll();
