(function () {
    function ready(callback) {
        if (document.readyState !== "loading") {
            callback();
        } else {
            document.addEventListener("DOMContentLoaded", callback);
        }
    }

    function initMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-menu]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }

        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var title = hero.querySelector("[data-hero-title]");
        var desc = hero.querySelector("[data-hero-desc]");
        var href = hero.querySelector("[data-hero-link]");
        var panelImage = hero.querySelector("[data-hero-panel-image]");
        var panelTitle = hero.querySelector("[data-hero-panel-title]");
        var panelDesc = hero.querySelector("[data-hero-panel-desc]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });

            var current = slides[index];
            var data = current.dataset;
            if (title) {
                title.textContent = data.title || "";
            }
            if (desc) {
                desc.textContent = data.desc || "";
            }
            if (href) {
                href.setAttribute("href", data.href || "#");
            }
            if (panelImage) {
                panelImage.setAttribute("src", data.image || "");
                panelImage.setAttribute("alt", (data.title || "") + " 在线观看");
            }
            if (panelTitle) {
                panelTitle.textContent = data.title || "";
            }
            if (panelDesc) {
                panelDesc.textContent = data.genre || "";
            }
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener("click", function () {
                show(dotIndex);
                start();
            });
        });

        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initHomeSearch() {
        var forms = Array.prototype.slice.call(document.querySelectorAll("[data-home-search]"));
        forms.forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var input = form.querySelector("input");
                var query = input ? input.value.trim() : "";
                var target = "search.html";
                if (query) {
                    target += "?q=" + encodeURIComponent(query);
                }
                window.location.href = target;
            });
        });
    }

    function initFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
        panels.forEach(function (panel) {
            var input = panel.querySelector("[data-search-input]");
            var buttons = Array.prototype.slice.call(panel.querySelectorAll("[data-filter]"));
            var targetSelector = panel.getAttribute("data-filter-target") || "[data-filter-grid]";
            var grid = document.querySelector(targetSelector);
            if (!grid) {
                grid = panel.nextElementSibling;
            }
            if (!grid) {
                return;
            }
            var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-card]"));
            var empty = document.querySelector(panel.getAttribute("data-empty-target") || "[data-empty-state]");
            var active = "all";

            function apply() {
                var query = input ? input.value.trim().toLowerCase() : "";
                var visible = 0;

                cards.forEach(function (card) {
                    var text = (card.getAttribute("data-card-text") || card.textContent || "").toLowerCase();
                    var matchQuery = !query || text.indexOf(query) !== -1;
                    var matchFilter = active === "all" || text.indexOf(active.toLowerCase()) !== -1;
                    var show = matchQuery && matchFilter;
                    card.style.display = show ? "" : "none";
                    if (show) {
                        visible += 1;
                    }
                });

                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            }

            buttons.forEach(function (button) {
                button.addEventListener("click", function () {
                    active = button.getAttribute("data-filter") || "all";
                    buttons.forEach(function (btn) {
                        btn.classList.toggle("is-active", btn === button);
                    });
                    apply();
                });
            });

            if (input) {
                var params = new URLSearchParams(window.location.search);
                var queryValue = params.get("q");
                if (queryValue) {
                    input.value = queryValue;
                }
                input.addEventListener("input", apply);
            }

            apply();
        });
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
        players.forEach(function (player) {
            var video = player.querySelector("video");
            var button = player.querySelector("[data-play-button]");
            if (!video || !button) {
                return;
            }

            function prepareVideo() {
                if (video.dataset.ready === "true") {
                    return;
                }
                var source = video.getAttribute("data-src");
                if (!source) {
                    return;
                }

                if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: false
                    });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    video._hls = hls;
                } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = source;
                } else {
                    video.src = source;
                }
                video.dataset.ready = "true";
            }

            function playVideo() {
                prepareVideo();
                video.controls = true;
                player.classList.add("is-playing");
                var promise = video.play();
                if (promise && typeof promise.catch === "function") {
                    promise.catch(function () {
                        player.classList.remove("is-playing");
                    });
                }
            }

            button.addEventListener("click", playVideo);
            video.addEventListener("play", function () {
                player.classList.add("is-playing");
            });
            video.addEventListener("pause", function () {
                if (video.currentTime === 0 || video.ended) {
                    player.classList.remove("is-playing");
                }
            });
            video.addEventListener("ended", function () {
                player.classList.remove("is-playing");
            });
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initHomeSearch();
        initFilters();
        initPlayers();
    });
})();
