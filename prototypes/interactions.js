/* ========================================
   PriceMate AU — CJX Animations & Interactions
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* === CJX Stage Entrance Animations === */
  const cjxKeyframes = {
    'cjx-onboarding': [
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    'cjx-usage': [
      { opacity: 0 },
      { opacity: 1 }
    ],
    'cjx-retention': [
      { opacity: 0 },
      { opacity: 1 }
    ],
    'cjx-discovery': [
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ]
  };

  const cjxTimings = {
    'cjx-onboarding': { duration: 600, easing: 'ease-out' },
    'cjx-usage': { duration: 300, easing: 'ease' },
    'cjx-retention': { duration: 400, easing: 'ease' },
    'cjx-discovery': { duration: 800, easing: 'ease-out' }
  };

  const bodyClasses = document.body.className.split(' ');
  let activeCjxStage = null;

  for (const className of bodyClasses) {
    if (cjxKeyframes[className]) {
      activeCjxStage = className;
      break;
    }
  }

  if (activeCjxStage) {
    const entranceElements = document.querySelectorAll('[data-cjx-entrance]');
    entranceElements.forEach(function (element, elementIndex) {
      element.style.opacity = '0';
      setTimeout(function () {
        element.animate(
          cjxKeyframes[activeCjxStage],
          {
            ...cjxTimings[activeCjxStage],
            delay: elementIndex * 80,
            fill: 'forwards'
          }
        );
      }, 50);
    });
  }

  /* === Toggle Group (Time Range Selector) === */
  const toggleGroups = document.querySelectorAll('.toggle-group');
  toggleGroups.forEach(function (group) {
    const buttons = group.querySelectorAll('.toggle-btn');
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        buttons.forEach(function (btn) { btn.classList.remove('active'); });
        button.classList.add('active');
      });
    });
  });

  /* === Collapsible Sections === */
  const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
  collapsibleHeaders.forEach(function (header) {
    const body = header.nextElementSibling;
    const toggle = header.querySelector('.collapsible-toggle');

    header.addEventListener('click', function () {
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'block';
      if (toggle) {
        toggle.textContent = isOpen ? '▸' : '▾';
      }
    });
  });

  /* === Toast Notification === */
  window.showToast = function (message, duration) {
    duration = duration || 3000;
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function () { toast.remove(); }, 300);
    }, duration);
  };

  /* === Track Button (Search/Deals) === */
  const trackButtons = document.querySelectorAll('[data-action="track"]');
  trackButtons.forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      event.preventDefault();
      const productName = button.getAttribute('data-product') || 'Product';
      button.textContent = 'Tracked ✓';
      button.classList.remove('btn-primary');
      button.classList.add('btn-success');
      button.disabled = true;
      window.showToast('Now tracking: ' + productName);
    });
  });

  /* === Remove Button (Dashboard) === */
  const removeButtons = document.querySelectorAll('[data-action="remove"]');
  removeButtons.forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      event.preventDefault();
      const cardElement = button.closest('.dashboard-card');
      if (cardElement) {
        cardElement.style.opacity = '0.5';
        cardElement.style.transition = 'opacity 0.3s';
        window.showToast('Product removed from tracking');
        setTimeout(function () {
          cardElement.style.display = 'none';
        }, 600);
      }
    });
  });

  /* === Set Alert Button === */
  const alertForms = document.querySelectorAll('.alert-form');
  alertForms.forEach(function (form) {
    const submitButton = form.querySelector('[data-action="set-alert"]');
    if (submitButton) {
      submitButton.addEventListener('click', function (event) {
        event.preventDefault();
        const priceInput = form.querySelector('input[type="number"]');
        if (priceInput && priceInput.value) {
          window.showToast('Alert set for $' + parseFloat(priceInput.value).toFixed(2));
          submitButton.textContent = 'Update Alert';
        }
      });
    }
  });

  /* === Password Strength Indicator === */
  const passwordInput = document.querySelector('[data-password-strength]');
  if (passwordInput) {
    const strengthBars = document.querySelectorAll('.password-strength-bar');
    passwordInput.addEventListener('input', function () {
      const value = passwordInput.value;
      let strength = 0;

      if (value.length >= 8) strength++;
      if (/[A-Z]/.test(value) && /[a-z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;

      const levels = ['weak', 'weak', 'medium', 'strong', 'strong'];
      strengthBars.forEach(function (bar, barIndex) {
        bar.classList.remove('filled', 'weak', 'medium', 'strong');
        if (barIndex < strength) {
          bar.classList.add('filled', levels[strength]);
        }
      });
    });
  }

  /* === Mobile Nav Toggle === */
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      const navActions = document.querySelector('.navbar-actions');
      if (navActions) {
        navActions.classList.toggle('show-mobile');
      }
    });
  }

  /* === Product Card Click Navigation === */
  const productCards = document.querySelectorAll('[data-href]');
  productCards.forEach(function (card) {
    card.addEventListener('click', function () {
      const href = card.getAttribute('data-href');
      if (href) {
        window.location.href = href;
      }
    });
  });

  /* === Fetch Product (Add URL page) === */
  const fetchButton = document.querySelector('[data-action="fetch-product"]');
  if (fetchButton) {
    fetchButton.addEventListener('click', function () {
      const urlInput = document.querySelector('[data-url-input]');
      const preview = document.querySelector('.product-preview');
      if (urlInput && urlInput.value && preview) {
        fetchButton.textContent = 'Fetching...';
        fetchButton.disabled = true;
        setTimeout(function () {
          preview.style.display = 'flex';
          fetchButton.textContent = 'Fetch Product';
          fetchButton.disabled = false;
        }, 1200);
      }
    });
  }

  /* === Infinite Scroll Simulation === */
  document.querySelectorAll('.loading-section').forEach(function (section) {
    section.style.opacity = '0';
    section.style.transition = 'opacity 0.4s ease';
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          section.style.opacity = '1';
        }
      });
    }, { threshold: 0.1 });
    observer.observe(section);
  });

});
