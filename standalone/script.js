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

if (stage && stories.length && frames.length === stories.length && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('stage-ready');
  let scheduled = false;
  let inView = false;
  let activeIndex = -1;

  const updateStage = () => {
    scheduled = false;
    if (!desktop.matches) return;

    const readingLine = window.innerHeight * 0.48;
    let index = 0;
    for (let i = 0; i < stories.length; i += 1) {
      if (stories[i].getBoundingClientRect().top <= readingLine) index = i;
    }
    if (index !== activeIndex) {
      frames.forEach((frame, i) => {
        frame.classList.toggle('is-active', i === index);
        frame.setAttribute('aria-hidden', String(i !== index));
      });
      stage.querySelector('.stage-count').textContent = `${String(index + 1).padStart(2, '0')} / 03`;
      stage.style.setProperty('--stage-position', `${index * 100}%`);
      activeIndex = index;
    }

    // A few pixels of movement within the crop; no scroll interception.
    const bounds = stories[index].getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (readingLine - bounds.top) / bounds.height));
    stage.style.setProperty('--image-offset', reducedMotion.matches ? '0px' : `${(progress - 0.5) * 10}px`);
  };

  const schedule = () => {
    if (!scheduled && desktop.matches) {
      scheduled = true;
      requestAnimationFrame(updateStage);
    }
  };
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) schedule();
  }, { rootMargin: '100px' });
  observer.observe(document.querySelector('.engineering-layout'));
  window.addEventListener('scroll', () => {
    if (inView) schedule();
  }, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  desktop.addEventListener('change', schedule);
  reducedMotion.addEventListener('change', schedule);
  schedule();
}
