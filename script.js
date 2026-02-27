/**
 * RapidFlow Plumbing & Drain — script.js
 * Final pre-launch audit pass
 * Fixes: form button icon restore, stagger delay reset, slider a11y
 */

'use strict';

/* ─── HELPERS ─────────────────────────────── */
const qs  = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => Array.from(c.querySelectorAll(s));
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── STICKY HEADER ──────────────────────── */
function initHeader() {
  const header = qs('#header');
  if (!header) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    });
  }, { passive: true });
}

/* ─── MOBILE NAV ─────────────────────────── */
function initMobileNav() {
  const toggle = qs('#navToggle');
  const nav    = qs('#nav');
  if (!toggle || !nav) return;

  if (!qs('.nav__mobile-cta', nav)) {
    const a = document.createElement('a');
    a.href      = 'tel:5558732211';
    a.className = 'nav__mobile-cta';
    a.setAttribute('aria-label', 'Call RapidFlow Plumbing at (555) 873-2211');
    a.textContent = '📞  Call (555) 873-2211 — Available 24/7';
    nav.appendChild(a);
  }

  const openNav = () => {
    nav.classList.add('is-open');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
    document.body.style.overflow = 'hidden';
  };

  const closeNav = () => {
    nav.classList.remove('is-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () =>
    nav.classList.contains('is-open') ? closeNav() : openNav()
  );

  qsa('a', nav).forEach(link => link.addEventListener('click', closeNav));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) closeNav();
  });

  document.addEventListener('click', e => {
    if (
      nav.classList.contains('is-open') &&
      !nav.contains(e.target) &&
      !toggle.contains(e.target)
    ) closeNav();
  });
}

/* ─── SCROLL REVEAL ──────────────────────── */
function initReveal() {
  if (prefersReducedMotion()) {
    qsa('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const els = qsa('.reveal');
  if (!els.length) return;

  const STAGGER_PARENTS = [
    '.services__grid',
    '.why__grid',
    '.trust-strip__inner',
    '.footer__grid',
  ].join(', ');

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const parent = el.closest(STAGGER_PARENTS);

      if (parent) {
        const siblings = qsa('.reveal', parent);
        const idx      = siblings.indexOf(el);
        const delay    = idx > 0 ? Math.min(idx * 65, 280) : 0;
        el.style.transitionDelay = `${delay}ms`;
      }

      el.classList.add('is-visible');

      // Fixed: clear stagger delay after animation completes so it
      // doesn't linger and affect any future state changes
      el.addEventListener('transitionend', () => {
        el.style.transitionDelay = '';
      }, { once: true });

      io.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
}

/* ─── ACTIVE NAV ─────────────────────────── */
function initActiveNav() {
  const sections = qsa('section[id]');
  const links    = qsa('.nav__link');
  if (!sections.length || !links.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(l => l.classList.remove('is-active'));
      const match = links.find(
        l => l.getAttribute('href') === `#${entry.target.id}`
      );
      if (match) match.classList.add('is-active');
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach(s => io.observe(s));
}

/* ─── SMOOTH SCROLL ──────────────────────── */
function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const hash = a.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ─── TESTIMONIAL SLIDER ─────────────────── */
function initSlider() {
  const track    = qs('#sliderTrack');
  const prevBtn  = qs('#sliderPrev');
  const nextBtn  = qs('#sliderNext');
  const dotsWrap = qs('#sliderDots');
  if (!track || !prevBtn || !nextBtn || !dotsWrap) return;

  const slides = qsa('.slider__slide', track);
  const total  = slides.length;
  if (total < 2) return;

  let current   = 0;
  let autoTimer = null;

  // Build dot indicators
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = `slider__dot${i === 0 ? ' is-active' : ''}`;
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `View review ${i + 1} of ${total}`);
    dot.setAttribute('aria-selected', String(i === 0));
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = qsa('.slider__dot', dotsWrap);

  function goTo(idx) {
    current = ((idx % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;

    slides.forEach((s, i) => {
      s.setAttribute('aria-hidden', String(i !== current));
    });
    dots.forEach((d, i) => {
      const active = i === current;
      d.classList.toggle('is-active', active);
      d.setAttribute('aria-selected', String(active));
    });

    resetAuto();
  }

  function resetAuto() {
    if (prefersReducedMotion()) return;
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5500);
  }

  // Hide non-active slides from assistive technology on load
  slides.forEach((s, i) => {
    if (i !== 0) s.setAttribute('aria-hidden', 'true');
  });

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // Keyboard navigation
  qs('#testimonialSlider').addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
  });

  // Touch swipe
  let swipeStartX = 0;
  track.addEventListener('touchstart', e => {
    swipeStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = swipeStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 44) goTo(dx > 0 ? current + 1 : current - 1);
  }, { passive: true });

  // Pause autoplay on hover / focus
  const sliderEl = qs('#testimonialSlider');
  sliderEl.addEventListener('mouseenter', () => clearInterval(autoTimer));
  sliderEl.addEventListener('focusin',    () => clearInterval(autoTimer));
  sliderEl.addEventListener('mouseleave', resetAuto);
  sliderEl.addEventListener('focusout', e => {
    if (!sliderEl.contains(e.relatedTarget)) resetAuto();
  });

  resetAuto();
}

/* ─── FAQ ACCORDION ──────────────────────── */
function initFAQ() {
  const items = qsa('.faq__item');
  if (!items.length) return;

  items.forEach(item => {
    const btn    = qs('.faq__question', item);
    const answer = qs('.faq__answer', item);
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('faq__item--open');

      // Close all others
      items.forEach(other => {
        if (other === item) return;
        other.classList.remove('faq__item--open');
        const otherBtn = qs('.faq__question', other);
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      item.classList.toggle('faq__item--open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

/* ─── CONTACT FORM ───────────────────────── */
function initContactForm() {
  const form      = qs('#contactForm');
  const successEl = qs('#formSuccess');
  if (!form || !successEl) return;

  const required = qsa('[required]', form);
  const submitBtn = qs('[type="submit"]', form);

  // Fixed: snapshot the button's child nodes on load so we can
  // restore them exactly (SVG icon + text) without using innerHTML
  const btnChildNodes = Array.from(submitBtn.childNodes).map(n => n.cloneNode(true));

  required.forEach(field => {
    field.addEventListener('blur',  () => validateField(field));
    field.addEventListener('input', () => clearError(field));
  });

  function clearError(field) {
    field.classList.remove('is-error');
    field.removeAttribute('aria-invalid');
  }

  function validateField(field) {
    const empty = !field.value.trim();
    if (empty) {
      field.classList.add('is-error');
      field.setAttribute('aria-invalid', 'true');
      return false;
    }
    clearError(field);
    return true;
  }

  function setSubmitting(on) {
    submitBtn.disabled = on;
    if (on) {
      submitBtn.textContent = 'Sending…';
    } else {
      // Fixed: restore original children (text + SVG icon) from snapshot
      submitBtn.replaceChildren(...btnChildNodes.map(n => n.cloneNode(true)));
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    let valid = true;
    required.forEach(field => { if (!validateField(field)) valid = false; });

    if (!valid) {
      const first = required.find(f => f.classList.contains('is-error'));
      if (first) first.focus();
      return;
    }

    setSubmitting(true);

    // Simulate network request — replace with real fetch() in production
    setTimeout(() => {
      form.reset();
      required.forEach(f => clearError(f));
      setSubmitting(false);

      successEl.setAttribute('aria-hidden', 'false');
      successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      setTimeout(() => successEl.setAttribute('aria-hidden', 'true'), 7000);
    }, 1200);
  });
}

/* ─── FOOTER YEAR ────────────────────────── */
function initFooterYear() {
  const el = qs('#footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* ─── INIT ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initReveal();
  initActiveNav();
  initSmoothScroll();
  initSlider();
  initFAQ();
  initContactForm();
  initFooterYear();
});
