import { H as Hls } from "./hls-core.js";

function ready(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

function setupMobileMenu() {
  const button = document.querySelector("[data-menu-button]");
  const panel = document.querySelector("[data-mobile-panel]");

  if (!button || !panel) {
    return;
  }

  button.addEventListener("click", () => {
    panel.classList.toggle("is-open");
  });
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function renderSearchResult(item) {
  return `
    <a class="search-result-item" href="${item.url}">
      <img src="${item.cover}" alt="${item.title}" loading="lazy">
      <span>
        <strong>${item.title}</strong>
        <small>${item.year} · ${item.region} · ${item.category}</small>
      </span>
    </a>
  `;
}

function setupSearch() {
  const boxes = document.querySelectorAll("[data-search-box]");
  const data = Array.isArray(window.SITE_SEARCH_DATA) ? window.SITE_SEARCH_DATA : [];

  boxes.forEach((box) => {
    const input = box.querySelector("[data-search-input]");
    const results = box.querySelector("[data-search-results]");

    if (!input || !results) {
      return;
    }

    input.addEventListener("input", () => {
      const query = normalizeText(input.value);

      if (!query) {
        results.classList.remove("is-open");
        results.innerHTML = "";
        return;
      }

      const matches = data.filter((item) => {
        const haystack = normalizeText(`${item.title} ${item.region} ${item.category} ${item.tags} ${item.desc}`);
        return haystack.includes(query);
      }).slice(0, 8);

      if (matches.length === 0) {
        results.classList.add("is-open");
        results.innerHTML = '<div class="search-empty">暂无匹配影片</div>';
        return;
      }

      results.classList.add("is-open");
      results.innerHTML = matches.map(renderSearchResult).join("");
    });

    document.addEventListener("click", (event) => {
      if (!box.contains(event.target)) {
        results.classList.remove("is-open");
      }
    });
  });
}

function setupHeroCarousel() {
  const root = document.querySelector("[data-hero-carousel]");

  if (!root) {
    return;
  }

  const slides = Array.from(root.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(root.querySelectorAll("[data-hero-dot]"));
  const prev = root.querySelector("[data-hero-prev]");
  const next = root.querySelector("[data-hero-next]");
  let current = 0;
  let timer = null;

  function activate(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === current);
    });
  }

  function restart() {
    window.clearInterval(timer);
    timer = window.setInterval(() => activate(current + 1), 5800);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      activate(index);
      restart();
    });
  });

  if (prev) {
    prev.addEventListener("click", () => {
      activate(current - 1);
      restart();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      activate(current + 1);
      restart();
    });
  }

  activate(0);
  restart();
}

function setupPlayers() {
  const stages = document.querySelectorAll(".video-stage");

  stages.forEach((stage) => {
    const video = stage.querySelector("video");
    const button = stage.querySelector("[data-play-button]");
    const url = stage.getAttribute("data-video-src");
    let hlsInstance = null;
    let initialized = false;

    if (!video || !button || !url) {
      return;
    }

    function startPlayback() {
      stage.classList.add("is-playing");
      video.setAttribute("controls", "controls");

      if (!initialized) {
        initialized = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
        } else if (Hls && Hls.isSupported()) {
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(url);
          hlsInstance.attachMedia(video);
        } else {
          video.src = url;
        }
      }

      const playResult = video.play();

      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(() => {
          stage.classList.remove("is-playing");
        });
      }
    }

    button.addEventListener("click", startPlayback);
    stage.addEventListener("click", (event) => {
      if (event.target === video && video.paused) {
        startPlayback();
      }
    });

    window.addEventListener("beforeunload", () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
}

ready(() => {
  setupMobileMenu();
  setupSearch();
  setupHeroCarousel();
  setupPlayers();
});
