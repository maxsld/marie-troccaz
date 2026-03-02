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


// Defilement doux pour les ancres internes
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (!href || href === "#") return;

    let target = null;
    try {
      target = document.querySelector(href);
    } catch {
      return;
    }

    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Animations d'apparition
document.addEventListener("DOMContentLoaded", () => {
  const bindReviewToggleHandlers = (scope = document) => {
    scope.querySelectorAll(".review-card__toggle").forEach((toggleButton) => {
      const reviewCard = toggleButton.closest(".review-card");
      if (!reviewCard) return;

      const excerpt = reviewCard.querySelector(".review-card__excerpt");
      const fullText = reviewCard.querySelector(".review-card__full");
      if (!excerpt || !fullText) return;

      toggleButton.addEventListener("click", () => {
        const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
        const nextExpanded = !isExpanded;

        excerpt.hidden = nextExpanded;
        fullText.hidden = !nextExpanded;
        toggleButton.setAttribute("aria-expanded", String(nextExpanded));
        toggleButton.textContent = nextExpanded ? "Voir moins" : "Voir plus";
      });
    });
  };

  const createAvatarPlaceholder = (authorName = "") => {
    const initials = authorName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "CL";

    const avatar = document.createElement("div");
    avatar.className = "review-card__avatar review-card__avatar--placeholder";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = initials;
    return avatar;
  };

  const formatReviewDate = (input) => {
    if (!input) return "";
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  };

  const createReviewCard = (review, isClone = false) => {
    const article = document.createElement("article");
    article.className = "review-card";
    if (isClone) article.setAttribute("aria-hidden", "true");

    const rawText = typeof review.text === "string" ? review.text.trim() : "";
    const text = rawText.length > 0 ? rawText : "Avis client Trustpilot.";
    const displayText = text.startsWith("“") || text.startsWith("\"") ? text : `“${text}”`;
    const maxExcerptLength = 230;

    const textParagraph = document.createElement("p");
    textParagraph.className = "review-card__text";

    if (!isClone && displayText.length > maxExcerptLength) {
      const excerpt = document.createElement("span");
      excerpt.className = "review-card__excerpt";
      excerpt.textContent = `${displayText.slice(0, maxExcerptLength).trim()}…`;

      const full = document.createElement("span");
      full.className = "review-card__full";
      full.hidden = true;
      full.textContent = displayText;

      textParagraph.append(excerpt, full);
      article.appendChild(textParagraph);

      const toggle = document.createElement("button");
      toggle.className = "review-card__toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Voir plus";
      article.appendChild(toggle);
    } else {
      textParagraph.textContent = displayText;
      article.appendChild(textParagraph);
    }

    const footer = document.createElement("div");
    footer.className = "review-card__footer";
    footer.appendChild(createAvatarPlaceholder(review.author || ""));

    const authorWrap = document.createElement("div");
    authorWrap.className = "review-card__author";

    const name = document.createElement("p");
    name.className = "review-card__name";
    name.textContent = review.author || "Client vérifié";

    const role = document.createElement("p");
    role.className = "review-card__role";
    const formattedDate = formatReviewDate(review.publishedAt);
    role.textContent = formattedDate ? `Avis Trustpilot • ${formattedDate}` : "Avis Trustpilot";

    authorWrap.append(name, role);
    footer.appendChild(authorWrap);
    article.appendChild(footer);

    return article;
  };

  const renderReviewsFromJson = (reviews) => {
    const track = document.getElementById("reviews-carousel-track");
    if (!track || !Array.isArray(reviews) || reviews.length === 0) return false;

    const normalized = reviews
      .map((review) => ({
        author: typeof review.author === "string" ? review.author.trim() : "",
        text: typeof review.text === "string" ? review.text.trim() : "",
        publishedAt: typeof review.publishedAt === "string" ? review.publishedAt : ""
      }))
      .filter((review) => review.text.length > 0)
      .slice(0, 8);

    if (normalized.length === 0) return false;

    track.innerHTML = "";
    normalized.forEach((review) => {
      track.appendChild(createReviewCard(review, false));
    });
    normalized.forEach((review) => {
      track.appendChild(createReviewCard(review, true));
    });

    bindReviewToggleHandlers(track);
    return true;
  };

  document.querySelectorAll("img").forEach((img) => {
    if (img.classList.contains("brand__logo") || img.closest(".hero")) {
      if (!img.hasAttribute("decoding")) img.decoding = "async";
      return;
    }
    if (!img.hasAttribute("loading")) img.loading = "lazy";
    if (!img.hasAttribute("decoding")) img.decoding = "async";
  });

  const marqueeTrack = document.querySelector(".marquee__track");
  if (marqueeTrack) {
    const visibleSlides = Array.from(marqueeTrack.querySelectorAll('img:not([aria-hidden="true"])'));
    const clonedSlides = Array.from(marqueeTrack.querySelectorAll('img[aria-hidden="true"]'));

    if (visibleSlides.length > 0) {
      const allCarouselImages = [
        "assets/img/carousel-01.webp",
        "assets/img/carousel-06.webp",
        "assets/img/carousel-07.webp",
        "assets/img/carousel-08.webp",
        "assets/img/carousel-09.webp",
        "assets/img/carousel-10.webp",
        "assets/img/carousel-12.webp",
        "assets/img/carousel-13.webp",
        "assets/img/carousel-14.webp",
        "assets/img/carousel-15.webp",
        "assets/img/carousel-24.webp",
        "assets/img/carousel-25.jpeg",
        "assets/img/carousel-26.jpeg",
        "assets/img/carousel-27.jpeg",
        "assets/img/carousel-28.jpeg",
        "assets/img/carousel-29.jpeg",
        "assets/img/carousel-30.jpeg",
        "assets/img/carousel-31.jpeg",
        "assets/img/carousel-16.webp",
        "assets/img/carousel-17.webp",
        "assets/img/carousel-18.webp",
        "assets/img/carousel-19.webp",
        "assets/img/carousel-21.webp",
        "assets/img/carousel-22.webp",
        "assets/img/carousel-23.webp",
      ];

      for (let i = allCarouselImages.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCarouselImages[i], allCarouselImages[j]] = [allCarouselImages[j], allCarouselImages[i]];
      }

      const selectedImages = allCarouselImages.slice(0, visibleSlides.length);

      visibleSlides.forEach((img, index) => {
        img.src = selectedImages[index];
        img.alt = `Photo accompagnement ${index + 1}`;
      });

      clonedSlides.forEach((img, index) => {
        img.src = selectedImages[index % selectedImages.length];
        img.alt = "";
        img.setAttribute("aria-hidden", "true");
      });
    }
  }

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

  const aboutToggleButton = document.getElementById("about-toggle-btn");
  const aboutMoreText = document.getElementById("about-more-text");

  if (aboutToggleButton && aboutMoreText) {
    aboutMoreText.style.maxHeight = "0px";

    aboutToggleButton.addEventListener("click", () => {
      const isExpanded = aboutToggleButton.getAttribute("aria-expanded") === "true";
      const nextExpanded = !isExpanded;

      aboutMoreText.classList.toggle("is-open", nextExpanded);
      aboutMoreText.style.maxHeight = nextExpanded ? `${aboutMoreText.scrollHeight}px` : "0px";
      aboutToggleButton.setAttribute("aria-expanded", String(nextExpanded));
      aboutMoreText.setAttribute("aria-hidden", String(!nextExpanded));
      aboutToggleButton.textContent = nextExpanded ? "Voir moins" : "Voir plus";
    });
  }

  bindReviewToggleHandlers();

  const reviewsTrack = document.getElementById("reviews-carousel-track");
  if (reviewsTrack) {
    const source = reviewsTrack.dataset.source || "assets/data/trustpilot-reviews.json";
    fetch(source, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload || !Array.isArray(payload.reviews)) return;
        renderReviewsFromJson(payload.reviews);
      })
      .catch(() => {
        // Fallback: keep static reviews from HTML when feed is unavailable.
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

  const scrollWritingElement = document.getElementById("scroll-writing-text");
  const scrollWritingSection = document.querySelector(".scroll-writing");
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    const methodTimeline = document.getElementById("method-timeline");
    const methodLineProgress = document.getElementById("method-line-progress");
    const methodSteps = gsap.utils.toArray(".method-step");

    if (methodTimeline && methodLineProgress && methodSteps.length > 0) {
      gsap.fromTo(
        methodLineProgress,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: methodTimeline,
            start: "top center",
            end: "bottom center",
            scrub: true,
            invalidateOnRefresh: true
          }
        }
      );

    }

    if (scrollWritingElement) {
      const fullText = scrollWritingElement.dataset.fulltext || "";
      if (fullText.length) {
        scrollWritingElement.textContent = "\u00A0";
        const typingState = { progress: 0 };

        gsap.to(typingState, {
          progress: 1,
          ease: "none",
          scrollTrigger: {
            trigger: scrollWritingSection || scrollWritingElement,
            start: "top 92%",
            end: "+=1200",
            scrub: true,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          },
          onUpdate: () => {
            const lettersCount = Math.round(typingState.progress * fullText.length);
            scrollWritingElement.textContent = lettersCount > 0 ? fullText.slice(0, lettersCount) : "\u00A0";
          },
          onComplete: () => {
            scrollWritingElement.textContent = fullText;
          },
          onReverseComplete: () => {
            scrollWritingElement.textContent = "\u00A0";
          }
        });
      }
    }

    ScrollTrigger.refresh();
  }

  const faqCards = document.querySelectorAll(".faq-card");
  faqCards.forEach((card) => {
    const button = card.querySelector(".faq-card__q");
    const panel = card.querySelector(".faq-card__a");
    const icon = card.querySelector(".faq-card__icon");
    if (!button || !panel || !icon) return;

    if (card.classList.contains("is-open")) {
      panel.style.maxHeight = `${panel.scrollHeight}px`;
      button.setAttribute("aria-expanded", "true");
      panel.setAttribute("aria-hidden", "false");
      icon.textContent = "−";
    }

    button.addEventListener("click", () => {
      const isOpen = card.classList.contains("is-open");

      faqCards.forEach((otherCard) => {
        const otherButton = otherCard.querySelector(".faq-card__q");
        const otherPanel = otherCard.querySelector(".faq-card__a");
        const otherIcon = otherCard.querySelector(".faq-card__icon");
        if (!otherButton || !otherPanel || !otherIcon) return;
        otherCard.classList.remove("is-open");
        otherPanel.style.maxHeight = "0px";
        otherButton.setAttribute("aria-expanded", "false");
        otherPanel.setAttribute("aria-hidden", "true");
        otherIcon.textContent = "+";
      });

      if (!isOpen) {
        card.classList.add("is-open");
        panel.style.maxHeight = `${panel.scrollHeight}px`;
        button.setAttribute("aria-expanded", "true");
        panel.setAttribute("aria-hidden", "false");
        icon.textContent = "−";
      }
    });
  });
});
