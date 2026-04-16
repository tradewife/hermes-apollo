// Osmo Free Resource: multilevel-navigation
// Source: https://www.osmo.supply/resource/multilevel-navigation
// Preview: https://multilevel-navigation-resource.webflow.io/

function initNavigation() {
  if (!initNavigation._hasResizeListener) {
    initNavigation._hasResizeListener = true;
    window.addEventListener('resize', debounce(initNavigation, 200));
  }

  const isMobile = window.innerWidth < 768;
  if (isMobile && initNavigation._lastMode !== 'mobile') {
    initMobileMenu();
    initNavigation._lastMode = 'mobile';
  } else if (!isMobile && initNavigation._lastMode !== 'desktop') {
    initDesktopDropdowns();
    initNavigation._lastMode = 'desktop';
  }
}

function debounce(fn, delay) {
  let timer;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

function initMobileMenu() {
  const btn = document.querySelector('[data-menu-button]');
  const nav = document.querySelector('[data-menu-status]');
  if (!btn || !nav) return;

  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mobile-navigation');
  nav.setAttribute('id', 'mobile-navigation');
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');

  if (!btn._mobileClick) {
    btn._mobileClick = true;
    btn.addEventListener('click', () => {
      const open = nav.dataset.menuStatus === 'open';
      nav.dataset.menuStatus = open ? 'closed' : 'open';
      btn.setAttribute('aria-expanded', !open);

      // Close all dropdowns when closing the menu
      if (open) {
        Array.from(document.querySelectorAll('[data-dropdown-toggle]')).forEach(toggle => {
          toggle.dataset.dropdownToggle = 'closed';
          toggle.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  Array.from(document.querySelectorAll('[data-dropdown-toggle]')).forEach((toggle, i) => {
    const dd = toggle.nextElementSibling;
    if (!dd || !dd.classList.contains('nav-dropdown')) return;
    if (toggle._mobileDropdownInit) return;
    toggle._mobileDropdownInit = true;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-controls', `dropdown-${i}`);
    
    dd.setAttribute('id', `dropdown-${i}`);
    dd.setAttribute('role', 'menu');
    dd.querySelectorAll('.nav-dropdown__link')
      .forEach(link => link.setAttribute('role', 'menuitem'));

    toggle.addEventListener('click', () => {
      const open = toggle.dataset.dropdownToggle === 'open';
      Array.from(document.querySelectorAll('[data-dropdown-toggle]'))
        .forEach(other => {
          if (other !== toggle) {
            other.dataset.dropdownToggle = 'closed';
            other.setAttribute('aria-expanded', 'false');
            if (other === document.activeElement) other.blur();
          }
        });
      toggle.dataset.dropdownToggle = open ? 'closed' : 'open';
      toggle.setAttribute('aria-expanded', !open);
      if (open && toggle === document.activeElement) toggle.blur();
    });
  });
}

function initDesktopDropdowns() {
  const toggles = Array.from(document.querySelectorAll('[data-dropdown-toggle]'));
  const links = Array.from(document.querySelectorAll('.nav-link:not([data-dropdown-toggle])'));

  toggles.forEach((toggle, i) => {
    const dd = toggle.nextElementSibling;
    if (!dd || !dd.classList.contains('nav-dropdown') || toggle._desktopInit) return;
    toggle._desktopInit = true;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-controls', `desktop-dropdown-${i}`);
    
    dd.setAttribute('id', `desktop-dropdown-${i}`);
    dd.setAttribute('role', 'menu');
    dd.setAttribute('aria-hidden', 'true');
    dd.querySelectorAll('.nav-dropdown__link')
      .forEach(link => link.setAttribute('role', 'menuitem'));

    toggle.addEventListener('click', e => {
      e.preventDefault();
      toggles.forEach(other => {
        if (other !== toggle) {
          other.dataset.dropdownToggle = 'closed';
          other.setAttribute('aria-expanded', 'false');
          const otherDropdown = other.nextElementSibling;
          if (otherDropdown) otherDropdown.setAttribute('aria-hidden', 'true');
        }
      });
      const open = toggle.dataset.dropdownToggle !== 'open';
      toggle.dataset.dropdownToggle = 'open';
      toggle.setAttribute('aria-expanded', 'true');
      dd.setAttribute('aria-hidden', 'false');
      if (open) {
        const first = dd.querySelector('.nav-dropdown__link');
        if (first) first.focus();
      }
    });

    toggle.addEventListener('mouseenter', () => {
      const anyOpen = toggles.some(x => x.dataset.dropdownToggle === 'open');
      toggles.forEach(other => {
        if (other !== toggle) {
          other.dataset.dropdownToggle = 'closed';
          other.setAttribute('aria-expanded', 'false');
          const otherDropdown = other.nextElementSibling;
          if (otherDropdown) otherDropdown.setAttribute('aria-hidden', 'true');
        }
      });
      if (anyOpen) {
        setTimeout(() => {
          toggle.dataset.dropdownToggle = 'open';
          toggle.setAttribute('aria-expanded', 'true');
          dd.setAttribute('aria-hidden', 'false');
        }, 20);
      } else {
        toggle.dataset.dropdownToggle = 'open';
        toggle.setAttribute('aria-expanded', 'true');
        dd.setAttribute('aria-hidden', 'false');
      }
    });

    dd.addEventListener('mouseleave', () => {
      toggle.dataset.dropdownToggle = 'closed';
      toggle.setAttribute('aria-expanded', 'false');
      dd.setAttribute('aria-hidden', 'true');
    });

    toggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.click();
      } else if (e.key === 'Escape') {
        toggle.dataset.dropdownToggle = 'closed';
        toggle.setAttribute('aria-expanded', 'false');
        dd.setAttribute('aria-hidden', 'true');
        toggle.focus();
      }
    });

    dd.addEventListener('keydown', e => {
      const items = Array.from(dd.querySelectorAll('.nav-dropdown__link'));
      const idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        toggle.dataset.dropdownToggle = 'closed';
        toggle.setAttribute('aria-expanded', 'false');
        dd.setAttribute('aria-hidden', 'true');
        toggle.focus();
      } else if (e.key === 'Tab' && !dd.contains(e.relatedTarget)) {
        toggle.dataset.dropdownToggle = 'closed';
        toggle.setAttribute('aria-expanded', 'false');
        dd.setAttribute('aria-hidden', 'true');
      }
    });
  });

  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      toggles.forEach(toggle => {
        toggle.dataset.dropdownToggle = 'closed';
        toggle.setAttribute('aria-expanded', 'false');
        const dd = toggle.nextElementSibling;
        if (dd) dd.setAttribute('aria-hidden', 'true');
      });
    });
  });

  document.addEventListener('click', e => {
    const inside = toggles.some(toggle => {
      const dd = toggle.nextElementSibling;
      return toggle.contains(e.target) || (dd && dd.contains(e.target));
    });
    if (!inside) {
      toggles.forEach(toggle => {
        toggle.dataset.dropdownToggle = 'closed';
        toggle.setAttribute('aria-expanded', 'false');
        const dd = toggle.nextElementSibling;
        if (dd) dd.setAttribute('aria-hidden', 'true');
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
	initNavigation();
});


/* === CSS === */
:root {
  --nav-bg-height: calc(20em + calc(2em + 3em + 2.5em + 3em));
  --cubic-default: cubic-bezier(0.525, 0, 0, 1);
  --duration-fast: 0.2s;
  --duration-normal: 0.450s;
  --color-dark: #2b1d15;
}

a {
  color: inherit;
  text-decoration: none;
}

a:focus-visible,
button:focus-visible {
  outline: 1px solid var(--color-dark);
}

.nav-bg {
  transition: height var(--duration-normal) var(--cubic-default);
}

.page-bg {
  transition: opacity var(--duration-fast) var(--cubic-default);
}

.nav {
  transition: color var(--duration-fast) var(--cubic-default);
}

.nav-button {
  transition: all var(--duration-fast) var(--cubic-default);
}

/* ———— SHOW DROPDOWN ———— */
.nav-dropdown {
  transition: all var(--duration-fast) ease, transform var(--duration-normal) var(--cubic-default);
}

[data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):hover+.nav-dropdown,
[data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):focus-visible+.nav-dropdown,
[data-dropdown-toggle]:not([data-dropdown-toggle="closed"])+.nav-dropdown:hover,
[data-dropdown-toggle]:not([data-dropdown-toggle="closed"])+.nav-dropdown:focus-within,
.wf-design-mode [data-dropdown-toggle="open"]+.nav-dropdown{
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

/*———— STYLING WHEN DROPDOWN IS OPEN ———— */
:is(body:has([data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):hover),
  body:has([data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):focus-visible),
  body:has([data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):focus-within),
  body:has([data-dropdown-toggle]:not([data-dropdown-toggle="closed"])+.nav-dropdown:hover),
  body:has([data-dropdown-toggle]:not([data-dropdown-toggle="closed"])+.nav-dropdown:focus-within)),
  .wf-design-mode body:has([data-dropdown-toggle="open"]){
  .nav-bg {
    height: var(--nav-bg-height);
  }

  .page-bg {
    opacity: 1;
  }

  .nav {
    color: var(--color-dark);
  }

  .nav-button {
    border-color: var(--color-dark);
    color: var(--color-dark);
  }

  .nav-button.is--primary {
    background-color: var(--color-dark);
    border-color: var(--color-dark);
    color: #FFF;
  }
}

/*———— DROPDOWN TOGGLE ———— */
.nav-link__dropdown-icon {
  transition: transform var(--duration-normal) var(--cubic-default);
}

[data-dropdown-toggle] {
  transition: background-color var(--duration-fast) var(--cubic-default);
}

/*———— DESKTOP HOVER AND FOCUS ———— */
@media screen and (min-width: 768px) {

  [data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):hover .nav-link__dropdown-icon,
  [data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):focus .nav-link__dropdown-icon,
  [data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):focus-within .nav-link__dropdown-icon,
  [data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):has(+ .nav-dropdown:hover) .nav-link__dropdown-icon,
  [data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):has(+ .nav-dropdown:focus-within) .nav-link__dropdown-icon {
    transform: rotate(180deg);
  }

  [data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):hover,
  [data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):focus,
  [data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):focus-within,
  [data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):has(+ .nav-dropdown:hover),
  [data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):has(+ .nav-dropdown:focus-within),
  .wf-design-mode body:has([data-dropdown-toggle"open"])+.nav-dropdown{
    background-color: #EBE7E4;
  }

}

/*————  DROPDOWN CONTENT LIST ITEMS ———— */
.nav-dropdown__content-li {
  transition: all var(--duration-normal) var(--cubic-default);
  transition-delay: 0.18s;
  opacity: 0;
  transform: translate(4em, 0px);
}

.nav-dropdown__content-li:nth-child(2) {
  transition-delay: 0.24s;
}

.nav-dropdown__content-li:nth-child(3) {
  transition-delay: 0.3s;
}

.nav-dropdown__content-li:nth-child(4) {
  transition-delay: 0.36s;
}

.nav-dropdown__content-li:nth-child(5) {
  transition-delay: 0.44s;
}

body:has([data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):hover) [data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):hover+.nav-dropdown .nav-dropdown__content-li,
body:has([data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):focus-visible) .nav-dropdown__content-li,
body:has([data-dropdown-toggle]:not([data-dropdown-toggle="closed"]):focus-within) .nav-dropdown__content-li,
body:has([data-dropdown-toggle]:not([data-dropdown-toggle="closed"])+.nav-dropdown:hover) .nav-dropdown__content-li,
body:has([data-dropdown-toggle]:not([data-dropdown-toggle="closed"])+.nav-dropdown:focus-within) .nav-dropdown__content-li,
.wf-design-mode [data-dropdown-toggle="open"]+.nav-dropdown .nav-dropdown__content-li{
  opacity: 1;
  transform: translate(0em, 0px);
}

/*————  DROPDOWN LINKS + IMAGES ———— */
.nav-dropdown__link:hover .nav-dropdown__img-overlay,
.nav-dropdown__link:focus-visible .nav-dropdown__img-overlay {
  opacity: 0;
}

.nav-dropdown__link:hover .nav-dropdown__img,
.nav-dropdown__link:focus-visible .nav-dropdown__img {
  transform: scale(1.1);
}

/*———— DROPDOWN LINKS ———— */
.nav-dropdown__link.is--static:hover,
.nav-dropdown__link.is--static:focus-visible {
  background: #D7D1CD;
}

/* ———— NAV LINKS ———— */
a.nav-link .nav-link__label::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 100%;
  height: 1px;
  background: currentColor;
  transition: transform var(--duration-normal) var(--cubic-default);
  transform: scale(0, 1);
  transform-origin: right center;
}

a.nav-link:hover .nav-link__label::after,
a.nav-link:focus-visible .nav-link__label::after {
  transform: scale(1, 1);
  transform-origin: left center;
}

/* ———— MOBILE STATE WITH BURGER MENU ———— */
@media screen and (max-width: 767px) {
  :root {
    --nav-bg-height: 100dvh;
  }

  .nav-dropdown__overflow {
    transition: grid-template-rows var(--duration-normal) var(--cubic-default);
  }

  .nav-center {
    transition: all var(--duration-normal) var(--cubic-default), opacity var(--duration-fast) var(--cubic-default);
  }

  .menu-button__line {
    transition: all var(--duration-normal) var(--cubic-default);
  }

  /* ———— STYLES WHEN MENU IS OPEN ———— */
  :is([data-menu-status="open"]) {
    color: var(--color-dark);

    .menu-button__line:nth-of-type(1) {
      transform: translate(0px, 0.125em) rotate(135deg);
      background-color: #FFF;
    }

    .menu-button__line:nth-of-type(2) {
      transform: translate(0px, -0.175em) rotate(-135deg);
      background-color: #FFF;
    }

    .nav-bg {
      height: var(--nav-bg-height);
    }

    .page-bg {
      opacity: 1;
    }

    .nav-button.is--primary {
      background-color: var(--color-dark);
      border-color: var(--color-dark);
      color: #FFF;
    }

    .nav-center {
      opacity: 1;
      visibility: visible;
      transform: translate(0px, 0em);
      transition-delay: 0.1s;
    }
  }

  [data-dropdown-toggle="open"]+.nav-dropdown .nav-dropdown__overflow {
    grid-template-rows: 1fr;
  }

  [data-dropdown-toggle="open"]+.nav-dropdown .nav-dropdown__content-li {
    opacity: 1;
    transform: translate(0em, 0px);
  }

  [data-dropdown-toggle="open"] .nav-link__dropdown-icon {
    transform: rotate(180deg);
  }
}
