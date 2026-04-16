// Osmo Free Resource: button-with-css-character-stagger
// Source: https://www.osmo.supply/resource/button-with-css-character-stagger
// Preview: https://button-with-css-character-stagger-resource.webflow.io/

function initButtonCharacterStagger() {
  const offsetIncrement = 0.01; // Transition offset increment in seconds
  const buttons = document.querySelectorAll('[data-button-animate-chars]');

  buttons.forEach(button => {
    const text = button.textContent; // Get the button's text content
    button.innerHTML = ''; // Clear the original content

    [...text].forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.transitionDelay = `${index * offsetIncrement}s`;

      // Handle spaces explicitly
      if (char === ' ') {
        span.style.whiteSpace = 'pre'; // Preserve space width
      }

      button.appendChild(span);
    });
  });
}

// Initialize Button Character Stagger Animation
document.addEventListener('DOMContentLoaded', () => {
  initButtonCharacterStagger();
});


/* === CSS === */
/* Characters */
.btn-animate-chars [data-button-animate-chars] {
  overflow: hidden;
  position: relative;
  display: inline-block;
}

.btn-animate-chars [data-button-animate-chars] span {
  display: inline-block;
  position: relative;
  text-shadow: 0px 1.3em currentColor;
  transform: translateY(0em) rotate(0.001deg);
  transition: transform 0.6s cubic-bezier(0.625, 0.05, 0, 1);
}

.btn-animate-chars:hover [data-button-animate-chars] span {
  transform: translateY(-1.3em) rotate(0.001deg);
}

/* Background */
.btn-animate-chars__bg {
  inset: 0;
  transition: inset 0.6s cubic-bezier(0.625, 0.05, 0, 1);
}

.btn-animate-chars:hover .btn-animate-chars__bg {
  inset: 0.125em;
}
