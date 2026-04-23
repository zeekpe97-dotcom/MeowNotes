/* ============================================
   MeowNotes - Typewriter Effect
   ============================================ */

class Typewriter {
  constructor(element, options = {}) {
    this.element = element;
    this.text = element.getAttribute('data-text') || element.textContent;
    this.speed = options.speed || 40;
    this.delay = options.delay || 2000;
    this.cursor = options.cursor !== false;

    this.init();
  }

  init() {
    // Clear original text
    this.element.textContent = '';

    // Add cursor
    if (this.cursor) {
      this.cursorEl = document.createElement('span');
      this.cursorEl.className = 'ai-suggestion__cursor';
      this.element.appendChild(this.cursorEl);
    }

    // Start typing after delay
    setTimeout(() => this.type(0), this.delay);
  }

  type(index) {
    if (index < this.text.length) {
      // Insert character before cursor
      const char = document.createTextNode(this.text[index]);
      if (this.cursorEl) {
        this.element.insertBefore(char, this.cursorEl);
      } else {
        this.element.appendChild(char);
      }

      setTimeout(() => this.type(index + 1), this.speed);
    }
  }
}

// Auto-init typewriter elements
function initTypewriters() {
  document.querySelectorAll('[data-typewriter]').forEach(el => {
    new Typewriter(el, {
      speed: parseInt(el.getAttribute('data-speed')) || 40,
      delay: parseInt(el.getAttribute('data-delay')) || 2000,
    });
  });
}
