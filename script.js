(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Footer year ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Theme toggle ----------
  const themeToggle = document.getElementById('themeToggle');
  const themeMeta = document.getElementById('themeMeta');
  const root = document.documentElement;

  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', theme === 'light' ? '#f4efe6' : '#0e0e0e');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
    try { localStorage.setItem('st-theme', theme); } catch (e) {}
  };

  // Initialize aria state from current theme set inline in <head>
  setTheme(root.getAttribute('data-theme') || 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      setTheme(current === 'light' ? 'dark' : 'light');
    });
  }

  // Sync if OS theme changes and user hasn't explicitly chosen
  try {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    mql.addEventListener && mql.addEventListener('change', (e) => {
      if (!localStorage.getItem('st-theme')) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    });
  } catch (e) {}

  // ---------- Loader ----------
  const loader = document.getElementById('loader');
  const hero = document.querySelector('.hero');
  const hideLoader = () => {
    if (!loader) return;
    loader.classList.add('is-hidden');
    if (hero) hero.classList.add('is-loaded');
    setTimeout(() => loader.remove(), 700);
  };
  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 600);
  } else {
    window.addEventListener('load', () => setTimeout(hideLoader, 600));
    setTimeout(hideLoader, 2400); // safety fallback
  }

  // ---------- Sticky nav style on scroll ----------
  const nav = document.getElementById('nav');
  const backToTop = document.getElementById('backToTop');
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 24);
    if (backToTop) backToTop.classList.toggle('is-visible', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---------- Mobile menu toggle ----------
  const toggle = document.getElementById('navToggle');
  const mobile = document.getElementById('navMobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', () => {
      const open = mobile.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobile.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobile.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ---------- Reveal-on-scroll ----------
  const revealEls = document.querySelectorAll('.reveal, .reveal-img');
  if ('IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger by 60ms for sibling reveals in the same batch
          const delay = Math.min(i * 60, 240);
          setTimeout(() => entry.target.classList.add('is-visible'), delay);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // ---------- Count-up stats ----------
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !prefersReduced) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10) || 0;
        const duration = 1600;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * eased).toString();
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(c => countIO.observe(c));
  } else {
    counters.forEach(c => { c.textContent = c.getAttribute('data-count'); });
  }

  // ---------- Process line fill ----------
  const processLine = document.getElementById('processLine');
  if (processLine && 'IntersectionObserver' in window && !prefersReduced) {
    const lineIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          processLine.style.width = '100%';
          lineIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    lineIO.observe(processLine);
  } else if (processLine) {
    processLine.style.width = '100%';
  }

  // ---------- Parallax (rAF + transform, compositor-only) ----------
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !prefersReduced) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      parallaxEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        // only compute when reasonably near viewport
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        // Distance of element center from viewport center
        const centerOffset = (rect.top + rect.height / 2) - vh / 2;
        const translate = -(centerOffset * speed);
        el.style.transform = `translate3d(0, ${translate.toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    const onParallaxScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener('scroll', onParallaxScroll, { passive: true });
    window.addEventListener('resize', onParallaxScroll, { passive: true });
    update();
  }

  // ---------- FAQ: only one open at a time ----------
  const faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach(other => {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  // ---------- Contact form ----------
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();

      if (!name || !email || !message) {
        status.textContent = 'Please complete the required fields.';
        status.style.color = 'var(--terracotta)';
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        status.textContent = 'Please enter a valid email address.';
        status.style.color = 'var(--terracotta)';
        return;
      }

      status.style.color = 'var(--orange)';
      status.textContent = 'Sending…';

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(data))
        });
        const json = await res.json();
        if (json.success) {
          status.style.color = 'var(--orange)';
          status.textContent = `Thanks, ${name.split(' ')[0]}. We'll be in touch within two working days.`;
          form.reset();
        } else {
          status.style.color = 'var(--terracotta)';
          status.textContent = json.message || 'Something went wrong. Please email us at space8timed.c@gmail.com.';
        }
      } catch (err) {
        status.style.color = 'var(--terracotta)';
        status.textContent = 'Network error. Please email us at space8timed.c@gmail.com.';
      }
    });
  }

  // ---------- Newsletter form ----------
  const nlForm = document.getElementById('newsletterForm');
  const nlStatus = document.getElementById('newsletterStatus');
  const nlInput = document.getElementById('newsletterEmail');
  if (nlForm) {
    nlForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (nlInput && nlInput.value || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        nlStatus.textContent = 'Please enter a valid email address.';
        return;
      }
      nlStatus.textContent = 'Subscribing…';
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(nlForm)))
        });
        const json = await res.json();
        if (json.success) {
          nlStatus.textContent = "You're in. Welcome to the studio.";
          nlForm.reset();
        } else {
          nlStatus.textContent = json.message || 'Something went wrong — please try again.';
        }
      } catch (err) {
        nlStatus.textContent = 'Network error — please try again.';
      }
    });
  }
})();
