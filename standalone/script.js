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

const stage = document.querySelector('.engineering-stage');
const stories = [...document.querySelectorAll('.engineering-story')];
const frames = [...document.querySelectorAll('.stage-frame')];
const desktop = window.matchMedia('(min-width: 1000px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.hero');
const engineering = document.querySelector('.engineering-layout');

if ('IntersectionObserver' in window) {
  const stageEnabled = stage && engineering && stories.length && frames.length === stories.length;
  if (stageEnabled) document.documentElement.classList.add('stage-ready');
  if (hero) document.documentElement.classList.add('motion-ready');
  let scheduled = false;
  const visible = new Set();
  let activeIndex = -1;

  const updateScroll = () => {
    scheduled = false;
    if (hero && (visible.has(hero) || reducedMotion.matches)) {
      const bounds = hero.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -bounds.top / bounds.height));
      hero.style.setProperty('--hero-pan', reducedMotion.matches ? '0px' : `${-progress * 10}px`);
      hero.style.setProperty('--hero-scale', reducedMotion.matches ? '1' : String(1.025 + progress * 0.025));
    }
    if (!stageEnabled || !desktop.matches || (!visible.has(engineering) && activeIndex !== -1)) return;

    const readingLine = window.innerHeight * 0.48;
    const bounds = stories.map(story => story.getBoundingClientRect());
    let index = 0;
    for (let i = 0; i < stories.length; i += 1) {
      if (bounds[i].top <= readingLine) index = i;
    }
    if (index !== activeIndex) {
      frames.forEach((frame, i) => {
        frame.classList.toggle('is-active', i === index);
        frame.setAttribute('aria-hidden', String(i !== index));
      });
      stories.forEach((story, i) => story.classList.toggle('is-current', i === index));
      stage.querySelector('.stage-count').textContent = `${String(index + 1).padStart(2, '0')} / 03`;
      activeIndex = index;
    }

    // Follow reading position, including progress within each story.
    const progress = Math.max(0, Math.min(1, (readingLine - bounds[index].top) / bounds[index].height));
    stage.style.setProperty('--stage-progress', String((index + progress) / stories.length));
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
  if (stageEnabled) observer.observe(engineering);
  window.addEventListener('scroll', () => {
    if (visible.size) schedule();
  }, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  desktop.addEventListener('change', schedule);
  reducedMotion.addEventListener('change', schedule);
  schedule();
}
