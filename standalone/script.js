const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const mobile = window.matchMedia('(max-width: 760px)');

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

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.hero');
const stories = [...document.querySelectorAll('.engineering-story')];
const desktop = window.matchMedia('(min-width: 1000px)');

if (hero && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-ready');
  for (const story of stories) {
    const panel = document.createElement('div');
    panel.className = 'story-panel';
    panel.append(...story.childNodes);
    story.append(panel);
  }
  document.documentElement.classList.add('scroll-ready');
  let scheduled = false;
  const visible = new Set();

  const updateScroll = () => {
    scheduled = false;
    if (hero && (visible.has(hero) || reducedMotion.matches)) {
      const bounds = hero.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -bounds.top / bounds.height));
      hero.style.setProperty('--hero-pan', reducedMotion.matches ? '0px' : `${-progress * 10}px`);
      hero.style.setProperty('--hero-scale', reducedMotion.matches ? '1' : String(1.025 + progress * 0.025));
    }
    for (const story of stories) {
      if (!visible.has(story)) continue;
      const bounds = story.getBoundingClientRect();
      const panel = story.querySelector('.story-panel');
      const pinTop = Math.max(48, (window.innerHeight - panel.offsetHeight) / 2);
      story.style.setProperty('--panel-top', `${pinTop}px`);
      const travel = Math.max(1, bounds.height - panel.offsetHeight - 96);
      const progress = Math.max(0, Math.min(1, (pinTop - bounds.top) / travel));
      story.style.setProperty('--reading-progress', String(progress));
    }
  };

  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateScroll);
    }
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    schedule();
  }, { rootMargin: '80px' });
  if (hero) observer.observe(hero);
  stories.forEach(story => observer.observe(story));
  window.addEventListener('scroll', () => {
    if (visible.size) schedule();
  }, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  desktop.addEventListener('change', schedule);
  reducedMotion.addEventListener('change', schedule);
  schedule();
}
