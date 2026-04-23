/* ============================================
   MeowNotes - Interactions
   ============================================ */

class Interactions {
  constructor() {
    this.init();
  }

  init() {
    this.initEditorScroll();
    this.initSettingsModal();
    this.initGraphOverlay();
    this.initTreeToggle();
    this.initTreeItemClick();
    this.initToggles();
  }

  // Editor toolbar shadow on scroll
  initEditorScroll() {
    const content = document.querySelector('.editor__content');
    const toolbar = document.querySelector('.editor__toolbar');
    if (!content || !toolbar) return;

    content.addEventListener('scroll', () => {
      if (content.scrollTop > 0) {
        toolbar.classList.add('scrolled');
      } else {
        toolbar.classList.remove('scrolled');
      }
    });
  }

  // Settings modal open/close
  initSettingsModal() {
    const settingsBtn = document.querySelector('[data-action="settings"]');
    const overlay = document.querySelector('.settings-overlay');
    const closeBtn = document.querySelector('.settings-modal__close');

    if (!settingsBtn || !overlay) return;

    settingsBtn.addEventListener('click', () => {
      overlay.classList.add('visible');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('visible');
      });
    }

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('visible');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('visible')) {
        overlay.classList.remove('visible');
      }
    });

    // Tab switching
    overlay.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        overlay.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }

  // Knowledge graph overlay
  initGraphOverlay() {
    const graphBtn = document.querySelector('[data-action="graph"]');
    const overlay = document.querySelector('.graph-overlay');
    const closeBtn = overlay?.querySelector('.graph-overlay__close');

    if (!graphBtn || !overlay) return;

    graphBtn.addEventListener('click', () => {
      overlay.classList.toggle('visible');
      graphBtn.classList.toggle('active');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('visible');
        graphBtn.classList.remove('active');
      });
    }
  }

  // File tree folder toggle
  initTreeToggle() {
    document.querySelectorAll('.tree-item--folder').forEach(folder => {
      folder.addEventListener('click', (e) => {
        e.stopPropagation();
        folder.classList.toggle('open');
        const subList = folder.nextElementSibling;
        if (subList && subList.tagName === 'UL') {
          subList.style.display = subList.style.display === 'none' ? 'block' : 'none';
        }
      });
    });
  }

  // File tree item active state
  initTreeItemClick() {
    document.querySelectorAll('.tree-item--file').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.tree-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  // Toggle switches
  initToggles() {
    document.querySelectorAll('.toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
      });
    });
  }
}
