// Robust component loader + mobile nav + gradient sync
document.addEventListener('DOMContentLoaded', () => {
  const isFileProtocol = window.location.protocol === 'file:';
  
  // Configuration
  const CONFIG = {
    githubUsername: 'ard0niz'
  };

  const insertContent = (el, html) => {
    if (!el) return;
    if (el.dataset.loaded === 'true') return;
    el.innerHTML = html;
    el.dataset.loaded = 'true';
    el.setAttribute('aria-hidden', 'false');
    console.log('Inserted content into:', el.id);
  };

  const loadComponent = async (selector, url, templateId) => {
    const el = document.querySelector(selector);
    if (!el) {
      console.warn('Element not found:', selector);
      return;
    }

    if (isFileProtocol) {
      console.log('Using file protocol, loading from template:', templateId);
      const tpl = document.getElementById(templateId);
      if (tpl) {
        insertContent(el, tpl.innerHTML);
        return;
      }
      if (!el.dataset.fallback) {
        el.innerHTML = '<div class="container" style="padding: 24px 0;">Component could not be loaded.</div>';
        el.dataset.fallback = '1';
      }
      return;
    }

    try {
      console.log('Fetching component:', url);
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const html = await res.text();
        insertContent(el, html);
        return;
      }
      throw new Error('Fetch failed: ' + res.status);
    } catch (e) {
      console.error('Component load error:', e);
      const tpl = document.getElementById(templateId);
      if (tpl) {
        insertContent(el, tpl.innerHTML);
        return;
      }
      if (!el.dataset.fallback) {
        el.innerHTML = '<div class="container" style="padding: 24px 0;">Component could not be loaded.</div>';
        el.dataset.fallback = '1';
      }
    }
  };

  const scrollToHash = (hash, smooth = true) => {
    if (!hash) return;
    const id = hash.replace(/^#/, '');
    const el = document.getElementById(id);
    if (!el) return;
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.getBoundingClientRect().height + 12 : 12;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight;
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    history.replaceState(null, '', '#' + id);
  };

  // Load components, then set year and handle initial hash
  Promise.all([
    loadComponent('#site-header', 'src/components/header.html', 'tpl-header'),
    loadComponent('#site-footer', 'src/components/footer.html', 'tpl-footer')
  ]).then(() => {
    console.log('Components loaded');
    const yearEl = document.getElementById('year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
      console.log('Year set to:', yearEl.textContent);
    }

    // Set last updated date
    const lastUpdatedEl = document.getElementById('last-updated-date');
    if (lastUpdatedEl) {
      const now = new Date();
      lastUpdatedEl.textContent = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }

    // Fetch GitHub stats
    fetchGitHubStats();

    if (location.hash) {
      setTimeout(() => scrollToHash(location.hash), 140);
    }
  });

  // Toggle mobile nav
  document.body.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.nav-toggle');
    if (btn) {
      const nav = btn.closest('.nav');
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const list = nav.querySelector('.nav-list');
      if (list) {
        const shown = list.classList.toggle('nav-open');
        list.style.display = shown ? 'flex' : '';
      }
      return;
    }

    // close overlay if clicking outside
    const openList = document.querySelector('.nav-list.nav-open');
    if (openList && !ev.target.closest('.nav')) {
      openList.classList.remove('nav-open');
      openList.style.display = '';
      const toggle = document.querySelector('.nav-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    // handle internal anchor clicks (smooth & header offset)
    const anchor = ev.target.closest('a[href^="#"]');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#')) {
        ev.preventDefault();
        // close mobile nav if open
        const nav = document.querySelector('.nav');
        if (nav) {
          const list = nav.querySelector('.nav-list');
          const toggle = nav.querySelector('.nav-toggle');
          if (list && list.classList.contains('nav-open')) {
            list.classList.remove('nav-open');
            list.style.display = '';
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
          }
        }
        // scroll
        scrollToHash(href, true);
      }
    }
  });

  // Sync gradients
  const syncGradients = () => {
    const nodes = Array.from(document.querySelectorAll('.sync-gradient'));
    if (!nodes.length) return;
    nodes.forEach(n => n.classList.remove('sync-gradient'));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        nodes.forEach(n => n.classList.add('sync-gradient'));
      });
    });
  };

  setTimeout(syncGradients, 80);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncGradients(); });

  // Animated Counter
  function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutQuad = progress => 1 - (1 - progress) * (1 - progress);
      const current = Math.floor(start + (target - start) * easeOutQuad(progress));
      
      element.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = target;
      }
    };
    
    requestAnimationFrame(animate);
  }

  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // Animate stat counters
        if (element.classList.contains('stat-card')) {
          element.classList.add('animated');
          const numberEl = element.querySelector('.stat-number');
          const target = parseInt(numberEl.dataset.count);
          if (numberEl && !numberEl.dataset.animated) {
            numberEl.dataset.animated = 'true';
            animateCounter(numberEl, target);
          }
        }
        
        // Animate skill progress bars
        if (element.classList.contains('skill-card')) {
          element.classList.add('animated');
          const progressBar = element.querySelector('.skill-progress');
          const progress = progressBar.dataset.progress;
          if (progressBar && progress) {
            progressBar.style.width = progress + '%';
          }
        }
        
        // General fade-in animation
        element.classList.add('animate-on-scroll', 'animated');
        
        observer.unobserve(element);
      }
    });
  }, observerOptions);

  // Observe all animatable elements
  setTimeout(() => {
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    document.querySelectorAll('.section').forEach(el => observer.observe(el));
  }, 100);

  // Parallax effect for section titles
  let ticking = false;
  let sectionTitles = [];
  
  // Cache section titles
  setTimeout(() => {
    sectionTitles = Array.from(document.querySelectorAll('.section-title'));
  }, 100);
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        sectionTitles.forEach(title => {
          const rect = title.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            const offset = (rect.top - window.innerHeight / 2) * 0.1;
            title.style.transform = `translateY(${offset}px)`;
          }
        });
        ticking = false;
      });
      ticking = true;
    }
  });

  // Fetch GitHub stats
  async function fetchGitHubStats() {
    try {
      const response = await fetch(`https://api.github.com/users/${CONFIG.githubUsername}`);
      if (response.ok) {
        const data = await response.json();
        
        const reposEl = document.getElementById('github-repos');
        const followersEl = document.getElementById('github-followers');
        
        if (reposEl) {
          animateCounter(reposEl, data.public_repos || 0, 1500);
        }
        if (followersEl) {
          animateCounter(followersEl, data.followers || 0, 1500);
        }
      }
    } catch (error) {
      console.log('Could not fetch GitHub stats:', error);
      const reposEl = document.getElementById('github-repos');
      const followersEl = document.getElementById('github-followers');
      if (reposEl) reposEl.textContent = 'N/A';
      if (followersEl) followersEl.textContent = 'N/A';
    }
  }

  // Contact Form Handler
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
      };

      // Status message
      formStatus.style.display = 'block';
      formStatus.style.background = 'rgba(0, 217, 255, 0.1)';
      formStatus.style.borderColor = 'rgba(0, 217, 255, 0.2)';
      formStatus.style.color = 'var(--text-primary)';
      formStatus.textContent = 'Sending...';

      try {
        // Send to Formspree
        const response = await fetch('https://formspree.io/f/xvzzpngz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          formStatus.style.background = 'rgba(34, 197, 94, 0.1)';
          formStatus.style.borderColor = 'rgba(34, 197, 94, 0.2)';
          formStatus.style.color = '#22c55e';
          formStatus.textContent = '✓ Message sent successfully!';
          contactForm.reset();
          setTimeout(() => { formStatus.style.display = 'none'; }, 5000);
        } else {
          throw new Error('Failed to send');
        }
      } catch (error) {
        console.error('Form error:', error);
        formStatus.style.background = 'rgba(239, 68, 68, 0.1)';
        formStatus.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        formStatus.style.color = '#ef4444';
        formStatus.textContent = '✗ Error sending message. Please try again.';
      }
    });
  }
});