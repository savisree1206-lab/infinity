/* ============================================
   INFINITE SERVICES – JavaScript
   ============================================ */

(function () {
  'use strict';

  /* ==========================================
     AUTH UI – Modal & Nav State
  ========================================== */
  const signinModal  = document.getElementById('signin-modal');
  const signupModal  = document.getElementById('signup-modal');
  const navAuthArea  = document.getElementById('nav-auth-area');

  /* ---- Modal open/close helpers ---- */
  function openAuthModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeAuthModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ---- Open/close event listeners ---- */
  document.getElementById('nav-signin-btn')?.addEventListener('click', () => openAuthModal(signinModal));
  document.getElementById('nav-signup-btn')?.addEventListener('click', () => openAuthModal(signupModal));
  document.getElementById('signin-modal-close')?.addEventListener('click', () => closeAuthModal(signinModal));
  document.getElementById('signup-modal-close')?.addEventListener('click', () => closeAuthModal(signupModal));
  document.getElementById('switch-to-signup')?.addEventListener('click', () => { closeAuthModal(signinModal); openAuthModal(signupModal); });
  document.getElementById('switch-to-signin')?.addEventListener('click', () => { closeAuthModal(signupModal); openAuthModal(signinModal); });
  signinModal?.addEventListener('click', (e) => { if (e.target === signinModal) closeAuthModal(signinModal); });
  signupModal?.addEventListener('click', (e) => { if (e.target === signupModal) closeAuthModal(signupModal); });
  document.getElementById('hero-shop-btn')?.addEventListener('click', () => {
    window.location.href = 'shop.html';
  });
  document.getElementById('shop-preview-signin-btn')?.addEventListener('click', () => openAuthModal(signinModal));

  /* ==================================================
     SIGN-IN: Role Tabs (User / Admin)
  ================================================== */
  let signinRole = 'user'; // 'user' | 'admin'
  const signinInner = signinModal?.querySelector('.auth-modal-inner');
  const signinAdminHint = document.getElementById('signin-admin-hint');

  document.querySelectorAll('#signin-role-tabs .auth-role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#signin-role-tabs .auth-role-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      signinRole = tab.dataset.role; // 'user' | 'admin'

      if (signinRole === 'admin') {
        signinInner?.classList.add('admin-mode');
        signinAdminHint?.classList.add('visible');
      } else {
        signinInner?.classList.remove('admin-mode');
        signinAdminHint?.classList.remove('visible');
      }
      // Clear errors on role switch
      document.getElementById('signin-error').classList.remove('visible');
      document.getElementById('signin-email-err').textContent = '';
      document.getElementById('signin-pw-err').textContent = '';
    });
  });

  /* ---- SIGN IN SUBMIT ---- */
  document.getElementById('signin-submit-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const errDiv = document.getElementById('signin-error');
    errDiv.classList.remove('visible');
    errDiv.textContent = '';

    const emailErr = document.getElementById('signin-email-err');
    const pwErr = document.getElementById('signin-pw-err');
    emailErr.textContent = ''; pwErr.textContent = '';
    
    let valid = true;
    if (!email) { emailErr.textContent = 'Email is required.'; valid = false; }
    if (!password) { pwErr.textContent = 'Password is required.'; valid = false; }
    if (!valid) return;

    const result = await AuthManager.signIn({ email, password });
    if (!result.ok) {
      errDiv.textContent = result.error;
      errDiv.classList.add('visible');
      return;
    }

    // Role mismatch guard
    const isAdminUser  = result.user.role === 'owner';
    const wantsAdmin   = signinRole === 'admin';
    if (wantsAdmin && !isAdminUser) {
      errDiv.textContent = 'This account is not an Admin account. Please use the User tab.';
      errDiv.classList.add('visible');
      return;
    }
    if (!wantsAdmin && isAdminUser) {
      errDiv.textContent = 'Admin accounts must sign in via the Admin tab.';
      errDiv.classList.add('visible');
      return;
    }

    closeAuthModal(signinModal);
    AuthManager.redirectToDashboard(result.user);
  });

  // Allow Enter key on sign-in
  document.getElementById('signin-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('signin-submit-btn').click();
  });

  /* ==================================================
     SIGN-UP: Role Tabs (User / Admin)
  ================================================== */
  const ADMIN_SECRET = 'ADMIN_INFINITE_2025'; // simple secret key
  let selectedRole = 'customer'; // 'customer' | 'owner'
  const signupInner = signupModal?.querySelector('.auth-modal-inner');
  const adminKeyField = document.getElementById('signup-admin-key-field');

  document.querySelectorAll('#signup-role-tabs .auth-role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#signup-role-tabs .auth-role-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedRole = tab.dataset.role; // 'customer' | 'owner'

      const isAdmin = selectedRole === 'owner';
      if (isAdmin) {
        signupInner?.classList.add('admin-mode');
        adminKeyField && (adminKeyField.style.display = 'block');
      } else {
        signupInner?.classList.remove('admin-mode');
        adminKeyField && (adminKeyField.style.display = 'none');
      }
      // Clear errors
      document.getElementById('signup-error').classList.remove('visible');
    });
  });

  /* ---- SIGN UP SUBMIT ---- */
  document.getElementById('signup-submit-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const adminKey = document.getElementById('signup-admin-key')?.value;
    
    const errDiv = document.getElementById('signup-error');
    errDiv.classList.remove('visible');
    errDiv.textContent = '';

    const nameErr = document.getElementById('signup-name-err');
    const emailErr = document.getElementById('signup-email-err');
    const pwErr = document.getElementById('signup-pw-err');
    const keyErr = document.getElementById('signup-admin-key-err');
    
    nameErr.textContent = ''; emailErr.textContent = ''; pwErr.textContent = '';
    if (keyErr) keyErr.textContent = '';

    let valid = true;
    if (!name) { nameErr.textContent = 'Name is required.'; valid = false; }
    if (!email) { emailErr.textContent = 'Email is required.'; valid = false; }
    if (!password) { pwErr.textContent = 'Password is required.'; valid = false; }
    else if (password.length < 6) { pwErr.textContent = 'Min. 6 chars required.'; valid = false; }
    
    if (selectedRole === 'owner') {
      if (adminKey !== ADMIN_SECRET) {
        if (keyErr) keyErr.textContent = 'Invalid Admin Key.';
        valid = false;
      }
    }

    if (!valid) return;

    const signupResult = await AuthManager.signUp({ name, email, password, role: selectedRole });
    if (!signupResult.ok) {
      errDiv.textContent = signupResult.error;
      errDiv.classList.add('visible');
      return;
    }
    // Auto sign-in after registration
    const signinResult = await AuthManager.signIn({ email, password });
    if (signinResult.ok) {
      closeAuthModal(signupModal);
      AuthManager.redirectToDashboard(signinResult.user);
    }
  });

  /* ---- NAV STATE: If already logged in, show user chip ---- */
  (function updateNavForLoggedInUser() {
    const user = AuthManager.currentUser();
    if (!user || !navAuthArea) return;
    navAuthArea.innerHTML = `
      <div class="nav-user-chip-home">
        <div class="user-avatar ${user.role === 'owner' ? 'owner-avatar' : ''}">${user.name.charAt(0).toUpperCase()}</div>
        <span>${user.name}</span>
      </div>
      <button class="nav-goto-dashboard" id="nav-goto-dash">My Dashboard</button>
      <button class="nav-home-signout" id="nav-home-signout">Sign Out</button>
    `;
    document.getElementById('nav-goto-dash')?.addEventListener('click', () => AuthManager.redirectToDashboard(user));
    document.getElementById('nav-home-signout')?.addEventListener('click', () => AuthManager.signOut());

    // Update service cards on the landing page to link to dashboards
    const services = [
      { id: 'core-electronics', link: 'electronics_dashboard.html' },
      { id: 'core-webdev', link: 'webdev_dashboard.html' },
      { id: 'core-scrap', link: 'scrap_dashboard.html' }
    ];

    services.forEach(svc => {
      const card = document.getElementById(svc.id);
      if (card) {
        card.style.cursor = 'pointer';
        card.onclick = () => window.location.href = svc.link;
        const btn = card.querySelector('.stone-btn');
        if (btn) {
          btn.href = 'javascript:void(0)';
          btn.textContent = 'Go to Dashboard →';
          btn.onclick = (e) => {
            e.stopPropagation();
            window.location.href = svc.link;
          };
        }
      }
    });
  })();



  /* ---- Shop Preview on Home ---- */
  function renderShopPreview() {
    const grid = document.getElementById('home-shop-grid');
    if (!grid) return;
    const products = ShopManager.getProducts().slice(0, 8);
    grid.innerHTML = products.map(p => `
      <div class="shop-preview-card" onclick="document.getElementById('shop-preview-signin-btn').scrollIntoView({behavior:'smooth'})" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
        ${p.imageUrl ? `
          <div class="item-image-wrap" style="height: 60px; width: 60px; border-radius: 8px; overflow: hidden; margin-bottom: 0.6rem; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03);">
            <img src="${p.imageUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';this.parentElement.querySelector('.item-icon').style.display='block';" />
            <div class="item-icon" style="font-size: 2.5rem; display: none; line-height: 1;">${p.icon}</div>
          </div>
        ` : `
          <div class="item-icon" style="font-size: 2.5rem; margin-bottom: 0.6rem;">${p.icon}</div>
        `}
        <div class="item-name">${p.name}</div>
        <div class="item-price">₹${p.price}</div>
      </div>
    `).join('');

    // If logged in, replace CTA
    const user = AuthManager.currentUser();
    const ctaWrap = document.querySelector('.shop-preview-cta');
    if (user && ctaWrap) {
      ctaWrap.innerHTML = `<button class="btn-primary" onclick="AuthManager.redirectToDashboard(AuthManager.currentUser())" style="font-size:0.85rem;padding:0.8rem 2rem;">Go to My Shop →</button>`;
    }
  }

  // Initial call
  renderShopPreview();

  // Storage listener to update in real-time
  window.addEventListener('storage', (e) => {
    if (e.key === 'inf_products') {
      renderShopPreview();
    }
  });



  /* ==========================================
     1. PARTICLE CANVAS
  ========================================== */
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId;

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const COLORS = ['rgba(0,207,255,', 'rgba(180,79,255,', 'rgba(255,140,0,', 'rgba(255,215,0,'];

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: Math.random() * 0.35 + 0.1,
      angle: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.4 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  function initParticles() {
    particles = [];
    const count = Math.min(120, Math.floor((canvas.width * canvas.height) / 9000));
    for (let i = 0; i < count; i++) particles.push(createParticle());
  }
  initParticles();

  let mouse = { x: -9999, y: -9999 };
  document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  let shootingStars = [];
  function createShootingStar() {
    return {
      x: Math.random() * canvas.width * 0.8,
      y: 0,
      len: Math.random() * 80 + 40,
      speed: Math.random() * 4 + 3,
      dx: Math.random() * 2 + 2,
      dy: Math.random() * 2 + 2,
      opacity: 1
    };
  }

  function drawParticles(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background particles
    particles.forEach(p => {
      p.pulse += 0.02;
      const op = p.opacity + Math.sin(p.pulse) * 0.08;
      // repel from mouse
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        p.x += (dx / dist) * 1.2;
        p.y += (dy / dist) * 1.2;
      }
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;
      p.angle += 0.005;
      // wrap
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.max(0, Math.min(1, op)) + ')';
      ctx.fill();
    });

    // Draw shooting stars
    if (Math.random() < 0.0008) {
      shootingStars.push(createShootingStar());
    }
    shootingStars.forEach((star, index) => {
      star.x += star.dx * star.speed;
      star.y += star.dy * star.speed;
      star.opacity -= 0.015;
      if (star.opacity <= 0 || star.x > canvas.width || star.y > canvas.height) {
        shootingStars.splice(index, 1);
        return;
      }
      ctx.beginPath();
      const grad = ctx.createLinearGradient(star.x, star.y, star.x - star.len * (star.dx / 4), star.y - star.len * (star.dy / 4));
      grad.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(star.x - star.len * (star.dx / 4), star.y - star.len * (star.dy / 4));
      ctx.stroke();
    });

    animId = requestAnimationFrame(drawParticles);
  }
  drawParticles();

  /* ==========================================
     2. NAVBAR SCROLL + MOBILE MENU
  ========================================== */
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger-btn');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    // Back-to-top button
    const btn = document.getElementById('back-to-top');
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');

    // Active nav link
    highlightNavLink();
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    navbar.classList.toggle('menu-open');
  });
  // Close menu on link click
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => navbar.classList.remove('menu-open'));
  });

  /* ==========================================
     3. ACTIVE NAV LINK
  ========================================== */
  function highlightNavLink() {
    const sections = ['home', 'services', 'showcase', 'planner', 'contact'];
    const scroll = window.scrollY + 120;
    sections.forEach(id => {
      const el = document.getElementById(id);
      const link = document.getElementById('nav-' + (id === 'contact' ? 'contact-link' : id));
      if (!el || !link) return;
      if (el.offsetTop <= scroll && el.offsetTop + el.offsetHeight > scroll) {
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }

  /* ==========================================
     4. BACK TO TOP
  ========================================== */
  document.getElementById('back-to-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ==========================================
     5. SCROLL REVEAL
  ========================================== */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), idx * 90);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ==========================================
     6. STATS COUNTER ANIMATION
  ========================================== */
  function animateCounter(el, target, duration = 1800) {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(ease * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  }

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-num').forEach(el => {
          animateCounter(el, parseInt(el.dataset.target, 10));
        });
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  const statsEl = document.getElementById('stats');
  if (statsEl) statObserver.observe(statsEl);

  /* ==========================================
     7. CONTACT FORM VALIDATION
  ========================================== */
  const form = document.getElementById('contact-form');

  function validateField(id, errId, msg) {
    const input = document.getElementById(id);
    const err   = document.getElementById(errId);
    const group = input.closest('.form-group');
    const val   = input.value.trim();
    if (!val) {
      err.textContent = msg;
      group.classList.add('error');
      return false;
    }
    err.textContent = '';
    group.classList.remove('error');
    return true;
  }

  function validatePhone() {
    const input = document.getElementById('phone');
    const err   = document.getElementById('err-phone');
    const group = input.closest('.form-group');
    const val   = input.value.trim().replace(/\s/g, '');
    if (!val) {
      err.textContent = 'Phone number is required.';
      group.classList.add('error');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(val) && !/^\+?\d{10,15}$/.test(val)) {
      err.textContent = 'Enter a valid phone number.';
      group.classList.add('error');
      return false;
    }
    err.textContent = '';
    group.classList.remove('error');
    return true;
  }

  // Live validation on blur
  ['name', 'service', 'message'].forEach(id => {
    document.getElementById(id)?.addEventListener('blur', () => {
      const msgs = { name: 'Your name is required.', service: 'Please select a service.', message: 'Please describe your idea.' };
      validateField(id, 'err-' + id, msgs[id]);
    });
  });
  document.getElementById('phone')?.addEventListener('blur', validatePhone);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v1 = validateField('name', 'err-name', 'Your name is required.');
    const v2 = validatePhone();
    const v3 = validateField('service', 'err-service', 'Please select a service.');
    const v4 = validateField('message', 'err-message', 'Please describe your idea.');

    if (!(v1 && v2 && v3 && v4)) {
      // Shake on error
      form.style.animation = 'none';
      form.offsetHeight; // reflow
      form.style.animation = 'formShake .4s ease';
      return;
    }

    const submitBtn = document.getElementById('form-submit-btn');
    const btnText   = submitBtn.querySelector('.btn-text');
    const spinner   = document.getElementById('form-spinner');
    const success   = document.getElementById('form-success');

    btnText.textContent = 'Sending...';
    spinner.classList.remove('hidden');
    submitBtn.disabled = true;

    // Simulate async send (replace with actual backend later)
    await new Promise(r => setTimeout(r, 1600));

    btnText.textContent = 'Send My Idea 🚀';
    spinner.classList.add('hidden');
    submitBtn.disabled = false;
    success.classList.remove('hidden');
    form.reset();

    setTimeout(() => success.classList.add('hidden'), 5000);
  });

  // Add shake keyframe dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes formShake {
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-8px)}
      40%{transform:translateX(8px)}
      60%{transform:translateX(-5px)}
      80%{transform:translateX(5px)}
    }
  `;
  document.head.appendChild(style);

  /* ==========================================
     8. SMOOTH SCROLL FOR ANCHOR LINKS
  ========================================== */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = 72; // navbar height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ==========================================
     9. STONE CARD TILT EFFECT
  ========================================== */
  document.querySelectorAll('.stone-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotX = -(y / rect.height) * 8;
      const rotY =  (x / rect.width) * 8;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)';
    });
  });

  /* ==========================================
     10. WHY CARD HOVER GLOW COLORS
  ========================================== */
  const glowColors = [
    'rgba(0,207,255,0.06)',
    'rgba(255,215,0,0.06)',
    'rgba(180,79,255,0.06)',
    'rgba(0,220,100,0.06)',
  ];
  const shadowColors = [
    '0 20px 60px rgba(0,0,0,.3), 0 0 30px rgba(0,207,255,0.2)',
    '0 20px 60px rgba(0,0,0,.3), 0 0 30px rgba(255,215,0,0.2)',
    '0 20px 60px rgba(0,0,0,.3), 0 0 30px rgba(180,79,255,0.2)',
    '0 20px 60px rgba(0,0,0,.3), 0 0 30px rgba(0,220,100,0.2)',
  ];
  document.querySelectorAll('.why-card').forEach((card, i) => {
    card.addEventListener('mouseenter', () => {
      card.style.background = glowColors[i % glowColors.length];
      card.style.boxShadow  = shadowColors[i % shadowColors.length];
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '';
      card.style.boxShadow  = '';
    });
  });

  /* ==========================================
     11. HERO CORE CLICK – SCROLL TO SERVICE
  ========================================== */
  const coreTargets = {
    'hero-core-hardware':  'core-electronics',
    'hero-core-digital':   'core-webdev',
    'hero-core-innovation': 'core-scrap',
  };
  Object.entries(coreTargets).forEach(([btnId, targetId]) => {
    document.getElementById(btnId)?.addEventListener('click', () => {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  /* ==========================================
     12. TYPING EFFECT FOR HERO SUBTITLE
  ========================================== */
  const phrases = ['Powering Technology', 'Building Dreams', 'Creating Innovations', 'Reinventing Reality'];
  const typingEl = document.querySelector('.hero-sub');
  let phraseIdx = 0, charIdx = 0, isDeleting = false;

  function typeWriter() {
    if (!typingEl) return;
    const current = phrases[phraseIdx];
    if (isDeleting) {
      typingEl.textContent = current.slice(0, charIdx--);
      if (charIdx < 0) { isDeleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; charIdx = 0; }
      setTimeout(typeWriter, 60);
    } else {
      typingEl.textContent = current.slice(0, charIdx++);
      if (charIdx > current.length) { isDeleting = true; setTimeout(typeWriter, 2000); }
      else setTimeout(typeWriter, 85);
    }
  }
  setTimeout(typeWriter, 2200);

  /* ==========================================
     13. PRELOADER / PAGE ENTRY
  ========================================== */
  // Smooth fade-in on load
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity .6s ease';
  window.addEventListener('load', () => {
    document.body.style.opacity = '1';
  });

  /* ==========================================
     14. INTERACTIVE BEFORE/AFTER SLIDER
  ========================================== */
  const container = document.getElementById('slider-container');
  const afterSide = document.getElementById('slider-after');
  const handle    = document.getElementById('slider-handle');

  if (container && afterSide && handle) {
    let isDragging = false;

    const setPosition = (clientX) => {
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      let percentage = (x / rect.width) * 100;
      if (percentage < 0) percentage = 0;
      if (percentage > 100) percentage = 100;

      afterSide.style.clipPath = `inset(0 0 0 ${percentage}%)`;
      handle.style.left = `${percentage}%`;
    };

    const startDragging = () => { isDragging = true; };
    const stopDragging  = () => { isDragging = false; };

    handle.addEventListener('mousedown', startDragging);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      setPosition(e.clientX);
    });

    // Touch Support
    handle.addEventListener('touchstart', startDragging, { passive: true });
    window.addEventListener('touchend', stopDragging);
    window.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      setPosition(e.touches[0].clientX);
    }, { passive: true });
  }

  /* ==========================================
     15. PROJECT DETAILS MODALS
  ========================================== */
  const modal      = document.getElementById('tech-modal');
  const modalClose = document.getElementById('modal-close-btn');
  const openButtons = document.querySelectorAll('.open-modal-btn');

  const schematics = {
    'weather-dashboard': `
      <svg width="240" height="180" viewBox="0 0 240 180" style="background:#090d22; border:1px solid rgba(180,79,255,0.2); border-radius:8px;">
        <rect x="20" y="20" width="200" height="140" rx="10" fill="none" stroke="#b44fff" stroke-width="2" />
        <line x1="20" y1="50" x2="220" y2="50" stroke="rgba(180,79,255,0.4)" stroke-width="1" />
        <circle cx="50" cy="35" r="5" fill="#00cfff" />
        <rect x="70" y="32" width="50" height="6" rx="3" fill="rgba(255,255,255,0.2)" />
        <path d="M 40 130 Q 80 80 120 120 T 200 70" fill="none" stroke="#00cfff" stroke-width="2" stroke-dasharray="240" stroke-dashoffset="0">
          <animate attributeName="stroke-dashoffset" values="240;0" dur="2s" repeatCount="indefinite" />
        </path>
        <line x1="40" y1="70" x2="40" y2="130" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        <line x1="40" y1="130" x2="200" y2="130" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        <circle cx="120" cy="120" r="4" fill="#ff8c00" />
      </svg>
    `,
    'scrap-bot': `
      <svg width="240" height="180" viewBox="0 0 240 180" style="background:#0c0805; border:1px solid rgba(255,140,0,0.2); border-radius:8px;">
        <circle cx="120" cy="70" r="25" fill="none" stroke="#ff8c00" stroke-width="2" />
        <rect x="105" y="100" width="30" height="40" rx="5" fill="none" stroke="#ff8c00" stroke-width="2" />
        <line x1="120" y1="45" x2="120" y2="35" stroke="#ff8c00" stroke-width="2" />
        <circle cx="120" cy="32" r="3" fill="#ffd700" />
        <circle cx="95" cy="140" r="12" fill="none" stroke="#00cfff" stroke-width="2" />
        <circle cx="145" cy="140" r="12" fill="none" stroke="#00cfff" stroke-width="2" />
        <path d="M 120 70 L 60 50 M 120 70 L 60 90" stroke="rgba(0,255,180,0.4)" stroke-width="1" stroke-dasharray="3,3" />
      </svg>
    `,
    'smart-lamp': `
      <svg width="240" height="180" viewBox="0 0 240 180" style="background:#05111b; border:1px solid rgba(0,207,255,0.2); border-radius:8px;">
        <rect x="110" y="140" width="20" height="20" fill="none" stroke="#00cfff" stroke-width="2" />
        <path d="M 120 140 L 120 70" stroke="#00cfff" stroke-width="3" />
        <circle cx="120" cy="55" r="18" fill="none" stroke="#ffd700" stroke-width="2" />
        <line x1="120" y1="30" x2="120" y2="20" stroke="rgba(255,215,0,0.6)" stroke-width="1.5" />
        <line x1="95" y1="40" x2="85" y2="32" stroke="rgba(255,215,0,0.6)" stroke-width="1.5" />
        <line x1="145" y1="40" x2="155" y2="32" stroke="rgba(255,215,0,0.6)" stroke-width="1.5" />
        <text x="75" y="110" fill="#b44fff" font-family="monospace" font-size="9">BT Module</text>
        <path d="M 110 105 L 120 105" stroke="#b44fff" stroke-width="1" />
      </svg>
    `
  };

  const projectDetails = {
    'smart-home': {
      cat: 'Electronics Services',
      title: 'Smart Home Hub v2.0',
      desc: 'A central IoT controller handling lighting, security, and climate via custom PCB and ESP32 architecture.',
      specs: [
        { label: 'Microcontroller', val: 'ESP32 Dual-Core' },
        { label: 'Connectivity', val: 'Wi-Fi / Bluetooth Low Energy' },
        { label: 'Sensors', val: 'Temperature, Motion, Light' },
        { label: 'Power', val: '5V USB-C / Internal Li-Po Backup' }
      ],
      cores: ['hardware']
    },
    'portfolio-site': {
      cat: 'Web Development',
      title: 'Creative Portfolio Framework',
      desc: 'A high-performance, SEO-optimized portfolio template for creatives, featuring custom animations and a dark mode toggle.',
      specs: [
        { label: 'Frontend', val: 'HTML5, CSS3, Vanilla JS' },
        { label: 'Animations', val: 'GSAP & CSS Transitions' },
        { label: 'Hosting', val: 'Vercel / Netlify' },
        { label: 'Performance', val: '99/100 Lighthouse Score' }
      ],
      cores: ['digital']
    },
    'weather-dashboard': {
      cat: 'Web Development',
      title: 'Cosmic Weather HUD',
      desc: 'An interactive dashboard showing atmospheric statistics, solar wind metrics, and custom telemetry data utilizing high-tech responsive widgets and real-time APIs.',
      specs: [
        { label: 'Technology Stack', val: 'Vite, React.js, ChartJS, CSS3' },
        { label: 'Data Fetching', val: 'REST API / WebSockets' },
        { label: 'Energy Class', val: 'Optimized / Ultra-low layout cost' },
        { label: 'Theme Support', val: 'Dynamic CSS Custom Properties' }
      ],
      cores: ['digital']
    }
  };

  const openModal = (id) => {
    const data = projectDetails[id];
    if (!data) return;

    document.getElementById('modal-project-cat').textContent = data.cat;
    document.getElementById('modal-project-title').textContent = data.title;
    document.getElementById('modal-project-desc').textContent = data.desc;

    // Load spec rows
    const specList = document.getElementById('modal-project-specs');
    specList.innerHTML = '';
    data.specs.forEach(s => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${s.label}:</strong> <span>${s.val}</span>`;
      specList.appendChild(li);
    });

    // Load core badges
    const coresRow = document.getElementById('modal-project-stones');
    coresRow.innerHTML = '';
    data.cores.forEach(core => {
      const badge = document.createElement('span');
      badge.className = `mini-stone-badge ${core === 'hardware' ? 'blue-badge' : core === 'digital' ? 'purple-badge' : 'orange-badge'}`;
      badge.textContent = core.toUpperCase();
      coresRow.appendChild(badge);
    });

    // Load SVG schematic
    document.getElementById('modal-schematic-content').innerHTML = schematics[id] || '';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(btn.dataset.project);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  /* ==========================================
     16. INFINITY SYNERGY PLANNER
  ========================================== */
  const synergyMatrix = {
    'hardware': {
      name: 'Custom Sensor Array',
      difficulty: 'Novice',
      timeline: '2 - 3 Days',
      budget: 'Low',
      desc: 'A standalone electronics module designed to log environmental data (temp/humidity) directly to an SD card.',
      tags: ['Arduino', 'Basic Sensors', 'Soldering']
    },
    'digital': {
      name: 'Static Showcase Site',
      difficulty: 'Novice',
      timeline: '3 - 5 Days',
      budget: 'Medium',
      desc: 'A fast, responsive 3-page business website built from scratch with modern HTML/CSS and minimal JavaScript.',
      tags: ['HTML/CSS', 'Responsive Design', 'Web Hosting']
    },
    'innovation': {
      name: 'Upcycled Desk Lamp',
      difficulty: 'Novice',
      timeline: '1 - 2 Days',
      budget: 'Low',
      desc: 'A simple, beautiful desk lamp crafted entirely from discarded metal components and powered by a salvaged USB cable.',
      tags: ['Recycling', 'Creative Fabrication', 'Basic Wiring']
    },
    'hardware,digital': {
      name: 'IoT Dashboard System',
      difficulty: 'Adept',
      timeline: '7 - 10 Days',
      budget: 'Medium-High',
      desc: 'Hardware sensors integrated with a custom web dashboard for real-time remote monitoring via a secure API.',
      tags: ['Microcontrollers', 'Sensors', 'Websites', 'APIs']
    },
    'hardware,innovation': {
      name: 'Scrap-Bot Companion',
      difficulty: 'Adept',
      timeline: '5 - 8 Days',
      budget: 'Medium',
      desc: 'An autonomous navigation robot built from upcycled plastics, utilizing ultrasonic sensors to avoid obstacles.',
      tags: ['Robotics', 'Upcycling', 'Motor Control']
    },
    'digital,innovation': {
      name: 'Interactive Virtual Gallery',
      difficulty: 'Adept',
      timeline: '5 - 7 Days',
      budget: 'Medium',
      desc: 'Online showcase website featuring fully animated layouts, virtual gallery tours, and high-performance assets.',
      tags: ['3D Web Graphics', 'Interactive Design', 'Web Portfolios']
    },
    'hardware,digital,innovation': {
      name: 'Ultimate Smart Green Appliance',
      difficulty: 'Master',
      timeline: '10 - 14 Days',
      budget: 'High',
      desc: 'Autonomous solar-powered recycling station made from upcycled frames, integrated with smart sensors and a remote Web admin dashboard.',
      tags: ['Solar Systems', 'Full Stack IoT', 'High Power Relays', 'Circular Economy']
    }
  };

  const plannerCores = document.querySelectorAll('.selector-stone');
  const coreEl = document.getElementById('hud-core');

  const updateSynergy = () => {
    const active = [];
    plannerCores.forEach(core => {
      if (core.classList.contains('active')) active.push(core.dataset.core);
    });

    const key = active.join(',');
    const project = synergyMatrix[key];

    if (coreEl) {
      coreEl.style.boxShadow = '';
      coreEl.querySelector('.core-symbol').style.color = '#fff';
      if (active.length > 0) {
        let shadowColor = '';
        if (key === 'hardware') shadowColor = 'rgba(0, 207, 255, 0.6)';
        else if (key === 'digital') shadowColor = 'rgba(180, 79, 255, 0.6)';
        else if (key === 'innovation') shadowColor = 'rgba(255, 140, 0, 0.6)';
        else if (key === 'hardware,digital') shadowColor = 'rgba(130, 140, 255, 0.6)';
        else if (key === 'hardware,innovation') shadowColor = 'rgba(120, 180, 130, 0.6)';
        else if (key === 'digital,innovation') shadowColor = 'rgba(220, 100, 130, 0.6)';
        else shadowColor = 'rgba(255, 255, 255, 0.8)';
        
        coreEl.style.boxShadow = `0 0 40px ${shadowColor}, inset 0 0 20px ${shadowColor}`;
        coreEl.querySelector('.core-symbol').style.color = active.length === 1 ? `var(--${active[0]})` : '#fff';
      }
    }

    if (!project) {
      document.getElementById('synergy-project-name').textContent = 'Synthesize Blueprint';
      document.getElementById('synergy-difficulty').textContent = '-';
      document.getElementById('synergy-difficulty').className = 'hud-value';
      document.getElementById('synergy-timeline').textContent = '-';
      document.getElementById('synergy-budget').textContent = '-';
      document.getElementById('synergy-budget').className = 'hud-value';
      document.getElementById('synergy-desc').textContent = 'Please toggle active divisions in the selection panel to start project planning.';
      document.getElementById('synergy-tags').innerHTML = '<span>No systems selected</span>';
      return;
    }

    document.getElementById('synergy-project-name').textContent = project.name;
    document.getElementById('synergy-difficulty').textContent = project.difficulty;
    
    const diffEl = document.getElementById('synergy-difficulty');
    diffEl.className = 'hud-value';
    if (project.difficulty === 'Novice') diffEl.classList.add('text-green');
    else if (project.difficulty === 'Adept') diffEl.classList.add('text-blue');
    else diffEl.classList.add('text-purple');

    document.getElementById('synergy-timeline').textContent = project.timeline;
    
    const budgetEl = document.getElementById('synergy-budget');
    budgetEl.textContent = project.budget;
    budgetEl.className = 'hud-value';
    if (project.budget === 'Low') budgetEl.classList.add('text-green');
    else if (project.budget === 'Medium') budgetEl.classList.add('text-blue');
    else budgetEl.classList.add('text-purple');

    document.getElementById('synergy-desc').textContent = project.desc;

    const tagsWrapper = document.getElementById('synergy-tags');
    tagsWrapper.innerHTML = '';
    project.tags.forEach(tag => {
      const span = document.createElement('span');
      span.textContent = tag;
      tagsWrapper.appendChild(span);
    });
  };

  plannerCores.forEach(core => {
    core.addEventListener('click', () => {
      core.classList.toggle('active');
      updateSynergy();
    });
  });

  const synthesisBtn = document.getElementById('synthesize-project-btn');
  if (synthesisBtn) {
    synthesisBtn.addEventListener('click', () => {
      const projName = document.getElementById('synergy-project-name').textContent;
      if (projName === 'Synthesize Blueprint') return;

      const contactForm = document.getElementById('contact-form');
      const contactSection = document.getElementById('contact');
      if (!contactForm || !contactSection) return;

      const select = document.getElementById('service');
      const activeCores = [];
      plannerCores.forEach(core => {
        if (core.classList.contains('active')) activeCores.push(core.dataset.core);
      });

      if (activeCores.length === 1) {
        if (activeCores.includes('hardware')) select.value = 'electronics';
        else if (activeCores.includes('digital')) select.value = 'webdev';
        else if (activeCores.includes('innovation')) select.value = 'scrap';
      } else if (activeCores.length > 1) {
        select.value = 'multiple';
      }

      const descEl = document.getElementById('synergy-desc').textContent;
      const msgTextarea = document.getElementById('message');
      msgTextarea.value = `I am interested in synthesizing the project synergy:\n\n**${projName}**\nDescription: ${descEl}\n\nLet's discuss details!`;

      const offset = 72;
      const top = contactSection.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      const descGroup = msgTextarea.closest('.form-group');
      if (descGroup) {
        descGroup.style.animation = 'none';
        descGroup.offsetHeight;
        descGroup.style.animation = 'formShake .5s ease';
      }
    });
  }

  /* ==========================================
     17. CARD GLARE SHEEN EFFECT
  ========================================== */
  document.querySelectorAll('.stone-card').forEach(card => {
    if (!card.querySelector('.glare')) {
      const glare = document.createElement('div');
      glare.className = 'glare';
      card.appendChild(glare);
    }

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
    });
  });

  console.log('∞ Infinite Services – Powered by Innovation');
})();
