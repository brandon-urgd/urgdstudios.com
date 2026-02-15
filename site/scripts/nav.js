/**
 * Mobile Navigation Toggle
 * Handles hamburger menu open/close with focus trapping
 */

(function() {
  'use strict';

  const header = document.querySelector('.site-header');
  const toggleButton = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.site-nav__links');

  if (!header || !toggleButton || !navLinks) {
    return; // Elements not present on this page
  }

  const menuItems = navLinks.querySelectorAll('a');
  let isMenuOpen = false;

  function openMenu() {
    isMenuOpen = true;
    header.classList.add('site-header--menu-open');
    toggleButton.setAttribute('aria-expanded', 'true');
    toggleButton.setAttribute('aria-label', 'Close menu');
    toggleButton.textContent = '✕';
    
    // Focus first menu item
    if (menuItems.length > 0) {
      menuItems[0].focus();
    }
  }

  function closeMenu() {
    isMenuOpen = false;
    header.classList.remove('site-header--menu-open');
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-label', 'Menu');
    toggleButton.textContent = '☰';
    
    // Return focus to toggle button
    toggleButton.focus();
  }

  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Toggle button click
  toggleButton.addEventListener('click', toggleMenu);

  // Escape key closes menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) {
      closeMenu();
    }
  });

  // Click outside closes menu
  document.addEventListener('click', (e) => {
    if (isMenuOpen && !header.contains(e.target)) {
      closeMenu();
    }
  });

  // Focus trap: Tab cycles through menu items
  navLinks.addEventListener('keydown', (e) => {
    if (!isMenuOpen || e.key !== 'Tab') {
      return;
    }

    const firstItem = menuItems[0];
    const lastItem = menuItems[menuItems.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: wrap from first to last
      if (document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      }
    } else {
      // Tab: wrap from last to first
      if (document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    }
  });

  // Link click closes menu (navigation occurs)
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      if (isMenuOpen) {
        closeMenu();
      }
    });
  });
})();
