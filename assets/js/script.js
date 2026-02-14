const dynamicTextElement = document.getElementById("hero-dynamic-text");



if (dynamicTextElement) {
  const phrases = JSON.parse(dynamicTextElement.dataset.phrases || "[]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (phrases.length > 0) {
    if (reducedMotion) {
      let reducedIndex = 0;
      dynamicTextElement.textContent = phrases[0];
      setInterval(() => {
        reducedIndex = (reducedIndex + 1) % phrases.length;
        dynamicTextElement.textContent = phrases[reducedIndex];
      }, 2800);
    } else {
      let phraseIndex = 0;
      let charIndex = 0;
      let deleting = false;

      const typeLoop = () => {
        const currentPhrase = phrases[phraseIndex];

        if (!deleting) {
          charIndex += 1;
          dynamicTextElement.textContent = currentPhrase.slice(0, charIndex);
          if (charIndex === currentPhrase.length) {
            deleting = true;
            setTimeout(typeLoop, 1300);
            return;
          }
          setTimeout(typeLoop, 55);
          return;
        }

        charIndex -= 1;
        dynamicTextElement.textContent = currentPhrase.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(typeLoop, 260);
          return;
        }
        setTimeout(typeLoop, 30);
      };

      dynamicTextElement.textContent = "";
      setTimeout(typeLoop, 300);
    }
  }
}


// DÃ©filement doux pour les ancres internes
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Animations dâ€™apparition
document.addEventListener("DOMContentLoaded", () => {
  const burgerButton = document.getElementById("burger-button");
  const mobileMenu = document.getElementById("mobile-menu");

  if (burgerButton && mobileMenu) {
    burgerButton.addEventListener("click", () => {
      const isOpen = burgerButton.classList.toggle("is-open");
      mobileMenu.classList.toggle("is-open", isOpen);
      burgerButton.setAttribute("aria-expanded", String(isOpen));
      mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        burgerButton.classList.remove("is-open");
        mobileMenu.classList.remove("is-open");
        burgerButton.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-hidden", "true");
      });
    });
  }

  const fadeInRightElements = document.querySelectorAll(".animate-fade-in");
  const fadeInOpacityElements = document.querySelectorAll(".animate-fade-opacity");
  const delayBetween = 150;

  const handleIntersection = (elements, animationName) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting && !entry.target.classList.contains("animated")) {
            entry.target.classList.add("animated");
            setTimeout(() => {
              entry.target.style.animation = `${animationName} 1s ease forwards`;
            }, index * delayBetween);
          }
        });
      },
      { threshold: 0.1 }
    );
    elements.forEach((el) => observer.observe(el));
  };

  handleIntersection(fadeInRightElements, "fadeInRightBlur");
  handleIntersection(fadeInOpacityElements, "fadeInOpacity");
});
