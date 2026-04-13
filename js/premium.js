/**
 * LOWESS-WESSIN — Premium JS Layer
 * GSAP ScrollTrigger | Preloader | Custom Cursor | Back-to-Top | WhatsApp | Counter
 * Additive: does NOT break existing jQuery / Bootstrap / custom.js logic
 */

(function () {
  'use strict';

  /* ============================================================
     1. PRELOADER
     ============================================================ */
  function initPreloader() {
    var preEl = document.getElementById('lw-preloader');
    if (!preEl) return;

    var barEl = preEl.querySelector('.lw-pre-bar');
    var pctEl = preEl.querySelector('.lw-pre-pct');
    var pct = 0;
    var target = 0;
    var interval;

    function setTarget(val) {
      target = Math.min(val, 100);
    }

    function tick() {
      if (pct < target) {
        pct = Math.min(pct + 1, target);
        if (barEl) barEl.style.width = pct + '%';
        if (pctEl) pctEl.textContent = pct + '%';
      }
    }

    interval = setInterval(tick, 18);

    // Advance quickly to 40, then slow down
    var t1 = setTimeout(function () { setTarget(42); }, 50);
    var t2 = setTimeout(function () { setTarget(70); }, 400);

    window.addEventListener('load', function () {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);

      // Jump to 100%
      pct = 100;
      target = 100;
      if (barEl) barEl.style.width = '100%';
      if (pctEl) pctEl.textContent = '100%';

      setTimeout(function () {
        preEl.classList.add('lw-hidden');
        document.body.style.overflow = '';
        // Trigger hero entrance after preloader
        var heroEntrance = document.querySelector('.detail-box');
        if (heroEntrance && typeof gsap !== 'undefined') {
          gsap.from(heroEntrance, {
            y: 40, opacity: 0, duration: 1, ease: 'power3.out', clearProps: 'all'
          });
        }
      }, 500);
    });

    // Lock scroll during preload
    document.body.style.overflow = 'hidden';
  }

  /* ============================================================
     2. CUSTOM CURSOR
     ============================================================ */
  function initCursor() {
    // Skip on touch
    if (!window.matchMedia('(hover: hover)').matches) return;

    var dot  = document.getElementById('lw-cursor-dot');
    var ring = document.getElementById('lw-cursor-ring');
    if (!dot || !ring) return;

    var mx = 0, my = 0; // actual mouse
    var rx = 0, ry = 0; // ring lerp
    var raf;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      // Dot: instant
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    }, { passive: true });

    function lerp(a, b, t) { return a + (b - a) * t; }

    function loop() {
      rx = lerp(rx, mx, 0.14);
      ry = lerp(ry, my, 0.14);
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      raf = requestAnimationFrame(loop);
    }
    loop();

    // Event delegation — no listener accumulation
    document.addEventListener('mouseover', function (e) {
      var el = e.target.closest('a, button, [role="button"], .box, .price_box, .property-card, .featured-property-card, .client_container img');
      if (el) {
        ring.classList.add('lw-hover');
        dot.classList.add('lw-hover');
      }
    });
    document.addEventListener('mouseout', function (e) {
      var el = e.target.closest('a, button, [role="button"], .box, .price_box, .property-card, .featured-property-card, .client_container img');
      if (el) {
        ring.classList.remove('lw-hover');
        dot.classList.remove('lw-hover');
      }
    });

    document.addEventListener('mouseleave', function () {
      cancelAnimationFrame(raf);
    });
    document.addEventListener('mouseenter', function () {
      raf = requestAnimationFrame(loop);
    });
  }

  /* ============================================================
     3. BACK-TO-TOP BUTTON WITH SCROLL PROGRESS
     ============================================================ */
  function initBackToTop() {
    var btn    = document.getElementById('lw-back-top');
    if (!btn) return;

    var circle = btn.querySelector('.progress-ring circle');
    var CIRCUMFERENCE = 138.23; // 2π × 22

    function update() {
      var scrollTop  = window.scrollY || document.documentElement.scrollTop;
      var docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      var progress   = docHeight > 0 ? scrollTop / docHeight : 0;
      var offset     = CIRCUMFERENCE - progress * CIRCUMFERENCE;

      if (circle) circle.style.strokeDashoffset = offset;

      if (scrollTop > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          update();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     4. HEADER SHRINK ON SCROLL
     ============================================================ */
  function initHeaderShrink() {
    var header = document.querySelector('.header_section');
    if (!header) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (window.scrollY > 60) {
            header.classList.add('lw-scrolled');
          } else {
            header.classList.remove('lw-scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ============================================================
     5. GSAP SCROLL ANIMATIONS
     ============================================================ */
  function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // Load GSAP + ScrollTrigger from CDN if not already present
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', function () {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', function () {
          gsap.registerPlugin(ScrollTrigger);
          runAnimations();
        });
      });
    } else {
      gsap.registerPlugin(ScrollTrigger);
      runAnimations();
    }
  }

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  function runAnimations() {
    var defaults = { ease: 'power3.out', duration: 0.85 };

    /* ---- Generic reveal ---- */
    gsap.utils.toArray('.gsap-reveal').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: defaults.duration, ease: defaults.ease,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      });
    });

    /* ---- Slide from left ---- */
    gsap.utils.toArray('.gsap-reveal-left').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, x: 0, duration: defaults.duration, ease: defaults.ease,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* ---- Slide from right ---- */
    gsap.utils.toArray('.gsap-reveal-right').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, x: 0, duration: defaults.duration, ease: defaults.ease,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* ---- Stagger children ---- */
    gsap.utils.toArray('.gsap-stagger').forEach(function (parent) {
      var children = parent.children;
      gsap.to(children, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: { trigger: parent, start: 'top 85%', once: true }
      });
    });

    /* ---- Section-specific ---- */

    // About: image left, text right
    animateSplit('.about_section .img-box', '.about_section .detail-box');

    // Deal section: image + text sides
    animateSplit('.deal_section .detail-box', '.deal_section .img-box');

    // Motivational section — fade in from below
    triggerReveal('.motivational_section .motivational_box', { y: 30, duration: 1 });

    // Sale boxes stagger
    triggerStagger('.sale_container', '.sale_container .box', 0.18);

    // Stats boxes
    triggerStagger('.us_section .box', '.us_section .box', 0.15);

    // Price cards stagger
    triggerStagger('.price_section', '.price_box', 0.2);

    // Featured properties
    triggerStagger('#featuredPropertiesContainer', '.featured-property-card, .property-card', 0.12);

    // Client logos
    triggerStagger('.client_section .client_container', '.client_container a', 0.08);

    // Desarrollo section
    triggerReveal('#desarrollo-inmobiliario .detail-box', { y: 40, duration: 1 });
    triggerReveal('#desarrollo-inmobiliario .img-box, #desarrollo-inmobiliario .coming-soon-img', { y: 40, duration: 1, delay: 0.15 });

    // Heading border animation
    gsap.utils.toArray('.heading_container').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: function () { el.classList.add('lw-animated'); }
      });
    });

    // Footer columns stagger
    var footerCols = document.querySelectorAll('.info_section .col-md-3');
    if (footerCols.length) {
      gsap.to(footerCols, {
        opacity: 1, y: 0,
        duration: 0.7, ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.info_section',
          start: 'top 92%',
          once: true
        }
      });
    }

    // Property detail page sections
    triggerStagger('.property-info', '.property-info > *', 0.1);
    triggerStagger('.similar-properties', '.similar-property-card, .property-card', 0.15);
  }

  function animateSplit(leftSel, rightSel) {
    var leftEl  = document.querySelector(leftSel);
    var rightEl = document.querySelector(rightSel);
    if (!leftEl || !rightEl) return;

    var parent = leftEl.closest('section') || leftEl.parentElement;

    gsap.fromTo(leftEl,
      { opacity: 0, x: -50 },
      { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: parent, start: 'top 85%', once: true } });

    gsap.fromTo(rightEl,
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', delay: 0.1,
        scrollTrigger: { trigger: parent, start: 'top 85%', once: true } });
  }

  function triggerReveal(sel, opts) {
    var el = document.querySelector(sel);
    if (!el) return;
    var params = Object.assign({ opacity: 1, y: 0, ease: 'power3.out', duration: 0.85 }, opts);
    var fromParams = { opacity: 0, y: opts.y || 40 };
    delete params.y;
    gsap.fromTo(el, fromParams, Object.assign(params, {
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    }));
  }

  function triggerStagger(parentSel, childSel, stagger) {
    var parent = typeof parentSel === 'string' ? document.querySelector(parentSel) : parentSel;
    if (!parent) return;
    var children = document.querySelectorAll(childSel);
    if (!children.length) return;

    gsap.fromTo(children,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: stagger,
        scrollTrigger: { trigger: parent, start: 'top 85%', once: true } });
  }

  /* ============================================================
     6. SCROLL COUNTER
     ============================================================ */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    function countUp(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      var start = 0;
      var duration = 1800;
      var startTime = null;
      var originalText = el.textContent;
      var suffix = originalText.replace(/[0-9]/g, '');

      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        var current = Math.round(start + ease * (target - start));
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // Trigger when element enters view (IntersectionObserver — no GSAP needed)
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     7. LIGHTBOX (property images)
     ============================================================ */
  function initLightbox() {
    var lb    = document.getElementById('lw-lightbox');
    var lbImg = lb ? lb.querySelector('img') : null;
    var lbClose = document.getElementById('lw-lightbox-close');
    if (!lb || !lbImg) return;

    document.addEventListener('click', function (e) {
      var img = e.target.closest('.property-gallery img, .property-images img, .gallery-img');
      if (img) {
        lbImg.src = img.src;
        lb.classList.add('active');
      }
    });

    function closeLb() { lb.classList.remove('active'); lbImg.src = ''; }
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    if (lbClose) lbClose.addEventListener('click', closeLb);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  }

  /* ============================================================
     8. INJECT DOM ELEMENTS
     ============================================================ */
  function injectDOM() {
    // Skip if already injected (e.g., partial render)
    if (document.getElementById('lw-preloader')) return;

    var frag = document.createDocumentFragment();

    // Preloader
    var pre = document.createElement('div');
    pre.id = 'lw-preloader';
    pre.innerHTML =
      '<div class="lw-pre-brand">LOWEST-<span>WESSIN</span></div>' +
      '<div class="lw-pre-bar-wrap"><div class="lw-pre-bar"></div></div>' +
      '<div class="lw-pre-pct">0%</div>';
    frag.appendChild(pre);

    // Cursor
    var dot = document.createElement('div');
    dot.id = 'lw-cursor-dot';
    dot.className = 'lw-cursor-dot';
    frag.appendChild(dot);

    var ring = document.createElement('div');
    ring.id = 'lw-cursor-ring';
    ring.className = 'lw-cursor-ring';
    frag.appendChild(ring);

    // Back-to-top
    var btt = document.createElement('button');
    btt.id = 'lw-back-top';
    btt.setAttribute('aria-label', 'Volver arriba');
    btt.innerHTML =
      '<svg class="progress-ring" viewBox="0 0 48 48">' +
        '<circle cx="24" cy="24" r="22"/>' +
      '</svg>' +
      '<span class="arrow-icon">↑</span>';
    frag.appendChild(btt);

    // WhatsApp button
    var wa = document.createElement('a');
    wa.id = 'lw-whatsapp';
    wa.href = 'https://wa.me/18098641996?text=Hola%2C%20estoy%20interesado%20en%20conocer%20m%C3%A1s%20sobre%20sus%20propiedades.';
    wa.target = '_blank';
    wa.rel = 'noopener noreferrer';
    wa.setAttribute('aria-label', 'Contáctanos por WhatsApp');
    wa.innerHTML =
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
        '<path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.55 4.11 1.516 5.849L0 24l6.335-1.485A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.85 0-3.585-.5-5.083-1.373l-.364-.217-3.762.882.899-3.671-.236-.375A9.96 9.96 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>' +
      '</svg>';
    frag.appendChild(wa);

    // Lightbox
    var lb = document.createElement('div');
    lb.id = 'lw-lightbox';
    lb.innerHTML = '<button id="lw-lightbox-close" aria-label="Cerrar">×</button><img src="" alt="Vista ampliada">';
    frag.appendChild(lb);

    document.body.appendChild(frag);
  }

  /* ============================================================
     9. INIT
     ============================================================ */
  function init() {
    injectDOM();
    initPreloader();
    initCursor();
    initBackToTop();
    initHeaderShrink();
    initCounters();
    initLightbox();

    // GSAP deferred slightly so DOM is fully parsed
    setTimeout(initGSAP, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
