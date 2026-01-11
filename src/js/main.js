// Robust component loader + mobile nav + gradient sync
document.addEventListener('DOMContentLoaded', () => {
  const isFileProtocol = window.location.protocol === 'file:';

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
});