/* ============================================
   MeowNotes - App Initialization
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize cat animator
  const catAnimator = new CatAnimator();

  // Initialize interactions
  const interactions = new Interactions();

  // Initialize typewriter effects
  initTypewriters();

  // Stagger panel fade-in on load
  const panels = document.querySelectorAll('#app > *');
  panels.forEach((panel, index) => {
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(8px)';
    panel.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      });
    });
  });
});
