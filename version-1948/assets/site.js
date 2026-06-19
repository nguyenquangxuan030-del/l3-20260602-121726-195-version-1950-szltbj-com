(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function initMobileNav() {
        var toggle = document.querySelector("[data-mobile-toggle]");
        var nav = document.querySelector("[data-nav]");
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener("click", function () {
            nav.classList.toggle("open");
        });
    }

    function initImageFallbacks() {
        var images = document.querySelectorAll("img");
        images.forEach(function (img) {
            img.addEventListener("error", function () {
                var parent = img.closest(".card-media, .hero-image-wrap, .detail-cover");
                if (parent) {
                    parent.classList.add("image-broken");
                }
                img.setAttribute("aria-hidden", "true");
            });
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var next = hero.querySelector("[data-hero-next]");
        var prev = hero.querySelector("[data-hero-prev]");
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("active", i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("active", i === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                show(i);
                start();
            });
        });
        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                start();
            });
        }
        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                start();
            });
        }
        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initFilters() {
        var input = document.querySelector("[data-search-input]");
        var typeSelect = document.querySelector("[data-type-filter]");
        var regionSelect = document.querySelector("[data-region-filter]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
        var count = document.querySelector("[data-result-count]");
        if (!cards.length) {
            return;
        }

        function normalize(value) {
            return String(value || "").trim().toLowerCase();
        }

        function apply() {
            var q = normalize(input ? input.value : "");
            var type = typeSelect ? typeSelect.value : "";
            var region = regionSelect ? regionSelect.value : "";
            var visible = 0;
            cards.forEach(function (card) {
                var text = normalize(card.getAttribute("data-title") + " " + card.getAttribute("data-tags") + " " + card.getAttribute("data-summary"));
                var matchText = !q || text.indexOf(q) !== -1;
                var matchType = !type || card.getAttribute("data-type") === type;
                var matchRegion = !region || card.getAttribute("data-region") === region;
                var ok = matchText && matchType && matchRegion;
                card.classList.toggle("hidden-by-filter", !ok);
                if (ok) {
                    visible += 1;
                }
            });
            if (count) {
                count.textContent = String(visible);
            }
        }

        [input, typeSelect, regionSelect].forEach(function (el) {
            if (el) {
                el.addEventListener("input", apply);
                el.addEventListener("change", apply);
            }
        });
        apply();
    }

    function initHlsPlayers() {
        var players = document.querySelectorAll("video[data-hls]");
        players.forEach(function (video) {
            var src = video.getAttribute("data-hls");
            if (!src) {
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(src);
                hls.attachMedia(video);
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = src;
            } else {
                video.src = src;
            }
        });
    }

    function initPlayButtons() {
        var buttons = document.querySelectorAll("[data-play-target]");
        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                var selector = button.getAttribute("data-play-target");
                var video = document.querySelector(selector);
                if (!video) {
                    return;
                }
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            });
        });
    }

    ready(function () {
        initMobileNav();
        initImageFallbacks();
        initHero();
        initFilters();
        initHlsPlayers();
        initPlayButtons();
    });
})();
