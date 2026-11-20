const desktopMotion = matchMedia('(min-width: 1000px) and (prefers-reduced-motion: no-preference)');
const mobileMotion = matchMedia('(max-width: 760px) and (min-height: 540px) and (prefers-reduced-motion: no-preference)');

const hero = document.querySelector('.hero');
const stories = [...document.querySelectorAll('.engineering-story')];
const clamp = value => Math.max(0, Math.min(1, value));

const stage = document.querySelector('.engineering-stage');
const layout = document.querySelector('.engineering-layout');
const storyPanel = document.querySelector('.engineering-stories');
const frames = [...document.querySelectorAll('.stage-frame')];
let activeIndex = -1;
let heroProgress = -1;
let mobileStage = false;
let inlineReading = false;
const headings = stories.map(story => story.querySelector('h3'));
const chapterTarget = () => headings.find(heading => `#${heading.id}` === location.hash);

function updateChapterVisibility() {
  stories.forEach((story, index) => {
    if (mobileStage && index !== activeIndex) story.setAttribute('hidden', 'until-found');
    else story.removeAttribute('hidden');
  });
}

let pending = false;
function renderScroll() {
  pending = false;
  if (!desktopMotion.matches && !mobileStage) return;
  if (hero && desktopMotion.matches) {
    const bounds = hero.getBoundingClientRect();
    const progress = clamp(-bounds.top / bounds.height);
    if (progress !== heroProgress) {
      hero.style.setProperty('--hero-pan', `${-progress * 32}px`);
      hero.style.setProperty('--hero-scale', `${1.04 + progress * .06}`);
      heroProgress = progress;
    }
  }
  let index = 0;
  if (mobileStage) {
    const bounds = layout.getBoundingClientRect();
    const chapter = Math.max(1, bounds.height - storyPanel.offsetHeight) / stories.length;
    const position = -bounds.top;
    const buffer = Math.min(12, chapter / 4);
    index = Math.max(0, activeIndex);
    // Tiny reversals at a boundary should not swap the whole panel back and forth.
    while (index < stories.length - 1 && position >= (index + 1) * chapter + buffer) index++;
    while (index > 0 && position < index * chapter - buffer) index--;
  } else {
    const stageBounds = stage.getBoundingClientRect();
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
    storyPanel.dataset.active = stories[index].dataset.system;
    activeIndex = index;
    updateChapterVisibility();
  }
}
function scheduleScroll() {
  if (pending || (!desktopMotion.matches && !mobileStage)) return;
  pending = true;
  requestAnimationFrame(renderScroll);
}
function updateScrollMode() {
  const root = document.documentElement;
  mobileStage = mobileMotion.matches && 'onbeforematch' in root && !inlineReading && !chapterTarget();
  stories.forEach(story => story.removeAttribute('hidden'));
  root.classList.toggle('scroll-ready', desktopMotion.matches || mobileStage);
  // Measure with all three chapters in the grid so even the longest one fits.
  if (mobileStage && storyPanel.offsetHeight > innerHeight) {
    mobileStage = false;
    root.classList.remove('scroll-ready');
  }
  renderScroll();
  updateChapterVisibility();
}
addEventListener('scroll', scheduleScroll, { passive: true });
addEventListener('resize', updateScrollMode, { passive: true });
addEventListener('hashchange', () => {
  const target = chapterTarget();
  updateScrollMode();
  if (target && mobileMotion.matches) {
    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }));
  }
});
storyPanel.addEventListener('beforematch', () => {
  if (!chapterTarget()) inlineReading = true;
  updateScrollMode();
});
new ResizeObserver(() => {
  if (!mobileStage || storyPanel.offsetHeight <= innerHeight) return;
  const current = headings[activeIndex];
  updateScrollMode();
  if (!mobileStage) current?.scrollIntoView({ behavior: 'instant' });
}).observe(storyPanel);
desktopMotion.addEventListener('change', updateScrollMode);
mobileMotion.addEventListener('change', updateScrollMode);
document.fonts?.ready.then(updateScrollMode);
updateScrollMode();
