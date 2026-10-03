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

// Each chapter owns its photo and text; native scrolling moves both together.
for (const story of stories) {
  const panel = document.createElement('div');
  panel.className = 'story-panel';
  panel.append(...story.childNodes);
  story.append(panel);
}
document.documentElement.classList.add('scroll-ready', 'motion-ready');

let pending = false;
function renderScroll() {
  pending = false;
  const height = innerHeight;
  if (hero) {
    const bounds = hero.getBoundingClientRect();
    const progress = clamp(-bounds.top / bounds.height);
    hero.style.setProperty('--hero-pan', reducedMotion.matches ? '0px' : `${-progress * 32}px`);
    hero.style.setProperty('--hero-scale', reducedMotion.matches ? '1' : `${1.04 + progress * .06}`);
  }
  for (const story of stories) {
    const bounds = story.getBoundingClientRect();
    const panel = story.querySelector('.story-panel');
    const pinTop = Math.max(40, (height - panel.offsetHeight) / 2);
    const travel = Math.max(1, bounds.height - panel.offsetHeight - 96);
    const progress = clamp((pinTop - bounds.top) / travel);
    const entrance = clamp((height - bounds.top) / (height * .65));
    story.style.setProperty('--panel-top', `${pinTop}px`);
    story.style.setProperty('--reading-progress', `${progress}`);
    story.style.setProperty('--photo-inset', reducedMotion.matches ? '0%' : `${(1 - entrance) * 8}%`);
    story.style.setProperty('--photo-pan', reducedMotion.matches || !desktop.matches ? '0px' : `${(progress - .5) * -24}px`);
    story.style.setProperty('--copy-rise', reducedMotion.matches ? '0px' : `${(1 - entrance) * 24}px`);
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
